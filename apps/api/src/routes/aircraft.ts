import { FastifyInstance } from "fastify";

const AIRCRAFT_PRICES: Record<number, number> = {
  1: 0,
  2: 20000,
  3: 50000,
  4: 120000,
  5: 300000
};

export async function aircraftRoutes(app: FastifyInstance) {

  app.post(
    "/aircraft/purchase",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const tier = Number(req.body.tier);
      const accountId = req.user.accountId;

      if (!AIRCRAFT_PRICES[tier]) {
        return reply.code(400).send({ error: "Invalid aircraft tier" });
      }

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          aircraft: true
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      const currentTier = character.aircraft?.aircraftTier ?? 1;

      /*
      Prevent downgrade or same tier purchase
      */
      if (tier <= currentTier) {
        return reply.code(400).send({
          error: "Must purchase higher aircraft tier"
        });
      }

      const price = AIRCRAFT_PRICES[tier];

      if (character.cash < price) {
        return reply.code(400).send({ error: "Insufficient cash" });
      }

      await app.prisma.$transaction(async (tx: any) => {

        await tx.character.update({
          where: { id: character.id },
          data: {
            cash: { decrement: price }
          }
        });

        if (character.aircraft) {

          await tx.characterAircraft.update({
            where: { characterId: character.id },
            data: { aircraftTier: tier }
          });

        } else {

          await tx.characterAircraft.create({
            data: {
              characterId: character.id,
              aircraftTier: tier
            }
          });

        }

      });

      return {
        success: true,
        aircraftTier: tier
      };

    }
  );

}
