import { FastifyInstance } from "fastify";
import { CrimeDefinitions } from "../game/crimeDefinitions";
import { applyResourceDelta } from "../lib/resourceMutations";
import { assertEnergyAvailable } from "../lib/energyValidation";

function computeShootingXP(cash: number) {
  return 4 + Math.floor(1.5 * Math.log(1 + cash / 100));
}

function computeSmugglingXP(cash: number) {
  return 4 + Math.floor(1.8 * Math.log(1 + cash / 150));
}

function computeRXP(cash: number) {
  return Math.round(8 + 0.8 * Math.log(1 + cash));
}

function requiredRXPForTier(t: number) {
  return Math.round(500 * Math.pow(t, 1.85));
}

export async function crimeRoutes(app: FastifyInstance) {
  app.post(
    "/crimes/commit",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { crimeType } = req.body;
      const accountId = req.user.accountId;

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
          jail: true
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
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

      // 🔥 HARDER EARLY GAME SUCCESS CURVE

      let successChance =
        def.baseSuccessChance +
        0.0025 * skillValue +
        0.015 * (character.tier - 1);

      // Inexperience penalty (stronger than before)
      const inexperiencePenalty =
        Math.max(0, 25 - skillValue) * 0.006;

      successChance -= inexperiencePenalty;

      if (character.status === "CRITICAL") {
        successChance -= 0.15;
      }

      successChance = Math.min(0.85, Math.max(0.30, successChance));

      const success = Math.random() < successChance;

      let cashReward = 0;
      let leadReward = 0;
      let shootingXP = 0;
      let smugglingXP = 0;
      let rxpGain = 0;
      let tierUp = false;
      let hpDamage = 0;
      let jailed = false;

      if (success) {

        const variance = 0.75 + Math.random() * 0.5;

        cashReward = Math.round(
          def.baseCash *
          variance *
          (1 + 0.05 * (character.tier - 1))
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

        rxpGain = computeRXP(cashReward);

      } else {

        leadReward = Math.floor(Math.random() * 5) + 2;

        hpDamage = Math.floor(Math.random() * 9) + 6 + character.tier;

        await applyResourceDelta(app.prisma, character.id, {
          lead: leadReward
        });

        const newHP = Math.max(0, character.hp - hpDamage);

        let newStatus = character.status;

        if (newHP <= 150 && newHP > 0) {
          newStatus = "CRITICAL";
        }

        if (newHP === 0) {
          newStatus = "DEAD";
        }

        await app.prisma.character.update({
          where: { id: character.id },
          data: {
            hp: newHP,
            status: newStatus
          }
        });

        const base = 0.50;
        const leadFactor = character.lead / 100;
        const skillReduction = skillValue * 0.002;
        const tierReduction = (character.tier - 1) * 0.01;

        let arrestChance =
          base + leadFactor - skillReduction - tierReduction;

        arrestChance = Math.min(0.75, Math.max(0.50, arrestChance));

        if (Math.random() < arrestChance) {
          jailed = true;

          const jailTime = 120 + Math.floor(Math.random() * 180);

          await app.prisma.jailState.update({
            where: { characterId: character.id },
            data: {
              jailRemainingSeconds: jailTime,
              lastUpdatedAt: new Date()
            }
          });
        }
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
            data: {
              rxp: newRXP,
              tier: newTier
            }
          });
        }

        await tx.crimeLog.create({
          data: {
            characterId: character.id,
            crimeType,
            success,
            cashGranted: cashReward,
            leadGranted: leadReward,
            energyConsumed: def.energyCost
          }
        });
      });

      return {
        success,
        cashReward,
        leadReward,
        shootingXP,
        smugglingXP,
        rxpGain,
        tierUp,
        hpDamage,
        jailed
      };
    }
  );
}
