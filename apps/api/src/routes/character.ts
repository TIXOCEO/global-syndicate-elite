import { FastifyInstance } from "fastify";

export async function characterRoutes(app: FastifyInstance) {

  // CREATE CHARACTER
  app.post("/character/create", { preHandler: app.authenticate }, async (req: any, reply) => {
    const { nickname } = req.body;
    const accountId = req.user.accountId;

    const existingActive = await app.prisma.character.findFirst({
      where: { accountId, status: "ACTIVE" }
    });

    if (existingActive) {
      return reply.code(400).send({ error: "Active character already exists" });
    }

    const nicknameExists = await app.prisma.character.findUnique({
      where: { nickname }
    });

    if (nicknameExists) {
      return reply.code(400).send({ error: "Nickname already taken" });
    }

    const character = await app.prisma.character.create({
      data: {
        accountId,
        nickname,
        skills: { create: {} },
        energy: { create: {} },
        jail: { create: {} }
      },
      include: {
        skills: true,
        energy: true
      }
    });

    return character;
  });


  // GET ACTIVE CHARACTER
  app.get("/character/me", { preHandler: app.authenticate }, async (req: any) => {
    const accountId = req.user.accountId;

    const character = await app.prisma.character.findFirst({
      where: {
        accountId,
        status: { in: ["ACTIVE", "CRITICAL"] }
      },
      include: {
        skills: true,
        energy: true
      }
    });

    return character;
  });


  // DEAD ARCHIVE
  app.get("/character/archive", { preHandler: app.authenticate }, async (req: any) => {
    const accountId = req.user.accountId;

    return app.prisma.character.findMany({
      where: {
        accountId,
        status: "DEAD"
      },
      orderBy: {
        diedAt: "desc"
      }
    });
  });


  // SELECT CHARACTER (future-safe)
  app.post("/character/select", { preHandler: app.authenticate }, async (req: any, reply) => {
    const { characterId } = req.body;
    const accountId = req.user.accountId;

    const character = await app.prisma.character.findFirst({
      where: { id: characterId, accountId }
    });

    if (!character) {
      return reply.code(404).send({ error: "Character not found" });
    }

    if (character.status === "DEAD") {
      return reply.code(400).send({ error: "Character is dead" });
    }

    return character;
  });

}
