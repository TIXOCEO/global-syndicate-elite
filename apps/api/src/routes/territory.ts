import { FastifyInstance } from "fastify";

const BASE_CELL_PRICE = 2500;
const CAPITAL_X = 10;
const CAPITAL_Y = 10;

export async function territoryRoutes(app: FastifyInstance) {

  /*
  List territories for a country
  */
  app.get(
    "/territory/list",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { countryId } = req.query;

      if (!countryId) {
        return reply.code(400).send({
          error: "countryId required"
        });
      }

      const territories = await app.prisma.territoryCell.findMany({
        where: { countryId },
        select: {
          gridX: true,
          gridY: true,
          ownerCharacterId: true,
          controlPoints: true
        },
        orderBy: [
          { gridX: "asc" },
          { gridY: "asc" }
        ]
      });

      return {
        territories
      };

    }
  );

  /*
  Territory purchase (Sprint 10D)
  */
  app.post(
    "/territory/buy",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { gridX, gridY } = req.body;
      const accountId = req.user.accountId;

      if (gridX === undefined || gridY === undefined) {
        return reply.code(400).send({
          error: "gridX and gridY required"
        });
      }

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        }
      });

      if (!character) {
        return reply.code(404).send({
          error: "No active character"
        });
      }

      const cell = await app.prisma.territoryCell.findFirst({
        where: {
          countryId: character.currentCountryId,
          gridX,
          gridY
        }
      });

      if (!cell) {
        return reply.code(404).send({
          error: "Territory cell not found"
        });
      }

      if (cell.ownerCharacterId) {
        return reply.code(400).send({
          error: "Territory already owned"
        });
      }

      /*
      Distance multiplier from capital
      */

      const dx = gridX - CAPITAL_X;
      const dy = gridY - CAPITAL_Y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      const price =
        Math.floor(
          BASE_CELL_PRICE *
          (1 + distance * 0.08)
        );

      if (character.cash < price) {
        return reply.code(400).send({
          error: "Insufficient cash"
        });
      }

      await app.prisma.$transaction(async (tx: any) => {

        await tx.character.update({
          where: { id: character.id },
          data: {
            cash: {
              decrement: price
            }
          }
        });

        await tx.territoryCell.update({
          where: { id: cell.id },
          data: {
            ownerCharacterId: character.id,
            controlPoints: 12
          }
        });

      });

      return {
        success: true,
        gridX,
        gridY,
        price
      };

    }
  );

}
