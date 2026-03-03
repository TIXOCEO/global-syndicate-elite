import { FastifyInstance } from "fastify";
import { hashPassword, verifyPassword } from "../lib/hash";
import { signAccess, signRefresh } from "../lib/jwt";
import { generateReferralCode } from "../lib/referral";

export async function authRoutes(app: FastifyInstance) {

  app.post("/register", async (req: any, reply) => {
    const { email, password, referralCode } = req.body;

    const existing = await app.prisma.account.findUnique({
      where: { email }
    });

    if (existing) {
      return reply.code(400).send({ error: "Email already registered" });
    }

    let referredByCode: string | null = null;

    if (referralCode) {
      const refAccount = await app.prisma.account.findUnique({
        where: { referralCode }
      });

      if (!refAccount) {
        return reply.code(400).send({ error: "Invalid referral code" });
      }

      referredByCode = referralCode;
    }

    const passwordHash = await hashPassword(password);

    const account = await app.prisma.account.create({
      data: {
        email,
        passwordHash,
        referralCode: generateReferralCode(),
        referredByCode
      }
    });

    const access = signAccess({ accountId: account.id });
    const refresh = signRefresh({ accountId: account.id });

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

    if (account.status === "BANNED") {
      return reply.code(403).send({ error: "Account banned" });
    }

    const access = signAccess({ accountId: account.id });
    const refresh = signRefresh({ accountId: account.id });

    return { access, refresh };
  });
}
