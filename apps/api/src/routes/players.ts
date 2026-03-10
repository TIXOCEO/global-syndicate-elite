import { FastifyInstance } from "fastify";

export async function playerRoutes(app: FastifyInstance) {

  app.get(
    "/players/search",
    { preHandler: app.authenticate },
    async (req: any) => {

      const { q } = req.query;

      if (!q || q.length < 2) {
        return { players: [] };
      }

      const players = await app.prisma.character.findMany({
        where: {
          nickname: {
            contains: q,
            mode: "insensitive"
          },
          status: {
            in: ["ACTIVE", "CRITICAL"]
          }
        },
        take: 10,
        select: {
          id: true,
          nickname: true,
          tier: true,
          hp: true
        }
      });

      return { players };

    }
  );

}
