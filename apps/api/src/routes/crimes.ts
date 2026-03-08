import { FastifyInstance } from "fastify";
import { CrimeDefinitions } from "../game/crimeDefinitions";
import { applyResourceDelta } from "../lib/resourceMutations";
import { assertEnergyAvailable } from "../lib/energyValidation";
import { emitStateUpdate, emitCrimeResult } from "../lib/wsEmitter";

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

function requiredRXPForTier(t: number) {
  return Math.round(500 * Math.pow(t, 1.85));
}

export async function crimeRoutes(app: FastifyInstance) {
  app.post(
    "/crimes/commit",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const accountId = req.user.accountId;

      const lastCall = rateLimitMap.get(accountId);
      const now = Date.now();

      if (lastCall && now - lastCall < 2000) {
        return reply.code(429).send({
          error: "Too many requests",
          retryAfterMs: 2000 - (now - lastCall)
        });
      }

      rateLimitMap.set(accountId, now);

      const { crimeType } = req.body;

      const def =
        CrimeDefinitions[crimeType as keyof typeof CrimeDefinitions];

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

      // GLOBAL COOLDOWN CHECK
      if (character.cooldown) {

        const lastUsed = new Date(character.cooldown.lastUsedAt).getTime();
        const lastCrimeType = character.cooldown.crimeType;

        const lastDef =
          CrimeDefinitions[lastCrimeType as keyof typeof CrimeDefinitions];

        if (lastDef) {

          const cooldownSeconds = lastDef.cooldownSeconds;

          const secondsSince = (Date.now() - lastUsed) / 1000;

          if (secondsSince < cooldownSeconds) {

            return reply.code(429).send({
              error: "Crime on cooldown",
              cooldownRemainingSeconds: Math.ceil(
                cooldownSeconds - secondsSince
              )
            });

          }
        }
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

      const inexperiencePenalty = Math.max(0, 25 - skillValue) * 0.006;

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
      let leadLost = 0;

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

        if (Math.random() < 0.5) {

          leadLost = Math.min(
            character.lead,
            Math.floor(Math.random() * def.leadLossMax) + 1
          );

          await applyResourceDelta(app.prisma, character.id, {
            lead: -leadLost
          });

        }

        hpDamage = Math.floor(Math.random() * 9) + 6 + character.tier;

        const newHP = Math.max(0, character.hp - hpDamage);

        let newStatus: "ACTIVE" | "CRITICAL" | "DEAD" = character.status;

        if (newHP <= 150 && newHP > 0) newStatus = "CRITICAL";

        if (newHP === 0) newStatus = "DEAD";

        await app.prisma.character.update({
          where: { id: character.id },
          data: { hp: newHP, status: newStatus }
        });

      }

      // SAVE COOLDOWN
      await app.prisma.crimeCooldown.upsert({
        where: { characterId: character.id },
        update: {
          crimeType,
          lastUsedAt: new Date()
        },
        create: {
          characterId: character.id,
          crimeType,
          lastUsedAt: new Date()
        }
      });

      await emitCrimeResult({
        characterId: character.id,
        success,
        cashReward,
        leadReward,
        leadLost,
        shootingXP,
        smugglingXP,
        rxpGain,
        tierUp,
        hpDamage,
        jailed
      });

      return {
        success,
        cashReward,
        leadReward,
        leadLost,
        shootingXP,
        smugglingXP,
        rxpGain,
        tierUp,
        hpDamage,
        jailed,
        cooldownRemainingSeconds: def.cooldownSeconds
      };

    }
  );
}
