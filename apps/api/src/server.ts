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
import { combatRoutes } from "./routes/combat";
import { adminRoutes } from "./routes/admin";
import { playerRoutes } from "./routes/players";
import { hospitalRoutes } from "./routes/hospital";
import { shopRoutes } from "./routes/shop";
import { jailRoutes } from "./routes/jail";

/* NEW */
import { detectiveRoutes } from "./routes/detectives";

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
  await app.register(combatRoutes);
  await app.register(playerRoutes);
  await app.register(hospitalRoutes);
  await app.register(shopRoutes);

  /* NEW JAIL ROUTES */
  await app.register(jailRoutes);

  /* NEW DETECTIVE ROUTES */
  await app.register(detectiveRoutes);

  await app.register(adminRoutes);

  app.get("/health", async () => ({
    status: "ok"
  }));

  const port = Number(process.env.PORT) || 5001;

  await app.listen({
    port,
    host: "0.0.0.0"
  });

  app.log.info(`GSE API running on port ${port}`);
}

bootstrap();
