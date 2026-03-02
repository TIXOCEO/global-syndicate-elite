import { FastifyInstance } from "fastify";

export async function accountRoutes(app: FastifyInstance) {
  app.get("/me", async (req: any) => {
    const accountId = req.user.accountId;

    const account = await app.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        characters: {
          where: { status: "ACTIVE" },
          include: { skills: true, energy: true }
        }
      }
    });

    return account;
  });
}
