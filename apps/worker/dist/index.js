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
const WS_BRIDGE_URL = process.env.WS_INTERNAL_URL ||
    "http://127.0.0.1:5002/internal/state-update";
const WS_FACTORY_EVENT = process.env.WS_FACTORY_EVENT ||
    "http://127.0.0.1:5002/internal/factory-production";
/*
Energy regeneration
*/
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
/*
Jail countdown
*/
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
        /*
        Passive jail XP while incarcerated
        */
        try {
            await prisma.skills.update({
                where: { characterId: entry.characterId },
                data: {
                    jailXp: {
                        increment: 0.2
                    }
                }
            });
        }
        catch (err) {
            console.error("Jail XP increment failed", err);
        }
        try {
            await fetch(WS_BRIDGE_URL, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    characterId: entry.characterId
                })
            });
        }
        catch (err) {
            console.error("WS jail update failed", err);
        }
    }
}
/*
Lead decay system
1 lead every 3 hours
*/
async function leadDecayTick() {
    const characters = await prisma.character.findMany({
        where: { lead: { gt: 0 } }
    });
    for (const char of characters) {
        const newLead = Math.max(0, char.lead - 1);
        if (newLead !== char.lead) {
            await prisma.character.update({
                where: { id: char.id },
                data: { lead: newLead }
            });
            try {
                await fetch(WS_BRIDGE_URL, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        characterId: char.id
                    })
                });
            }
            catch (err) {
                console.error("WS lead decay update failed", err);
            }
        }
    }
}
/*
Factory bullet production
Runs every 60 seconds
Supports fractional production
*/
async function factoryProductionTick() {
    const factories = await prisma.bulletFactory.findMany({
        include: {
            character: true
        }
    });
    for (const factory of factories) {
        const character = factory.character;
        const productionPerMinute = factory.productionRatePerHour / 60;
        const progress = factory.productionProgress + productionPerMinute;
        const bulletsProduced = Math.floor(progress);
        if (bulletsProduced <= 0) {
            await prisma.bulletFactory.update({
                where: { id: factory.id },
                data: {
                    productionProgress: progress
                }
            });
            continue;
        }
        const maxByLead = character.lead;
        const maxByCash = Math.floor(character.cash / 2);
        const allowedProduction = Math.min(bulletsProduced, maxByLead, maxByCash);
        if (allowedProduction <= 0) {
            console.log(`Factory paused for ${character.nickname} (insufficient resources)`);
            continue;
        }
        const cashCost = allowedProduction * 2;
        const result = await prisma.$transaction(async (tx) => {
            const updatedCharacter = await tx.character.update({
                where: { id: character.id },
                data: {
                    bullets: { increment: allowedProduction },
                    lead: { decrement: allowedProduction },
                    cash: { decrement: cashCost }
                }
            });
            await tx.bulletFactory.update({
                where: { id: factory.id },
                data: {
                    productionProgress: progress - allowedProduction,
                    lastProductionAt: new Date()
                }
            });
            return updatedCharacter;
        });
        console.log(`Factory production: ${character.nickname} +${allowedProduction} bullets`);
        try {
            await fetch(WS_BRIDGE_URL, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    characterId: character.id,
                    bullets: result.bullets,
                    lead: result.lead,
                    cash: result.cash
                })
            });
            await fetch(WS_FACTORY_EVENT, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    characterId: character.id,
                    bulletsAdded: allowedProduction,
                    leadConsumed: allowedProduction,
                    cashConsumed: cashCost
                })
            });
        }
        catch (err) {
            console.error("WS update failed", err);
        }
    }
}
/*
Recovery cleanup
*/
async function recoveryStatusTick() {
    const now = new Date();
    const recoveringCharacters = await prisma.character.findMany({
        where: {
            recoveryUntil: { not: null }
        },
        select: {
            id: true,
            nickname: true,
            hp: true,
            injurySeverity: true,
            recoveryUntil: true
        }
    });
    for (const character of recoveringCharacters) {
        if (!character.recoveryUntil)
            continue;
        if (character.injurySeverity <= 0) {
            await prisma.character.update({
                where: { id: character.id },
                data: {
                    recoveryUntil: null
                }
            });
            continue;
        }
        const recoveryEnded = character.recoveryUntil.getTime() <= now.getTime();
        if (!recoveryEnded)
            continue;
        const healedHp = Math.max(character.hp, 650);
        await prisma.character.update({
            where: { id: character.id },
            data: {
                hp: healedHp,
                injurySeverity: 0,
                recoveryUntil: null
            }
        });
        try {
            await fetch(WS_BRIDGE_URL, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    characterId: character.id
                })
            });
        }
        catch (err) {
            console.error("WS recovery update failed", err);
        }
    }
}
/*
Passive HP regeneration
*/
async function passiveHpRegenTick() {
    const damagedCharacters = await prisma.character.findMany({
        where: {
            hp: { lt: 1000 },
            recoveryUntil: null,
            status: { in: ["ACTIVE", "CRITICAL"] }
        },
        select: {
            id: true,
            hp: true
        }
    });
    for (const character of damagedCharacters) {
        const newHp = Math.min(1000, character.hp + 1);
        if (newHp === character.hp)
            continue;
        await prisma.character.update({
            where: { id: character.id },
            data: {
                hp: newHp
            }
        });
        try {
            await fetch(WS_BRIDGE_URL, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    characterId: character.id
                })
            });
        }
        catch (err) {
            console.error("WS HP regen update failed", err);
        }
    }
}
/*
Intel expiration cleanup
*/
async function intelExpiryTick() {
    try {
        const now = new Date();
        const result = await prisma.knownLocation.deleteMany({
            where: {
                expiresAt: {
                    lt: now
                }
            }
        });
        if (result.count > 0) {
            console.log(`Expired intel cleaned: ${result.count}`);
        }
    }
    catch (err) {
        console.error("Intel expiry cleanup failed", err);
    }
}
async function start() {
    await prisma.$connect();
    setInterval(async () => {
        await energyRegenTick();
        await jailTick();
        await factoryProductionTick();
        await recoveryStatusTick();
    }, 60_000);
    setInterval(async () => {
        await passiveHpRegenTick();
    }, 6 * 60 * 1000);
    setInterval(async () => {
        await leadDecayTick();
    }, 3 * 60 * 60 * 1000);
    /*
    Intel cleanup every 5 minutes
    */
    setInterval(async () => {
        await intelExpiryTick();
    }, 5 * 60 * 1000);
    console.log("Worker active (energy + jail + lead + factories + recovery + intel cleanup)");
}
start();
const server = http_1.default.createServer((req, res) => {
    if (req.url === "/health/worker") {
        res.writeHead(200, {
            "content-type": "application/json"
        });
        res.end(JSON.stringify({
            status: "ok",
            service: "worker"
        }));
        return;
    }
    res.writeHead(404);
    res.end();
});
const port = Number(process.env.PORT ?? 5003);
server.listen(port, "0.0.0.0", () => {
    console.log(`Worker running on port ${port}`);
});
