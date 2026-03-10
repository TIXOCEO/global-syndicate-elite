import { FastifyInstance } from "fastify";
import { emitInvestigationResult } from "../lib/wsEmitter";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export async function investigationRoutes(app: FastifyInstance) {
  app.post(
    "/investigate/attack",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const { combatLogId } = req.body;
      const accountId = req.user.accountId;

      if (!combatLogId) {
        return reply.code(400).send({ error: "Missing combatLogId" });
      }

      const viewer = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          skills: true
        }
      });

      if (!viewer) {
        return reply.code(404).send({ error: "No active character" });
      }

      const combatLog = await app.prisma.combatLog.findUnique({
        where: { id: combatLogId }
      });

      if (!combatLog) {
        return reply.code(404).send({ error: "Combat log not found" });
      }

      if (combatLog.defenderId !== viewer.id) {
        return reply.code(403).send({
          error: "You can only investigate attacks against yourself"
        });
      }

      const attacker = await app.prisma.character.findUnique({
        where: { id: combatLog.attackerId }
      });

      if (!attacker) {
        return reply.code(404).send({ error: "Attacker not found" });
      }

      const cost = 400 + 5 * (attacker.notoriety ?? 0);

      if (viewer.cash < cost) {
        return reply.code(400).send({ error: "Not enough cash" });
      }

      const IS = viewer.skills?.investigation ?? 0;

      const CS = clamp(
        10 - Math.floor((attacker.notoriety ?? 0) / 80),
        0,
        60
      );

      const P_identify = clamp(
        0.14 + 0.007 * IS - 0.003 * CS,
        0.05,
        0.9
      );

      const success = Math.random() < P_identify;

      const P_false = clamp(
        0.10 - 0.0008 * IS + 0.0012 * CS,
        0.02,
        0.18
      );

      const falseSuspect = !success && Math.random() < P_false;

      await app.prisma.$transaction(async (tx) => {
        await tx.character.update({
          where: { id: viewer.id },
          data: {
            cash: { decrement: cost }
          }
        });

        await tx.skills.update({
          where: { characterId: viewer.id },
          data: {
            investigation: {
              increment: success ? 8 : 3
            }
          }
        });
      });

      if (success) {
        await emitInvestigationResult({
          viewerCharacterId: viewer.id,
          attackerCharacterId: attacker.id
        });

        return {
          success: true,
          attackerCharacterId: attacker.id
        };
      }

      if (falseSuspect) {
        const randomCharacter = await app.prisma.character.findFirst({
          where: {
            id: { not: attacker.id }
          },
          select: {
            id: true
          }
        });

        return {
          success: false,
          falseSuspect: true,
          suspectId: randomCharacter?.id ?? null
        };
      }

      return {
        success: false,
        message: "Investigation failed"
      };
    }
  );
}
