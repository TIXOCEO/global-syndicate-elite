import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../../.env")
});

import http from "http";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

console.log("Worker using DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter
});

async function energyRegenTick() {
  const now = new Date();

  try {
    const energies = await prisma.energy.findMany({
      include: {
        character: {
          select: { status: true }
        }
      }
    });

    console.log("Energy rows found:", energies.length);

    for (const entry of energies) {
      const last = new Date(entry.lastRegenAt);

      const secondsElapsed =
        Math.floor((now.getTime() - last.getTime()) / 1000);

      console.log("Energy Debug:", {
        characterId: entry.characterId,
        now: now.toISOString(),
        lastRegenAt: last.toISOString(),
        secondsElapsed,
        currentEnergy: entry.energy
      });

      if (secondsElapsed < 60) continue;

      const regenAmount = Math.floor(secondsElapsed / 60);
      if (regenAmount <= 0) continue;

      const newEnergy = Math.min(100, entry.energy + regenAmount);

      console.log("Applying Regen:", {
        characterId: entry.characterId,
        regenAmount,
        newEnergy
      });

      await prisma.energy.update({
        where: { characterId: entry.characterId },
        data: {
          energy: newEnergy,
          lastRegenAt: new Date(
            last.getTime() + regenAmount * 60 * 1000
          )
        }
      });
    }

    console.log("[worker] energy tick completed", now.toISOString());
  } catch (err) {
    console.error("[worker] energy tick error", err);
  }
}

async function start() {
  await prisma.$connect();

  setInterval(async () => {
    await energyRegenTick();
  }, 60_000);

  console.log("EnergyRegenWorker active");
}

start();

const server = http.createServer((req, res) => {
  if (req.url === "/health/worker") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "worker" }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const port = Number(process.env.PORT ?? 5003);

server.listen(port, "0.0.0.0", () => {
  console.log(`Worker running on port ${port}`);
});
