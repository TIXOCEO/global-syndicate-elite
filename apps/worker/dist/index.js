"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../../../.env")
});
const http_1 = __importDefault(require("http"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function energyRegenTick() {
    const now = new Date();
    const energies = await prisma.energy.findMany();
    for (const entry of energies) {
        const last = new Date(entry.lastRegenAt);
        const secondsElapsed = Math.floor((now.getTime() - last.getTime()) / 1000);
        if (secondsElapsed < 60)
            continue;
        const regenAmount = Math.floor(secondsElapsed / 60);
        if (regenAmount <= 0)
            continue;
        const newEnergy = Math.min(100, entry.energy + regenAmount);
        await prisma.energy.update({
            where: { characterId: entry.characterId },
            data: {
                energy: newEnergy,
                lastRegenAt: new Date(last.getTime() + regenAmount * 60 * 1000)
            }
        });
    }
}
async function jailTick() {
    const now = new Date();
    const jailed = await prisma.jailState.findMany({
        where: { jailRemainingSeconds: { gt: 0 } }
    });
    for (const entry of jailed) {
        const last = new Date(entry.lastUpdatedAt);
        const secondsElapsed = Math.floor((now.getTime() - last.getTime()) / 1000);
        if (secondsElapsed <= 0)
            continue;
        const newRemaining = Math.max(0, entry.jailRemainingSeconds - secondsElapsed);
        await prisma.jailState.update({
            where: { characterId: entry.characterId },
            data: {
                jailRemainingSeconds: newRemaining,
                lastUpdatedAt: now
            }
        });
    }
}
async function leadDecayTick() {
    const now = new Date();
    const characters = await prisma.character.findMany({
        where: { lead: { gt: 0 } },
        include: { jail: true }
    });
    for (const char of characters) {
        let decay = 1;
        decay += Math.floor(char.lead / 100);
        if ((char.jail?.jailRemainingSeconds ?? 0) > 0) {
            decay += 1;
        }
        if (char.lastCrimeAt) {
            const minutesSinceCrime = (now.getTime() - new Date(char.lastCrimeAt).getTime()) / 60000;
            if (minutesSinceCrime > 5) {
                decay += Math.floor(minutesSinceCrime / 5);
            }
        }
        decay -= Math.floor(char.tier / 3);
        decay = Math.max(1, decay);
        const newLead = Math.max(0, char.lead - decay);
        if (newLead !== char.lead) {
            await prisma.character.update({
                where: { id: char.id },
                data: { lead: newLead }
            });
        }
    }
}
async function start() {
    await prisma.$connect();
    setInterval(async () => {
        await energyRegenTick();
        await jailTick();
        await leadDecayTick();
    }, 60_000);
    console.log("Worker active (energy + jail + lead)");
}
start();
const server = http_1.default.createServer((req, res) => {
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
