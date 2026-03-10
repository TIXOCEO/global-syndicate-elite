import { FastifyInstance } from "fastify";

export async function worldRoutes(app: FastifyInstance) {

  app.get(
    "/world/countries",
    { preHandler: app.authenticate },
    async () => {

      const countries = await app.prisma.country.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          borderSecurity: true
        },
        orderBy: {
          name: "asc"
        }
      });

      return { countries };
    }
  );

}
