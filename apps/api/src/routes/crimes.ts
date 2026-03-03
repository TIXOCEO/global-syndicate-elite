import { FastifyInstance } from "fastify";
import { CrimeDefinitions } from "../game/crimeDefinitions";
import { applyResourceDelta } from "../lib/resourceMutations";
import { assertEnergyAvailable } from "../lib/energyValidation";

function computeShootingXP(cash: number) {
  return 4 + Math.floor(1.5 * Math.log(1 + cash / 100));
}

function computeSmugglingXP(cash: number) {
  return 4 + Math.floor(1.8 * Math.log(1 + cash / 150));
}

function computeRXP(cash: number) {
  return Math.round(8 + 0.8 * Math.log(1 + cash));
}

function requiredRXPForTier(t: number) {
  return Math.round(500 * Math.pow(t, 1.85));
}

export async function crimeRoutes(app: FastifyInstance) {
  app.post(
    "/crimes/commit",
    { preHandler: app.authenticate },
    async (req: any, reply) => {

      console.log("🔥 CRIME ROUTE HIT");

      const { crimeType } = req.body;
      console.log("Crime type:", crimeType);

      const accountId = req.user.accountId;
      console.log("Account ID:", accountId);

      const def = CrimeDefinitions[crimeType as keyof typeof CrimeDefinitions];
      console.log("Crime definition:", def);

      if (!def) {
        console.log("❌ Invalid crime type");
        return reply.code(400).send({ error: "Invalid crime type" });
      }

      console.log("Fetching character...");

      const character = await app.prisma.character.findFirst({
        where: {
          accountId,
          status: { in: ["ACTIVE", "CRITICAL"] }
        },
        include: {
          energy: true,
          skills: true
        }
      });

      console.log("Character found:", character?.id);

      if (!character) {
        console.log("❌ No active character");
        return reply.code(404).send({ error: "No active character" });
      }

      const currentEnergy = character.energy?.energy ?? 0;
      console.log("Current energy:", currentEnergy);

      try {
        assertEnergyAvailable(currentEnergy, def.energyCost);
        console.log("Energy check passed");
      } catch {
        console.log("❌ Not enough energy");
        return reply.code(400).send({ error: "Not enough energy" });
      }

      console.log("Deducting energy...");

      await app.prisma.energy.update({
        where: { characterId: character.id },
        data: {
          energy: { decrement: def.energyCost }
        }
      });

      console.log("Energy deducted");

      const skillValue =
        def.skillFocus === "shooting"
          ? character.skills?.shooting ?? 0
          : character.skills?.smuggling ?? 0;

      console.log("Skill value:", skillValue);

      let successChance =
        def.baseSuccessChance +
        0.0025 * skillValue +
        0.015 * (character.tier - 1);

      if (character.status === "CRITICAL") {
        successChance -= 0.15;
      }

      successChance = Math.min(0.95, Math.max(0.35, successChance));
      console.log("Success chance:", successChance);

      const success = Math.random() < successChance;
      console.log("Success result:", success);

      let cashReward = 0;
      let leadReward = 0;
      let shootingXP = 0;
      let smugglingXP = 0;
      let rxpGain = 0;
      let tierUp = false;

      if (success) {

        cashReward = Math.round(
          def.baseCash * (1 + 0.05 * (character.tier - 1))
        );

        if (Math.random() < def.baseLeadDropChance) {
          leadReward = Math.floor(Math.random() * 5) + 2;
        }

        if (character.status === "CRITICAL") {
          cashReward = Math.round(cashReward * 0.6);
          leadReward = Math.round(leadReward * 0.6);
        }

        console.log("Applying resource delta:", {
          cashReward,
          leadReward
        });

        await applyResourceDelta(app.prisma, character.id, {
          cash: cashReward,
          lead: leadReward
        });

        console.log("Resource delta applied");

        if (def.skillFocus === "shooting") {
          shootingXP = computeShootingXP(cashReward);
        } else {
          smugglingXP = computeSmugglingXP(cashReward);
        }

        rxpGain = computeRXP(cashReward);

        console.log("XP Gains:", {
          shootingXP,
          smugglingXP,
          rxpGain
        });
      }

      console.log("Starting transaction...");

      await app.prisma.$transaction(async (tx) => {

        console.log("Inside transaction");

        if (shootingXP > 0) {
          await tx.skills.update({
            where: { characterId: character.id },
            data: { shooting: { increment: shootingXP } }
          });
          console.log("Shooting XP updated");
        }

        if (smugglingXP > 0) {
          await tx.skills.update({
            where: { characterId: character.id },
            data: { smuggling: { increment: smugglingXP } }
          });
          console.log("Smuggling XP updated");
        }

        if (rxpGain > 0) {
          let newRXP = character.rxp + rxpGain;
          let newTier = character.tier;

          while (
            newTier < 10 &&
            newRXP >= requiredRXPForTier(newTier)
          ) {
            newRXP -= requiredRXPForTier(newTier);
            newTier++;
            tierUp = true;
          }

          await tx.character.update({
            where: { id: character.id },
            data: {
              rxp: newRXP,
              tier: newTier
            }
          });

          console.log("Character progression updated");
        }

        await tx.crimeLog.create({
          data: {
            characterId: character.id,
            crimeType,
            success,
            cashGranted: cashReward,
            leadGranted: leadReward,
            energyConsumed: def.energyCost
          }
        });

        console.log("Crime log created");
      });

      console.log("Transaction completed");

      return {
        success,
        cashReward,
        leadReward,
        shootingXP,
        smugglingXP,
        rxpGain,
        tierUp
      };
    }
  );
}
