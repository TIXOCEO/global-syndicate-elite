import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";

import prismaPlugin from "./plugins/prisma";
import authPlugin from "./plugins/auth";

import { authRoutes } from "./routes/auth";
import { accountRoutes } from "./routes/account";
import { characterRoutes } from "./routes/character";

const app = Fastify({ logger: true });

async function bootstrap() {
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(cookie);

  await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET!
  });

  await app.register(prismaPlugin);
  await app.register(authPlugin);

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(accountRoutes);
  await app.register(characterRoutes);

  app.get("/health", async () => ({ status: "ok" }));

  await app.listen({ port: 4000, host: "0.0.0.0" });
}

bootstrap();
