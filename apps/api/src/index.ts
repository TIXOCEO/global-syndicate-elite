import Fastify from "fastify";
import jwt from "@fastify/jwt";

import prismaPlugin from "./plugins/prisma";
import authPlugin from "./plugins/auth";

import { authRoutes } from "./routes/auth";
import { accountRoutes } from "./routes/account";
import { characterRoutes } from "./routes/character";
import { resourceRoutes } from "./routes/resources";
import { crimeRoutes } from "./routes/crimes"; // ✅ ADDED

const app = Fastify({
  logger: true
});

app.register(jwt, {
  secret: process.env.JWT_ACCESS_SECRET || "dev-secret"
});

app.register(prismaPlugin);
app.register(authPlugin);

app.register(authRoutes);
app.register(accountRoutes);
app.register(characterRoutes);
app.register(resourceRoutes);
app.register(crimeRoutes); // ✅ ADDED

app.get("/health/api", async () => {
  return { status: "ok", service: "api" };
});

const port = Number(process.env.PORT ?? 5001);

app.listen({
  port,
  host: "0.0.0.0"
}).then(() => {
  console.log(`API running on port ${port}`);
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
