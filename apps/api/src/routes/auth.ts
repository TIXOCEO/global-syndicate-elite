import { FastifyInstance } from "fastify";
import { hashPassword, verifyPassword } from "../lib/hash";
import { signAccess, signRefresh } from "../lib/jwt";
import { generateReferralCode } from "../lib/referral";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function authRoutes(app: FastifyInstance) {

  // REGISTER
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
        referredByCode,
        isEmailVerified: false
      }
    });

    const token = crypto.randomBytes(32).toString("hex");

    await app.prisma.emailVerificationToken.create({
      data: {
        accountId: account.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const verifyUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: "Verify Your Global Syndicate Elite Account",
      html: `
        <h2>Verify your account</h2>
        <p>Click the link below to verify your email.</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `
    });

    return { success: true };

  });


  // GOOGLE LOGIN
  app.post("/google", async (req: any, reply) => {

    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return reply.code(400).send({ error: "Google account email missing" });
    }

    const email = payload.email;
    const googleId = payload.sub;

    let account = await app.prisma.account.findUnique({
      where: { email }
    });

    if (!account) {

      account = await app.prisma.account.create({
        data: {
          email,
          passwordHash: "",
          referralCode: generateReferralCode(),
          isEmailVerified: true,
          googleId
        }
      });

    } else {

      if (!account.googleId) {
        await app.prisma.account.update({
          where: { id: account.id },
          data: { googleId }
        });
      }

    }

    const access = signAccess({ accountId: account.id });
    const refresh = signRefresh({ accountId: account.id });

    reply.setCookie("gse_session", access, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return { access, refresh };

  });


  // VERIFY EMAIL
  app.get("/verify-email", async (req: any, reply) => {

    const { token } = req.query;

    const record = await app.prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!record) {
      return reply.code(400).send({ error: "Invalid token" });
    }

    if (record.expiresAt < new Date()) {
      return reply.code(400).send({ error: "Token expired" });
    }

    await app.prisma.account.update({
      where: { id: record.accountId },
      data: { isEmailVerified: true }
    });

    await app.prisma.emailVerificationToken.delete({
      where: { id: record.id }
    });

    return { success: true };

  });


  // LOGIN
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

    if (!account.isEmailVerified) {
      return reply.code(403).send({ error: "Email not verified" });
    }

    const access = signAccess({ accountId: account.id });
    const refresh = signRefresh({ accountId: account.id });

    reply.setCookie("gse_session", access, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return { access, refresh };

  });


  // ME
  app.get("/me", { preHandler: [app.authenticate] }, async (req: any) => {

    const account = await app.prisma.account.findUnique({
      where: { id: req.user.accountId },
      select: {
        id: true,
        email: true,
        referralCode: true,
        eliteCredits: true,
        status: true,
        createdAt: true
      }
    });

    return { account };

  });


  // LOGOUT
  app.post("/logout", async (req, reply) => {

    reply.clearCookie("gse_session", { path: "/" });

    return { success: true };

  });

}
