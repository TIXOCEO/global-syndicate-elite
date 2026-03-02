import { FastifyInstance } from "fastify";
import { hashPassword, verifyPassword } from "@gse/auth/hash";
import { signAccess, signRefresh } from "@gse/auth/jwt";
import { generateReferralCode } from "@gse/auth/referral";

export async function authRoutes(app: FastifyInstance) {

  app.post("/register", async (req: any, reply) => {
    const { email, password, referralCode } = req.body;

    const existing = await app.prisma.account.findUnique({
      where: { email }
    });

    if (existing) {
      return reply.code(400).send({ error: "Email already used" });
    }

    const passwordHash = await hashPassword(password);

    const newAccount = await app.prisma.account.create({
      data: {
        email,
        passwordHash,
        referralCode: generateReferralCode(),
        referredByCode: referralCode ?? null
      }
    });

    const access = signAccess({ accountId: newAccount.id });
    const refresh = signRefresh({ accountId: newAccount.id });

    return { access, refresh };
  });

  app.post("/login", async (req: any, reply) => {
    const { email, password } = req.body;

    const account = await app.prisma.account.findUnique({
      where: { email }
    });

    if (!account) {
      return reply.code(400).send({ error: "Invalid credentials" });
    }

    const valid = await verifyPassword(account.passwordHash, password);

    if (!valid) {
      return reply.code(400).send({ error: "Invalid credentials" });
    }

    const access = signAccess({ accountId: account.id });
    const refresh = signRefresh({ accountId: account.id });

    return { access, refresh };
  });
}
