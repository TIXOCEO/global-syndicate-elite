import { FastifyInstance } from "fastify";
import { emitIntelDiscovered } from "../lib/wsEmitter";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export async function detectiveRoutes(app: FastifyInstance) {
  app.post(
    "/detectives/search",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const { targetCharacterId } = req.body;
      const accountId = req.user.accountId;

      if (!targetCharacterId) {
        return reply.code(400).send({ error: "Missing targetCharacterId" });
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

      if (viewer.id === targetCharacterId) {
        return reply.code(400).send({ error: "Cannot investigate yourself" });
      }

      const target = await app.prisma.character.findUnique({
        where: { id: targetCharacterId }
      });

      if (!target) {
        return reply.code(404).send({ error: "Target not found" });
      }

      const cooldown = await app.prisma.detectiveCooldown.findFirst({
        where: {
          viewerCharacterId: viewer.id,
          targetCharacterId
        }
      });

      if (cooldown && cooldown.cooldownUntil.getTime() > Date.now()) {
        return reply.code(429).send({
          error: "Detective cooldown active"
        });
      }

      const severityBracket = Math.floor((target.injurySeverity ?? 0) / 20);

      const cost =
        800 +
        12 * (target.notoriety ?? 0) +
        25 * severityBracket;

      if (viewer.cash < cost) {
        return reply.code(400).send({ error: "Not enough cash" });
      }

      const IS = viewer.skills?.investigation ?? 0;

      const CS = clamp(
        10 +
          0 +
          0 +
          0 -
          Math.floor((target.notoriety ?? 0) / 80),
        0,
        60
      );

      const P_identify = clamp(
        0.12 + 0.006 * IS - 0.003 * CS,
        0.05,
        0.85
      );

      const success = Math.random() < P_identify;

      const P_false = clamp(
        0.10 - 0.0008 * IS + 0.0012 * CS,
        0.02,
        0.18
      );

      const falseIntel = !success && Math.random() < P_false;

      await app.prisma.$transaction(async (tx) => {
        await tx.character.update({
          where: { id: viewer.id },
          data: {
            cash: { decrement: cost }
          }
        });

        await tx.detectiveCooldown.upsert({
          where: {
            viewer_target_unique: {
              viewerCharacterId: viewer.id,
              targetCharacterId
            }
          },
          update: {
            cooldownUntil: new Date(Date.now() + 30 * 60 * 1000)
          },
          create: {
            viewerCharacterId: viewer.id,
            targetCharacterId,
            cooldownUntil: new Date(Date.now() + 30 * 60 * 1000)
          }
        });

        await tx.skills.update({
          where: { characterId: viewer.id },
          data: {
            investigation: {
              increment: success ? 6 : 2
            }
          }
        });

        if (success || falseIntel) {
          const expires =
            success
              ? new Date(Date.now() + 6 * 60 * 60 * 1000)
              : new Date(Date.now() + 60 * 60 * 1000);

          const country = success
            ? target.currentCountryId
            : "UNKNOWN";

          await tx.knownLocation.create({
            data: {
              viewerCharacterId: viewer.id,
              targetCharacterId,
              countryId: country,
              expiresAt: expires,
              isFalseIntel: falseIntel
            }
          });

          if (success) {
            await emitIntelDiscovered({
              viewerCharacterId: viewer.id,
              targetCharacterId,
              countryId: country,
              expiresAt: expires.getTime()
            });
          }
        }
      });

      if (success) {
        return {
          success: true,
          countryId: target.currentCountryId,
          expiresIn: 6 * 60 * 60
        };
      }

      if (falseIntel) {
        return {
          success: false,
          falseIntel: true,
          message: "False lead discovered"
        };
      }

      return {
        success: false,
        message: "Detective search failed"
      };
    }
  );
}
