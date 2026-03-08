import { FastifyInstance } from "fastify";

const FACTORY_CONFIG = {
  MINI: {
    price: 15000,
    productionRatePerHour: 15
  },
  SMALL: {
    price: 50000,
    productionRatePerHour: 30
  },
  MEDIUM: {
    price: 120000,
    productionRatePerHour: 45
  },
  LARGE: {
    price: 300000,
    productionRatePerHour: 60
  }
};

export async function factoryRoutes(app: FastifyInstance) {

  app.get("/factories", { preHandler: app.authenticate }, async (req: any) => {

    const accountId = req.user.accountId;

    const character = await app.prisma.character.findFirst({
      where: {
        accountId,
        status: { in: ["ACTIVE", "CRITICAL"] }
      },
      include: {
        factories: true
      }
    });

    if (!character) {
      return { factory: null };
    }

    const factory = character.factories[0] ?? null;

    return {
      factory: factory
        ? {
            id: factory.id,
            type: factory.factoryType,
            productionRatePerHour: factory.productionRatePerHour,

            // REQUIRED FOR DB-DRIVEN TIMER
            lastProductionAt: factory.lastProductionAt ?? null,
            productionProgress: factory.productionProgress ?? 0
          }
        : null
    };
  });


  app.post(
    "/factories/purchase",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { factoryType } = req.body;
      const accountId = req.user.accountId;

      if (!FACTORY_CONFIG[factoryType as keyof typeof FACTORY_CONFIG]) {
        return reply.code(400).send({ error: "Invalid factory type" });
      }

      const config =
        FACTORY_CONFIG[factoryType as keyof typeof FACTORY_CONFIG];

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          factories: true
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "Character not found" });
      }

      if (character.cash < config.price) {
        return reply.code(400).send({ error: "Insufficient cash" });
      }

      const result = await app.prisma.$transaction(async (tx: any) => {

        await tx.character.update({
          where: { id: character.id },
          data: {
            cash: {
              decrement: config.price
            }
          }
        });

        // remove existing factory (only one allowed)
        if (character.factories.length > 0) {
          await tx.bulletFactory.deleteMany({
            where: { characterId: character.id }
          });
        }

        const factory = await tx.bulletFactory.create({
          data: {
            characterId: character.id,
            factoryType,
            productionRatePerHour: config.productionRatePerHour
          }
        });

        return factory;
      });

      return {
        factory: {
          id: result.id,
          type: result.factoryType,
          productionRatePerHour: result.productionRatePerHour,

          // return new fields here as well
          lastProductionAt: result.lastProductionAt ?? null,
          productionProgress: result.productionProgress ?? 0
        }
      };
    }
  );
}
