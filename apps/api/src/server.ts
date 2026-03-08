import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";

import prismaPlugin from "./plugins/prisma";
import authPlugin from "./plugins/auth";

import { authRoutes } from "./routes/auth";
import { accountRoutes } from "./routes/account";
import { characterRoutes } from "./routes/character";
import { resourceRoutes } from "./routes/resources";
import { crimeRoutes } from "./routes/crimes";
import { stateRoutes } from "./routes/state";
import { factoryRoutes } from "./routes/factories";

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
  await app.register(stateRoutes);
  await app.register(resourceRoutes);
  await app.register(crimeRoutes);

  await app.register(factoryRoutes);

  app.get("/health", async () => ({ status: "ok" }));

  const port = Number(process.env.PORT) || 5001;

  await app.listen({
    port,
    host: "0.0.0.0"
  });

  app.log.info(`GSE API running on port ${port}`);
}

bootstrap();
