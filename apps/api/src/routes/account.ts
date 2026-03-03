import { FastifyInstance } from "fastify";

export async function accountRoutes(app: FastifyInstance) {

  app.get("/account/me", { preHandler: app.authenticate }, async (req: any) => {
    const accountId = req.user.accountId;

    const account = await app.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        email: true,
        referralCode: true,
        referredByCode: true,
        eliteCredits: true,
        status: true,
        createdAt: true
      }
    });

    return account;
  });

}
