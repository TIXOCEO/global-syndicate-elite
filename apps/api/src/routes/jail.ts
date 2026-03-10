import { FastifyInstance } from "fastify";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function computeBreakChance(
  investigation: number,
  smuggling: number,
  jailXp: number,
  jailRemainingSeconds: number,
  tier: number
) {
  const ISn = investigation / 100;
  const SMSn = smuggling / 100;
  const JXPn = clamp(jailXp / 200, 0, 1);
  const RT = Math.min(1, 1 - jailRemainingSeconds / 240);
  const tierBoost = 0.01 * (tier - 1);

  const p =
    0.06 +
    0.22 * ISn +
    0.08 * SMSn +
    0.18 * JXPn +
    0.10 * RT +
    tierBoost;

  return clamp(p, 0.05, 0.65);
}

function computeBustChance(
  investigation: number,
  smuggling: number,
  bustSkillXP: number,
  jailRemainingSeconds: number
) {
  const ISn = investigation / 100;
  const SMSn = smuggling / 100;
  const bustSkill = Math.min(1, bustSkillXP / 300);
  const RT = Math.min(1, 1 - jailRemainingSeconds / 240);

  const p =
    0.08 +
    0.18 * ISn +
    0.10 * SMSn +
    0.18 * bustSkill +
    0.12 * RT;

  return clamp(p, 0.05, 0.65);
}

export async function jailRoutes(app: FastifyInstance) {

  /*
  NEW: jail prisoner count endpoint
  */

  app.get(
    "/jail/count",
    { preHandler: app.authenticate },
    async () => {

      const count = await app.prisma.jailState.count({
        where: {
          jailRemainingSeconds: { gt: 0 }
        }
      });

      return {
        prisoners: count
      };
    }
  );

  app.get(
    "/jail/list",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const prisoners = await app.prisma.jailState.findMany({
        where: {
          jailRemainingSeconds: { gt: 0 }
        },
        include: {
          character: {
            select: {
              id: true,
              nickname: true,
              tier: true
            }
          }
        },
        orderBy: {
          jailRemainingSeconds: "desc"
        }
      });

      return {
        prisoners: prisoners.map((p) => ({
          characterId: p.characterId,
          nickname: p.character.nickname,
          tier: p.character.tier,
          remainingSeconds: p.jailRemainingSeconds
        }))
      };
    }
  );

  app.post(
    "/jail/bail",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { targetCharacterId } = req.body;
      const accountId = req.user.accountId;

      const actor = await app.prisma.character.findFirst({
        where: { accountId },
        include: { jail: true }
      });

      if (!actor) {
        return reply.code(404).send({ error: "No active character" });
      }

      if ((actor.jail?.jailRemainingSeconds ?? 0) > 0) {
        return reply.code(403).send({
          error: "Jailed players cannot bail others"
        });
      }

      const jail = await app.prisma.jailState.findUnique({
        where: { characterId: targetCharacterId }
      });

      if (!jail || jail.jailRemainingSeconds <= 0) {
        return reply.code(400).send({ error: "Target not jailed" });
      }

      const cost = Math.round(jail.jailRemainingSeconds * 75);

      if (actor.cash < cost) {
        return reply.code(400).send({ error: "Insufficient cash" });
      }

      await app.prisma.$transaction(async (tx: any) => {

        await tx.character.update({
          where: { id: actor.id },
          data: {
            cash: { decrement: cost }
          }
        });

        await tx.jailState.update({
          where: { characterId: targetCharacterId },
          data: {
            jailRemainingSeconds: 0
          }
        });

      });

      return {
        success: true,
        cost
      };
    }
  );

  app.post(
    "/jail/break",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: { accountId },
        include: {
          jail: true,
          skills: true
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      const jailRemaining =
        character.jail?.jailRemainingSeconds ?? 0;

      if (jailRemaining <= 0) {
        return reply.code(400).send({ error: "You are not jailed" });
      }

      const investigation = character.skills?.investigation ?? 0;
      const smuggling = character.skills?.smuggling ?? 0;
      const jailXp = character.skills?.jailXp ?? 0;

      const successChance = computeBreakChance(
        investigation,
        smuggling,
        jailXp,
        jailRemaining,
        character.tier
      );

      const success = Math.random() < successChance;

      await app.prisma.skills.update({
        where: { characterId: character.id },
        data: {
          jailXp: {
            increment: success ? 1 : 0.25
          }
        }
      });

      if (success) {

        await app.prisma.jailState.update({
          where: { characterId: character.id },
          data: {
            jailRemainingSeconds: 0
          }
        });

        return {
          success: true,
          chance: successChance
        };
      }

      const roll = Math.random();

      if (roll < 0.6) {

        const extraTime = Math.floor(Math.random() * 20) + 5;

        await app.prisma.jailState.update({
          where: { characterId: character.id },
          data: {
            jailRemainingSeconds: jailRemaining + extraTime
          }
        });

        return {
          success: false,
          chance: successChance,
          failure: "extra_time",
          addedSeconds: extraTime
        };
      }

      if (roll < 0.9) {
        return {
          success: false,
          chance: successChance,
          failure: "cooldown_lock"
        };
      }

      const injury = Math.floor(Math.random() * 10) + 5;

      const newHp = Math.max(1, character.hp - injury);

      await app.prisma.character.update({
        where: { id: character.id },
        data: {
          hp: newHp,
          status: newHp <= 150 ? "CRITICAL" : character.status
        }
      });

      return {
        success: false,
        chance: successChance,
        failure: "injury",
        damage: injury
      };
    }
  );

  app.post(
    "/jail/bust",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { targetCharacterId } = req.body;
      const accountId = req.user.accountId;

      const actor = await app.prisma.character.findFirst({
        where: { accountId },
        include: {
          jail: true,
          skills: true
        }
      });

      if (!actor) {
        return reply.code(404).send({ error: "No active character" });
      }

      if ((actor.jail?.jailRemainingSeconds ?? 0) > 0) {
        return reply.code(403).send({
          error: "Jailed players cannot bust others"
        });
      }

      if (actor.id === targetCharacterId) {
        return reply.code(400).send({ error: "Cannot bust yourself" });
      }

      const jail = await app.prisma.jailState.findUnique({
        where: { characterId: targetCharacterId }
      });

      if (!jail || jail.jailRemainingSeconds <= 0) {
        return reply.code(400).send({ error: "Target not jailed" });
      }

      const investigation = actor.skills?.investigation ?? 0;
      const smuggling = actor.skills?.smuggling ?? 0;
      const bustSkillXP = actor.skills?.bustSkillXP ?? 0;

      const successChance = computeBustChance(
        investigation,
        smuggling,
        bustSkillXP,
        jail.jailRemainingSeconds
      );

      const success = Math.random() < successChance;

      await app.prisma.skills.update({
        where: { characterId: actor.id },
        data: {
          bustSkillXP: {
            increment: success ? 6 : 2
          }
        }
      });

      if (success) {

        await app.prisma.$transaction(async (tx) => {

          await tx.jailState.update({
            where: { characterId: targetCharacterId },
            data: {
              jailRemainingSeconds: 0
            }
          });

          await tx.character.update({
            where: { id: actor.id },
            data: {
              rxp: { increment: 8 }
            }
          });

          await tx.skills.update({
            where: { characterId: actor.id },
            data: {
              investigation: { increment: 5 }
            }
          });

        });

        return {
          success: true,
          chance: successChance
        };
      }

      const newSentence =
        Math.round(jail.jailRemainingSeconds * 0.6);

      await app.prisma.jailState.update({
        where: { characterId: actor.id },
        data: {
          jailRemainingSeconds: newSentence
        }
      });

      return {
        success: false,
        chance: successChance,
        jailed: true,
        sentence: newSentence
      };
    }
  );
}
