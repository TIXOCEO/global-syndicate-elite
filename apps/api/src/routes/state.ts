import { FastifyInstance } from "fastify";
import { CrimeDefinitions } from "../game/crimeDefinitions";

export async function stateRoutes(app: FastifyInstance) {

  app.get(
    "/state/sync",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          energy: true,
          skills: true,
          jail: true,
          cooldown: true,
          aircraft: true
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      let cooldownRemaining = 0;

      if (character.cooldown) {

        const lastUsed = new Date(character.cooldown.lastUsedAt).getTime();

        const lastCrimeType = character.cooldown.crimeType;

        const lastDef =
          CrimeDefinitions[lastCrimeType as keyof typeof CrimeDefinitions];

        if (lastDef) {

          const secondsSince = (Date.now() - lastUsed) / 1000;

          cooldownRemaining = Math.max(
            0,
            Math.ceil(lastDef.cooldownSeconds - secondsSince)
          );

        }

      }

      const recoveryRemaining =
        character.recoveryUntil
          ? Math.max(0, character.recoveryUntil.getTime() - Date.now())
          : 0;

      const medkitCooldownRemaining =
        character.medkitCooldownUntil
          ? Math.max(0, character.medkitCooldownUntil.getTime() - Date.now())
          : 0;

      const travelCooldownRemaining =
        character.travelCooldownUntil
          ? Math.max(0, character.travelCooldownUntil.getTime() - Date.now())
          : 0;

      return {

        character: {
          id: character.id,
          nickname: character.nickname,
          tier: character.tier,
          hp: character.hp,
          notoriety: character.notoriety,
          status: character.status,
          rxp: character.rxp,
          injurySeverity: character.injurySeverity,
          recoveryUntil: character.recoveryUntil?.getTime() ?? null,
          recoveryRemaining,
          medkitCooldownUntil: character.medkitCooldownUntil?.getTime() ?? null,
          medkitCooldownRemaining,
          currentCountryId: character.currentCountryId
        },

        resources: {
          cash: character.cash,
          lead: character.lead,
          bullets: character.bullets,
          energy: character.energy?.energy ?? 0
        },

        skills: {
          shooting: character.skills?.shooting ?? 0,
          smuggling: character.skills?.smuggling ?? 0,
          investigation: character.skills?.investigation ?? 0,
          jailXp: character.skills?.jailXp ?? 0,
          bustSkillXP: character.skills?.bustSkillXP ?? 0
        },

        aircraft: {
          tier: character.aircraft?.aircraftTier ?? 1
        },

        jail: {
          remaining: character.jail?.jailRemainingSeconds ?? 0
        },

        cooldown: {
          remaining: cooldownRemaining
        },

        travel: {
          cooldownUntil: character.travelCooldownUntil?.getTime() ?? null,
          remaining: travelCooldownRemaining
        }

      };

    }
  );

}
