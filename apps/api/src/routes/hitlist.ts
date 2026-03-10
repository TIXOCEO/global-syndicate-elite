import { FastifyInstance } from "fastify";
import {
  emitStateUpdate,
  emitHitlistCreated,
  emitHitlistCancelled
} from "../lib/wsEmitter";

export async function hitlistRoutes(app: FastifyInstance) {

  /*
  CREATE HITLIST CONTRACT
  */
  app.post(
    "/hitlist/create",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { targetCharacterId, rewardCash, deadline, minBulletsRequired, anonymous } = req.body;

      const accountId = req.user.accountId;

      if (!targetCharacterId) {
        return reply.code(400).send({ error: "targetCharacterId required" });
      }

      if (!rewardCash || rewardCash < 2000) {
        return reply.code(400).send({ error: "Minimum reward is 2000" });
      }

      const creator = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        }
      });

      if (!creator) {
        return reply.code(404).send({ error: "No active character" });
      }

      if (creator.id === targetCharacterId) {
        return reply.code(400).send({ error: "Cannot place bounty on yourself" });
      }

      const target = await app.prisma.character.findUnique({
        where: { id: targetCharacterId }
      });

      if (!target || target.status === "DEAD") {
        return reply.code(400).send({ error: "Target invalid or dead" });
      }

      if (creator.cash < rewardCash) {
        return reply.code(400).send({ error: "Insufficient cash" });
      }

      const deadlineDate = new Date(deadline);

      if (deadlineDate.getTime() <= Date.now()) {
        return reply.code(400).send({ error: "Invalid deadline" });
      }

      const contract = await app.prisma.$transaction(async (tx: any) => {

        await tx.character.update({
          where: { id: creator.id },
          data: {
            cash: { decrement: rewardCash }
          }
        });

        const created = await tx.hitlistContract.create({
          data: {
            creatorCharacterId: creator.id,
            targetCharacterId,
            rewardCash,
            minBulletsRequired: minBulletsRequired ?? 0,
            deadline: deadlineDate,
            isAnonymous: Boolean(anonymous)
          }
        });

        return created;
      });

      await emitHitlistCreated({
        contractId: contract.id,
        targetCharacterId,
        rewardCash
      });

      await emitStateUpdate({
        characterId: creator.id
      });

      return {
        contractId: contract.id,
        rewardCash,
        deadline
      };
    }
  );


  /*
  LIST ACTIVE CONTRACTS
  */
  app.get(
    "/hitlist/list",
    { preHandler: app.authenticate },
    async (req: any) => {

      const page = Number(req.query.page ?? 1);
      const sort = req.query.sort ?? "recent";

      const pageSize = 20;
      const skip = (page - 1) * pageSize;

      let orderBy: any = { createdAt: "desc" };

      if (sort === "highestReward") {
        orderBy = { rewardCash: "desc" };
      }

      if (sort === "soonestDeadline") {
        orderBy = { deadline: "asc" };
      }

      const contracts = await app.prisma.hitlistContract.findMany({
        where: {
          status: "ACTIVE"
        },
        include: {
          target: {
            select: {
              nickname: true
            }
          },
          creator: {
            select: {
              nickname: true
            }
          }
        },
        orderBy,
        skip,
        take: pageSize
      });

      return {
        contracts: contracts.map((c: any) => ({
          contractId: c.id,
          targetNickname: c.target.nickname,
          reward: c.rewardCash,
          deadline: c.deadline,
          minBulletsRequired: c.minBulletsRequired,
          creator: c.isAnonymous ? null : c.creator.nickname
        }))
      };
    }
  );


  /*
  CANCEL CONTRACT
  */
  app.post(
    "/hitlist/cancel",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      const { contractId } = req.body;

      const accountId = req.user.accountId;

      const creator = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        }
      });

      if (!creator) {
        return reply.code(404).send({ error: "No active character" });
      }

      const contract = await app.prisma.hitlistContract.findUnique({
        where: { id: contractId }
      });

      if (!contract) {
        return reply.code(404).send({ error: "Contract not found" });
      }

      if (contract.creatorCharacterId !== creator.id) {
        return reply.code(403).send({ error: "Not contract owner" });
      }

      if (contract.status !== "ACTIVE") {
        return reply.code(400).send({ error: "Contract not cancellable" });
      }

      const refund = Math.floor(contract.rewardCash * 0.9);

      await app.prisma.$transaction(async (tx: any) => {

        await tx.hitlistContract.update({
          where: { id: contractId },
          data: {
            status: "CANCELLED"
          }
        });

        await tx.character.update({
          where: { id: creator.id },
          data: {
            cash: { increment: refund }
          }
        });

      });

      await emitHitlistCancelled({
        contractId
      });

      await emitStateUpdate({
        characterId: creator.id
      });

      return {
        cancelled: true,
        refund
      };
    }
  );
}
