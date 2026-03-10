import { FastifyInstance } from "fastify";
import { emitTravelCompleted, emitStateUpdate } from "../lib/wsEmitter";

const BASE_TRAVEL_COOLDOWN_MINUTES = 90;

export async function travelRoutes(app: FastifyInstance) {

  app.post(
    "/travel",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { destinationCountryId } = req.body;
      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          jail: true
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      /*
      Jail validation
      */

      if ((character.jail?.jailRemainingSeconds ?? 0) > 0) {
        return reply.code(403).send({ error: "Cannot travel while jailed" });
      }

      /*
      Cooldown validation
      */

      if (
        character.travelCooldownUntil &&
        character.travelCooldownUntil.getTime() > Date.now()
      ) {
        return reply.code(403).send({ error: "Travel cooldown active." });
      }

      /*
      Destination validation
      */

      if (destinationCountryId === character.currentCountryId) {
        return reply.code(400).send({ error: "Already in that country" });
      }

      const country = await app.prisma.country.findUnique({
        where: { id: destinationCountryId }
      });

      if (!country) {
        return reply.code(400).send({ error: "Invalid destination country" });
      }

      /*
      Travel cooldown
      */

      const cooldownUntil = new Date(
        Date.now() + BASE_TRAVEL_COOLDOWN_MINUTES * 60 * 1000
      );

      /*
      Update location
      */

      await app.prisma.character.update({
        where: { id: character.id },
        data: {
          currentCountryId: destinationCountryId,
          travelCooldownUntil: cooldownUntil
        }
      });

      /*
      Realtime events
      */

      await emitTravelCompleted({
        characterId: character.id,
        countryId: destinationCountryId
      });

      await emitStateUpdate({
        characterId: character.id
      });

      return {
        success: true,
        destinationCountryId,
        travelCooldownUntil: cooldownUntil.getTime()
      };

    }
  );

}
