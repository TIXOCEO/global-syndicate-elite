import { FastifyInstance } from "fastify";

export async function resourceRoutes(app: FastifyInstance) {
  app.get(
    "/character/resources",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        select: {
          id: true,
          nickname: true,
          tier: true,
          rxp: true,
          hp: true,
          status: true,
          cash: true,
          lead: true,
          bullets: true,
          injurySeverity: true,
          recoveryUntil: true,
          medkitCooldownUntil: true,
          energy: {
            select: { energy: true }
          },
          skills: {
            select: {
              shooting: true,
              smuggling: true,
              investigation: true,
              jailXp: true
            }
          }
        }
      });

      if (!character) {
        return reply.code(404).send({
          error: "No active character"
        });
      }

      return {
        id: character.id,
        nickname: character.nickname,
        tier: character.tier,
        rxp: character.rxp,
        hp: character.hp,
        status: character.status,
        injurySeverity: character.injurySeverity,
        recoveryUntil: character.recoveryUntil?.getTime() ?? null,
        medkitCooldownUntil: character.medkitCooldownUntil?.getTime() ?? null,
        wallet: {
          cash: character.cash,
          lead: character.lead,
          bullets: character.bullets
        },
        energy: character.energy?.energy ?? 0,
        skills: character.skills ?? {
          shooting: 0,
          smuggling: 0,
          investigation: 0,
          jailXp: 0
        }
      };
    }
  );
}
