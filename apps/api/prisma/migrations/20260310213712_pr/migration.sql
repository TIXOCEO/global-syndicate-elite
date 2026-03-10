-- CreateTable
CREATE TABLE "CharacterAircraft" (
    "characterId" TEXT NOT NULL,
    "aircraftTier" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterAircraft_pkey" PRIMARY KEY ("characterId")
);

-- AddForeignKey
ALTER TABLE "CharacterAircraft" ADD CONSTRAINT "CharacterAircraft_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
