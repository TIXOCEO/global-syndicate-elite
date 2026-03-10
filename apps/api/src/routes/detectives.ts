import { FastifyInstance } from "fastify";
import { emitIntelDiscovered } from "../lib/wsEmitter";

export async function detectiveRoutes(app: FastifyInstance) {

  app.post(
    "/detectives/search",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { targetCharacterId } = req.body;
      const accountId = req.user.accountId;

      const viewer = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: { skills: true }
      });

      if (!viewer) {
        return reply.code(404).send({ error: "No active character" });
      }

      if (viewer.id === targetCharacterId) {
        return reply.code(400).send({ error: "Cannot search yourself" });
      }

      const target = await app.prisma.character.findUnique({
        where: { id: targetCharacterId }
      });

      if (!target) {
        return reply.code(404).send({ error: "Target not found" });
      }

      /*
      Cooldown validation
      */

      const cooldown = await app.prisma.detectiveCooldown.findFirst({
        where: {
          viewerCharacterId: viewer.id,
          targetCharacterId
        }
      });

      if (cooldown && cooldown.cooldownUntil > new Date()) {
        return reply.code(429).send({
          error: "Detective cooldown active"
        });
      }

      /*
      Cost calculation
      */

      const severityBracket =
        Math.floor((target.injurySeverity ?? 0) / 20);

      const cost =
        800 +
        12 * target.notoriety +
        25 * severityBracket;

      if (viewer.cash < cost) {
        return reply.code(400).send({
          error: "Insufficient cash"
        });
      }

      /*
      Investigation probability
      */

      const IS = viewer.skills?.investigation ?? 0;

      const CS = Math.max(
        0,
        Math.min(
          60,
          10 - Math.floor(target.notoriety / 80)
        )
      );

      const pIdentify = Math.max(
        0.05,
        Math.min(
          0.85,
          (0.12 + 0.006 * IS) - (0.003 * CS)
        )
      );

      const success = Math.random() < pIdentify;

      const expiresAt = new Date(
        Date.now() + 6 * 60 * 60 * 1000
      );

      let discoveredCountry = target.currentCountryId;
      let falseIntel = false;

      if (!success) {

        const pFalse = Math.max(
          0.02,
          Math.min(
            0.18,
            0.10 - 0.0008 * IS + 0.0012 * CS
          )
        );

        if (Math.random() < pFalse) {
          falseIntel = true;
          discoveredCountry = "UNKNOWN";
        }
      }

      await app.prisma.$transaction(async (tx) => {

        await tx.character.update({
          where: { id: viewer.id },
          data: {
            cash: { decrement: cost }
          }
        });

        await tx.detectiveCooldown.upsert({
          where: {
            viewerCharacterId_targetCharacterId: {
              viewerCharacterId: viewer.id,
              targetCharacterId
            }
          },
          update: {
            cooldownUntil:
              new Date(Date.now() + 30 * 60 * 1000)
          },
          create: {
            viewerCharacterId: viewer.id,
            targetCharacterId,
            cooldownUntil:
              new Date(Date.now() + 30 * 60 * 1000)
          }
        });

        if (success || falseIntel) {

          await tx.knownLocation.create({
            data: {
              viewerCharacterId: viewer.id,
              targetCharacterId,
              countryId: discoveredCountry,
              expiresAt,
              isFalseIntel: falseIntel
            }
          });

        }

        await tx.skills.update({
          where: { characterId: viewer.id },
          data: {
            investigation: {
              increment: success ? 6 : 2
            }
          }
        });

      });

      if (success) {

        await emitIntelDiscovered({
          viewerCharacterId: viewer.id,
          targetCharacterId,
          countryId: discoveredCountry,
          expiresAt: expiresAt.getTime()
        });

      }

      return {
        success,
        countryId: success ? discoveredCountry : null,
        falseIntel,
        expiresAt: expiresAt.getTime()
      };

    }
  );

}
