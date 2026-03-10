import { FastifyInstance } from "fastify";

const MEDKIT_PRICE = 1200;

export async function shopRoutes(app: FastifyInstance) {
  app.get(
    "/shop/status",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          items: {
            where: { itemType: "MEDKIT_I" }
          }
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      const medkit = character.items[0] ?? null;

      return {
        cash: character.cash,
        medkit: {
          price: MEDKIT_PRICE,
          quantity: medkit?.quantity ?? 0
        }
      };
    }
  );

  app.post(
    "/shop/buy-medkit",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          items: {
            where: { itemType: "MEDKIT_I" }
          }
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      if (character.cash < MEDKIT_PRICE) {
        return reply.code(400).send({ error: "Insufficient cash" });
      }

      const medkit = character.items[0] ?? null;

      await app.prisma.$transaction(async (tx: any) => {
        await tx.character.update({
          where: { id: character.id },
          data: {
            cash: { decrement: MEDKIT_PRICE }
          }
        });

        if (medkit) {
          await tx.characterItem.update({
            where: {
              characterId_itemType: {
                characterId: character.id,
                itemType: "MEDKIT_I"
              }
            },
            data: {
              quantity: { increment: 1 }
            }
          });
        } else {
          await tx.characterItem.create({
            data: {
              characterId: character.id,
              itemType: "MEDKIT_I",
              quantity: 1
            }
          });
        }
      });

      return {
        success: true,
        price: MEDKIT_PRICE
      };
    }
  );
}
