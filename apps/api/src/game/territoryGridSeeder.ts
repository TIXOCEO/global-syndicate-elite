import { PrismaClient } from "@prisma/client";

const GRID_SIZE = 20;

export async function seedTerritories(prisma: PrismaClient) {

  const countries = await prisma.country.findMany({
    select: { id: true }
  });

  for (const country of countries) {

    const existing = await prisma.territoryCell.count({
      where: { countryId: country.id }
    });

    // Already seeded
    if (existing > 0) {
      continue;
    }

    const cells = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {

        cells.push({
          countryId: country.id,
          gridX: x,
          gridY: y,
          controlPoints: 0
        });

      }
    }

    await prisma.territoryCell.createMany({
      data: cells
    });

  }

}
