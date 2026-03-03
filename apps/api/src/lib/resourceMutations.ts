import { PrismaClient } from "@prisma/client";

export async function applyResourceDelta(
  prisma: PrismaClient,
  characterId: string,
  delta: {
    cash?: number;
    lead?: number;
    bullets?: number;
  }
) {
  return prisma.character.update({
    where: { id: characterId },
    data: {
      cash: delta.cash !== undefined ? { increment: delta.cash } : undefined,
      lead: delta.lead !== undefined ? { increment: delta.lead } : undefined,
      bullets:
        delta.bullets !== undefined
          ? { increment: delta.bullets }
          : undefined
    }
  });
}
