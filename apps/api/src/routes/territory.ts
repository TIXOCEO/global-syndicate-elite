import { FastifyInstance } from "fastify";

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

}
