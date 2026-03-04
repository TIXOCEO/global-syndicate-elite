import { FastifyInstance } from "fastify";
import { CrimeDefinitions } from "../game/crimeDefinitions";
import { applyResourceDelta } from "../lib/resourceMutations";
import { assertEnergyAvailable } from "../lib/energyValidation";

const rateLimitMap = new Map<string, number>();

function computeShootingXP(cash: number) {
  return 4 + Math.floor(1.5 * Math.log(1 + cash / 100));
}

function computeSmugglingXP(cash: number) {
  return 4 + Math.floor(1.8 * Math.log(1 + cash / 150));
}

function computeRXP(cash: number) {
  return Math.round(8 + 0.8 * Math.log(1 + cash));
}

function getRXPMultiplier(tier: number): number {
  if (tier >= 10) return 1.15;
  if (tier >= 7) return 1.1;
  if (tier >= 4) return 1.05;
  return 1.0;
}

function requiredRXPForTier(t: number) {
  return Math.round(500 * Math.pow(t, 1.85));
}

export async function crimeRoutes(app: FastifyInstance) {

  app.post(
    "/crimes/commit",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const accountId = req.user.accountId;

      // ✅ RATE LIMIT (2 seconds)
      const lastCall = rateLimitMap.get(accountId);
      const now = Date.now();
      if (lastCall && now - lastCall < 2000) {
        app.log.warn(`Rate limit hit for account ${accountId}`);
        return reply.code(429).send({
          error: "Too many requests",
          retryAfterMs: 2000 - (now - lastCall)
        });
      }
      rateLimitMap.set(accountId, now);

      const { crimeType } = req.body;
      const def = CrimeDefinitions[crimeType as keyof typeof CrimeDefinitions];
      if (!def) {
        return reply.code(400).send({ error: "Invalid crime type" });
      }

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          energy: true,
          skills: true,
          jail: true,
          cooldown: true
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      if (character.status === "DEAD") {
        return reply.code(403).send({ error: "Character is dead" });
      }

      if ((character.jail?.jailRemainingSeconds ?? 0) > 0) {
        return reply.code(403).send({ error: "Character is jailed" });
      }

      const currentEnergy = character.energy?.energy ?? 0;
      try {
        assertEnergyAvailable(currentEnergy, def.energyCost);
      } catch {
        return reply.code(400).send({ error: "Not enough energy" });
      }

      await app.prisma.energy.update({
        where: { characterId: character.id },
        data: { energy: { decrement: def.energyCost } }
      });

      const skillValue =
        def.skillFocus === "shooting"
          ? character.skills?.shooting ?? 0
          : character.skills?.smuggling ?? 0;

      let successChance =
        def.baseSuccessChance +
        0.0025 * skillValue +
        0.015 * (character.tier - 1);

      if (character.status === "CRITICAL") {
        successChance -= 0.15;
      }

      successChance = Math.min(0.95, Math.max(0.35, successChance));
      const success = Math.random() < successChance;

      let cashReward = 0;
      let leadReward = 0;
      let shootingXP = 0;
      let smugglingXP = 0;
      let rxpGain = 0;
      let tierUp = false;

      if (success) {
        cashReward = Math.round(
          def.baseCash * (1 + 0.05 * (character.tier - 1))
        );

        if (Math.random() < def.baseLeadDropChance) {
          leadReward = Math.floor(Math.random() * 5) + 2;
        }

        if (character.status === "CRITICAL") {
          cashReward = Math.round(cashReward * 0.6);
          leadReward = Math.round(leadReward * 0.6);
        }

        await applyResourceDelta(app.prisma, character.id, {
          cash: cashReward,
          lead: leadReward
        });

        if (def.skillFocus === "shooting") {
          shootingXP = computeShootingXP(cashReward);
        } else {
          smugglingXP = computeSmugglingXP(cashReward);
        }

        const baseRXP = computeRXP(cashReward);
        rxpGain = Math.round(baseRXP * getRXPMultiplier(character.tier));
      }

      await app.prisma.$transaction(async (tx) => {

        if (shootingXP > 0) {
          await tx.skills.update({
            where: { characterId: character.id },
            data: { shooting: { increment: shootingXP } }
          });
        }

        if (smugglingXP > 0) {
          await tx.skills.update({
            where: { characterId: character.id },
            data: { smuggling: { increment: smugglingXP } }
          });
        }

        if (rxpGain > 0) {
          let newRXP = character.rxp + rxpGain;
          let newTier = character.tier;

          while (
            newTier < 10 &&
            newRXP >= requiredRXPForTier(newTier)
          ) {
            newRXP -= requiredRXPForTier(newTier);
            newTier++;
            tierUp = true;
          }

          await tx.character.update({
            where: { id: character.id },
            data: { rxp: newRXP, tier: newTier }
          });
        }

        await tx.crimeLog.create({
          data: {
            characterId: character.id,
            crimeType,
            success,
            cashGranted: cashReward,
            leadGranted: leadReward,
            shootingXpGranted: shootingXP,
            smugglingXpGranted: smugglingXP,
            rxpGranted: rxpGain,
            energyConsumed: def.energyCost
          }
        });

        await tx.character.update({
          where: { id: character.id },
          data: { lastCrimeAt: new Date() }
        });
      });

      return {
        success,
        cashReward,
        leadReward,
        shootingXP,
        smugglingXP,
        rxpGain,
        tierUp
      };
    }
  );
}
