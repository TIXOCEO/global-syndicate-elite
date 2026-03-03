-- CreateTable
CREATE TABLE "CrimeLog" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "crimeType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "cashGranted" INTEGER NOT NULL,
    "leadGranted" INTEGER NOT NULL,
    "energyConsumed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrimeLog_characterId_idx" ON "CrimeLog"("characterId");

-- AddForeignKey
ALTER TABLE "CrimeLog" ADD CONSTRAINT "CrimeLog_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
