import { FastifyInstance } from "fastify";

const MEDKIT_COOLDOWN_MS = 2 * 60 * 60 * 1000;

const TREATMENTS = {
  BASIC_CLINIC: {
    name: "Basic Clinic",
    reductionPercent: 10
  },
  PRIVATE_SURGEON: {
    name: "Private Surgeon",
    reductionPercent: 25
  },
  ELITE_MEDICAL_FACILITY: {
    name: "Elite Medical Facility",
    reductionPercent: 45
  }
} as const;

type TreatmentType = keyof typeof TREATMENTS;

function getTreatmentCost(treatmentType: TreatmentType, severity: number) {
  switch (treatmentType) {
    case "BASIC_CLINIC":
      return Math.round(1500 + 15 * severity);
    case "PRIVATE_SURGEON":
      return Math.round(4500 + 45 * severity);
    case "ELITE_MEDICAL_FACILITY":
      return Math.round(9000 + 90 * severity);
    default:
      return 0;
  }
}

function getRemainingRecoveryMs(recoveryUntil: Date | null) {
  if (!recoveryUntil) return 0;
  return Math.max(0, recoveryUntil.getTime() - Date.now());
}

function getInitialRecoveryMs(severity: number) {
  const minutes = 20 + severity * 0.8;
  return Math.floor(minutes * 60 * 1000);
}

export async function hospitalRoutes(app: FastifyInstance) {
  app.get(
    "/hospital/status",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          jail: true,
          items: {
            where: { itemType: "MEDKIT_I" }
          }
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      const now = Date.now();
      const jailRemaining = character.jail?.jailRemainingSeconds ?? 0;
      const recoveryRemainingMs = getRemainingRecoveryMs(
        character.recoveryUntil ?? null
      );
      const recovering = recoveryRemainingMs > 0;

      const medkit = character.items[0] ?? null;
      const medkitQuantity = medkit?.quantity ?? 0;

      const medkitCooldownRemainingMs =
        character.medkitCooldownUntil
          ? Math.max(0, character.medkitCooldownUntil.getTime() - now)
          : 0;

      return {
        character: {
          id: character.id,
          nickname: character.nickname,
          hp: character.hp,
          status: character.status,
          cash: character.cash,
          injurySeverity: character.injurySeverity,
          recoveryUntil: character.recoveryUntil?.getTime() ?? null,
          recoveryRemainingMs,
          medkitCooldownUntil: character.medkitCooldownUntil?.getTime() ?? null,
          medkitCooldownRemainingMs
        },
        jail: {
          remaining: jailRemaining
        },
        medkit: {
          quantity: medkitQuantity,
          canUse:
            recovering &&
            character.injurySeverity > 0 &&
            jailRemaining <= 0 &&
            medkitQuantity > 0 &&
            medkitCooldownRemainingMs <= 0,
          reason:
            jailRemaining > 0
              ? "Unavailable while jailed"
              : !recovering
              ? "No active recovery"
              : character.injurySeverity <= 0
              ? "No injury"
              : medkitQuantity <= 0
              ? "No Medkit I in inventory"
              : medkitCooldownRemainingMs > 0
              ? "Medkit cooldown active"
              : null
        },
        treatments: (
          Object.keys(TREATMENTS) as TreatmentType[]
        ).map((type) => ({
          type,
          name: TREATMENTS[type].name,
          reductionPercent: TREATMENTS[type].reductionPercent,
          cost: getTreatmentCost(type, character.injurySeverity),
          enabled:
            jailRemaining <= 0 &&
            character.injurySeverity > 0,
          reason:
            jailRemaining > 0
              ? "Unavailable while jailed"
              : character.injurySeverity <= 0
              ? "No injury"
              : null
        }))
      };
    }
  );

  app.post(
    "/hospital/treat",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const { treatmentType } = req.body as { treatmentType: TreatmentType };
      const accountId = req.user.accountId;

      if (!treatmentType || !TREATMENTS[treatmentType]) {
        return reply.code(400).send({ error: "Invalid treatment type" });
      }

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: { jail: true }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      if ((character.jail?.jailRemainingSeconds ?? 0) > 0) {
        return reply.code(403).send({ error: "Cannot use hospital while jailed" });
      }

      if (character.injurySeverity <= 0) {
        return reply.code(400).send({ error: "No injury to treat" });
      }

      const cost = getTreatmentCost(treatmentType, character.injurySeverity);

      if (character.cash < cost) {
        return reply.code(400).send({ error: "Insufficient cash" });
      }

      const reductionPercent = TREATMENTS[treatmentType].reductionPercent;

      let recoveryRemainingMs = getRemainingRecoveryMs(
        character.recoveryUntil ?? null
      );

      if (recoveryRemainingMs <= 0) {
        recoveryRemainingMs = getInitialRecoveryMs(character.injurySeverity);
      }

      const newRemainingMs = Math.max(
        0,
        Math.ceil(recoveryRemainingMs * (1 - reductionPercent / 100))
      );

      const now = Date.now();

      const nextRecoveryUntil =
        newRemainingMs <= 1000
          ? null
          : new Date(now + newRemainingMs);

      const updated = await app.prisma.character.update({
        where: { id: character.id },
        data: {
          cash: { decrement: cost },
          recoveryUntil: nextRecoveryUntil,
          ...(nextRecoveryUntil
            ? {}
            : {
                injurySeverity: 0,
                hp: Math.max(character.hp, 650)
              })
        }
      });

      return {
        success: true,
        treatmentType,
        cost,
        recoveryUntil: updated.recoveryUntil?.getTime() ?? null,
        cash: updated.cash,
        hp: updated.hp
      };
    }
  );

  app.post(
    "/hospital/use-medkit",
    { preHandler: app.authenticate },
    async (req: any, reply) => {
      const accountId = req.user.accountId;

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          jail: true,
          items: {
            where: {
              itemType: "MEDKIT_I"
            }
          }
        }
      });

      if (!character) {
        return reply.code(404).send({ error: "No active character" });
      }

      if (character.status === "DEAD") {
        return reply.code(400).send({ error: "Dead characters cannot use medkits" });
      }

      if ((character.jail?.jailRemainingSeconds ?? 0) > 0) {
        return reply.code(403).send({ error: "Cannot use medkit while jailed" });
      }

      const recoveryRemainingMs = getRemainingRecoveryMs(
        character.recoveryUntil ?? null
      );

      if (recoveryRemainingMs <= 0 || character.injurySeverity <= 0) {
        return reply.code(400).send({ error: "Character is not recovering" });
      }

      if (
        character.medkitCooldownUntil &&
        character.medkitCooldownUntil.getTime() > Date.now()
      ) {
        return reply.code(429).send({ error: "Medkit cooldown active" });
      }

      const medkit = character.items[0] ?? null;

      if (!medkit || medkit.quantity <= 0) {
        return reply.code(400).send({ error: "No Medkit I available" });
      }

      const newRemainingMs = Math.max(
        0,
        Math.ceil(recoveryRemainingMs * 0.92)
      );

      const now = Date.now();

      const nextRecoveryUntil =
        newRemainingMs <= 1000
          ? null
          : new Date(now + newRemainingMs);

      const medkitCooldownUntil = new Date(now + MEDKIT_COOLDOWN_MS);

      const result = await app.prisma.$transaction(async (tx: any) => {
        const updatedCharacter = await tx.character.update({
          where: { id: character.id },
          data: {
            medkitCooldownUntil,
            recoveryUntil: nextRecoveryUntil,
            ...(nextRecoveryUntil
              ? {}
              : {
                  injurySeverity: 0,
                  hp: Math.max(character.hp, 650)
                })
          }
        });

        await tx.characterItem.update({
          where: {
            characterId_itemType: {
              characterId: character.id,
              itemType: "MEDKIT_I"
            }
          },
          data: {
            quantity: {
              decrement: 1
            }
          }
        });

        return updatedCharacter;
      });

      app.log.info({
        type: "medkit_used",
        characterId: character.id,
        itemType: "MEDKIT_I",
        nextRecoveryUntil: result.recoveryUntil?.toISOString() ?? null,
        medkitCooldownUntil: result.medkitCooldownUntil?.toISOString() ?? null
      });

      return {
        success: true,
        itemType: "MEDKIT_I",
        injurySeverity: result.injurySeverity,
        recoveryUntil: result.recoveryUntil?.getTime() ?? null,
        recoveryRemainingMs: getRemainingRecoveryMs(result.recoveryUntil ?? null),
        medkitCooldownUntil: result.medkitCooldownUntil?.getTime() ?? null,
        hp: result.hp
      };
    }
  );
}
