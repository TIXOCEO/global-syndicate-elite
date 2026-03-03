-- CreateTable
CREATE TABLE "CrimeCooldown" (
    "characterId" TEXT NOT NULL,
    "crimeType" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrimeCooldown_pkey" PRIMARY KEY ("characterId")
);

-- CreateIndex
CREATE INDEX "CrimeCooldown_characterId_idx" ON "CrimeCooldown"("characterId");

-- AddForeignKey
ALTER TABLE "CrimeCooldown" ADD CONSTRAINT "CrimeCooldown_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
