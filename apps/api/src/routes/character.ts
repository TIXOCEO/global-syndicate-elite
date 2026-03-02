import { FastifyInstance } from "fastify";

export async function characterRoutes(app: FastifyInstance) {
  app.post("/character/create", async (req: any, reply) => {
    const { nickname } = req.body;
    const accountId = req.user.accountId;

    const existingActive = await app.prisma.character.findFirst({
      where: { accountId, status: "ACTIVE" }
    });

    if (existingActive) {
      return reply.code(400).send({ error: "Active character already exists" });
    }

    const character = await app.prisma.character.create({
      data: {
        accountId,
        nickname,
        skills: { create: {} },
        energy: { create: {} },
        jail: { create: {} }
      }
    });

    return character;
  });
}
