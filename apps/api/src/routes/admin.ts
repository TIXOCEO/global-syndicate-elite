import { FastifyInstance } from "fastify";
import { applyResourceDelta } from "../lib/resourceMutations";
import {
  computeDamage,
  computeHitChance,
  computeShootXP,
  computeRXP,
  computeNotoriety
} from "../game/combatEngine";

export async function adminRoutes(app: FastifyInstance) {

  // SPAWN CHARACTER
  app.post("/admin/spawn", async (req: any, reply) => {

    const { nickname, bullets = 0, cash = 0, lead = 0 } = req.body;

    const existing = await app.prisma.character.findUnique({
      where: { nickname }
    });

    if (existing) {
      return reply.code(400).send({ error: "Nickname exists" });
    }

    const account = await app.prisma.account.create({
      data: {
        email: `${nickname}@test.local`,
        passwordHash: "dev",
        referralCode: Math.random().toString(36).slice(2, 10)
      }
    });

    const character = await app.prisma.character.create({
      data: {
        accountId: account.id,
        nickname,
        cash,
        lead,
        bullets,
        skills: { create: {} },
        energy: { create: {} },
        jail: { create: {} }
      }
    });

    return { character };

  });


  // GIVE BULLETS
  app.post("/admin/give-bullets", async (req: any) => {

    const { characterId, bullets } = req.body;

    await applyResourceDelta(app.prisma, characterId, {
      bullets
    });

    return { ok: true };

  });


  // SET HP
  app.post("/admin/set-hp", async (req: any) => {

    const { characterId, hp } = req.body;

    await app.prisma.character.update({
      where: { id: characterId },
      data: { hp }
    });

    return { ok: true };

  });


  // FORCE KILL
  app.post("/admin/kill", async (req: any) => {

    const { characterId } = req.body;

    await app.prisma.character.update({
      where: { id: characterId },
      data: {
        status: "DEAD",
        diedAt: new Date()
      }
    });

    return { ok: true };

  });


  // MASS COMBAT SIMULATION (NO AUTH REQUIRED)
  app.post("/admin/simulate-combat", async (req: any) => {

    const { attacks = 100, maxBullets = 200 } = req.body;

    const characters = await app.prisma.character.findMany({
      where: { status: { in: ["ACTIVE", "CRITICAL"] } },
      include: { skills: true }
    });

    if (characters.length < 2) {
      return { error: "Not enough characters" };
    }

    let executed = 0;

    for (let i = 0; i < attacks; i++) {

      const attacker =
        characters[Math.floor(Math.random() * characters.length)];

      const defender =
        characters[Math.floor(Math.random() * characters.length)];

      if (attacker.id === defender.id) continue;

      const bullets = Math.floor(Math.random() * maxBullets) + 10;

      const pHit = computeHitChance(
        attacker.skills?.shooting ?? 0,
        attacker.tier,
        defender.tier,
        bullets
      );

      const hit = Math.random() < pHit;

      const damage = hit ? computeDamage(bullets) : 0;

      const newHP = Math.max(0, defender.hp - damage);

      const shootXp = computeShootXP(bullets, hit);
      const rxp = computeRXP(bullets, hit);
      const notoriety = computeNotoriety(bullets, hit);

      await app.prisma.$transaction(async (tx: any) => {

        await tx.character.update({
          where: { id: attacker.id },
          data: {
            bullets: { decrement: Math.min(bullets, attacker.bullets) },
            rxp: { increment: rxp },
            notoriety: { increment: notoriety }
          }
        });

        await tx.skills.update({
          where: { characterId: attacker.id },
          data: {
            shooting: { increment: shootXp }
          }
        });

        await tx.character.update({
          where: { id: defender.id },
          data: { hp: newHP }
        });

        await tx.combatLog.create({
          data: {
            attackerId: attacker.id,
            defenderId: defender.id,
            bulletsUsed: bullets,
            hit,
            damage,
            shootXp,
            rxp,
            notorietyGain: notoriety
          }
        });

      });

      executed++;

    }

    return {
      attacksRequested: attacks,
      attacksExecuted: executed
    };

  });

}
