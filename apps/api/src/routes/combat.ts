import { FastifyInstance } from "fastify";

import {
  computeDamage,
  computeHitChance,
  computeShootXP,
  computeRXP,
  computeNotoriety
} from "../game/combatEngine";

import {
  calculateSeverity,
  calculateRecoveryHours
} from "../game/injuryEngine";

import {
  emitCombatResult,
  emitStateUpdate,
  emitHitlistCompleted
} from "../lib/wsEmitter";

const combatRateLimit = new Map<string, number>();

function computeRecoveryCombatMult(severity: number) {
  return Math.max(0.55, Math.min(1.0, 1 - severity / 180));
}

export async function combatRoutes(app: FastifyInstance) {

  app.post(
    "/combat/attack",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { targetCharacterId, bullets } = req.body;

      const accountId = req.user.accountId;

      const now = Date.now();

      const last = combatRateLimit.get(accountId);

      if (last && now - last < 1000) {
        return reply.code(429).send({ error: "Combat rate limit" });
      }

      combatRateLimit.set(accountId, now);

      if (typeof bullets !== "number" || bullets <= 0 || bullets > 50000) {
        return reply.code(400).send({ error: "Invalid bullet amount" });
      }

      if (!targetCharacterId || typeof targetCharacterId !== "string") {
        return reply.code(400).send({ error: "Invalid targetCharacterId" });
      }

      const attacker = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          skills: true,
          jail: true
        }
      });

      if (!attacker) {
        return reply.code(404).send({ error: "No active character" });
      }

      if (attacker.tier < 5) {
        return reply.code(403).send({
          error: "PvP unlocks at Tier 5"
        });
      }

      if (attacker.id === targetCharacterId) {
        return reply.code(400).send({ error: "Cannot attack yourself" });
      }

      if ((attacker.jail?.jailRemainingSeconds ?? 0) > 0) {
        return reply.code(403).send({ error: "Character is jailed" });
      }

      if (attacker.bullets < bullets) {
        return reply.code(400).send({ error: "Not enough bullets" });
      }

      const defender = await app.prisma.character.findUnique({
        where: { id: targetCharacterId }
      });

      if (!defender) {
        return reply.code(404).send({ error: "Target not found" });
      }

      /*
      Intel requirement
      */

      const intel = await app.prisma.knownLocation.findFirst({
        where: {
          viewerCharacterId: attacker.id,
          targetCharacterId: defender.id,
          expiresAt: { gt: new Date() }
        }
      });

      if (!intel) {
        return reply.code(403).send({
          error: "Target location unknown"
        });
      }

      /*
      Same country validation
      */

      if (attacker.currentCountryId !== defender.currentCountryId) {
        return reply.code(403).send({
          error: "Target not in same country"
        });
      }

      if (defender.tier < 5) {
        return reply.code(403).send({
          error: "Target has not unlocked PvP"
        });
      }

      if (defender.status === "DEAD") {
        return reply.code(400).send({ error: "Target is dead" });
      }

      if (
        defender.protectionUntil &&
        defender.protectionUntil.getTime() > Date.now()
      ) {
        return reply.code(403).send({ error: "Target under protection" });
      }

      const attackerRecoveryMult =
        computeRecoveryCombatMult(attacker.injurySeverity ?? 0);

      const defenderRecoveryMult =
        computeRecoveryCombatMult(defender.injurySeverity ?? 0);

      const pHit =
        computeHitChance(
          attacker.skills?.shooting ?? 0,
          attacker.tier,
          defender.tier,
          bullets
        ) * attackerRecoveryMult;

      const hit = Math.random() < pHit;

      const damage =
        hit ? computeDamage(bullets) * defenderRecoveryMult : 0;

      let newHP = Math.max(0, defender.hp - damage);

      let newStatus: "ACTIVE" | "CRITICAL" | "DEAD" = defender.status;

      let died = false;
      let critical = false;

      if (newHP <= 0 && defender.status === "ACTIVE") {
        newHP = 1;
        newStatus = "CRITICAL";
        critical = true;
      } else if (newHP <= 0 && defender.status === "CRITICAL") {
        newStatus = "DEAD";
        died = true;
      }

      let severity = hit
        ? calculateSeverity(
            damage,
            bullets,
            attacker.tier,
            defender.tier,
            0,
            "STANDARD"
          )
        : 0;

      if (critical) {
        severity = Math.max(severity, 95);
      }

      let recoveryUntil: Date | null = null;

      if (hit) {

        const recoveryHours =
          critical ? 24 : calculateRecoveryHours(severity);

        recoveryUntil =
          new Date(Date.now() + recoveryHours * 60 * 60 * 1000);

      }

      const shootXp = computeShootXP(bullets, hit);
      const rxp = computeRXP(bullets, hit);
      const notoriety = computeNotoriety(bullets, hit);

      /*
      NEW — Hitlist lookup
      */

      let bountyContract: any = null;

      if (hit) {

        bountyContract = await app.prisma.hitlistContract.findFirst({
          where: {
            targetCharacterId: defender.id,
            status: "ACTIVE",
            deadline: { gt: new Date() },
            minBulletsRequired: { lte: bullets }
          },
          orderBy: {
            rewardCash: "desc"
          }
        });

      }

      await app.prisma.$transaction(async (tx: any) => {

        await tx.character.update({
          where: { id: attacker.id },
          data: {
            bullets: { decrement: bullets },
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

        const defenderUpdate: any = {
          hp: newHP,
          status: newStatus
        };

        if (hit) {
          defenderUpdate.injurySeverity = severity;
          defenderUpdate.recoveryUntil = recoveryUntil;
        }

        if (critical) {
          defenderUpdate.protectionUntil =
            new Date(Date.now() + 15 * 60 * 1000);
        }

        if (died) {
          defenderUpdate.diedAt = new Date();
        }

        await tx.character.update({
          where: { id: defender.id },
          data: defenderUpdate
        });

        const combatLog = await tx.combatLog.create({
          data: {
            attackerId: attacker.id,
            defenderId: defender.id,
            bulletsUsed: bullets,
            hit,
            damage,
            shootXp,
            rxp,
            notorietyGain: notoriety,
            hitlistContractId: bountyContract?.id ?? null
          }
        });

        /*
        Bounty reward payout
        */

        if (bountyContract) {

          const reward = bountyContract.rewardCash;

          await tx.character.update({
            where: { id: attacker.id },
            data: {
              cash: { increment: reward },
              rxp: { increment: 15 }
            }
          });

          await tx.skills.update({
            where: { characterId: attacker.id },
            data: {
              shooting: { increment: 12 }
            }
          });

          await tx.hitlistContract.update({
            where: { id: bountyContract.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date()
            }
          });

        }

      });

      if (bountyContract) {

        await emitHitlistCompleted({
          contractId: bountyContract.id,
          hunterId: attacker.id,
          targetId: defender.id
        });

      }

      await emitCombatResult({
        attackerId: attacker.id,
        defenderId: defender.id,
        damage,
        hit,
        bulletsUsed: bullets,
        severity,
        recoveryUntil: recoveryUntil?.getTime(),
        critical,
        death: died
      });

      await emitStateUpdate({ characterId: attacker.id });
      await emitStateUpdate({ characterId: defender.id });

      return {
        hit,
        damage,
        bulletsUsed: bullets,
        severity,
        recoveryUntil: recoveryUntil?.getTime() ?? null,
        remainingHP: newHP,
        shootXp,
        rxp,
        critical,
        death: died,
        bountyClaimed: bountyContract ? true : false,
        bountyReward: bountyContract?.rewardCash ?? 0
      };

    }
  );

}
