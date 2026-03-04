-- DropIndex
DROP INDEX "CrimeLog_characterId_idx";

-- CreateIndex
CREATE INDEX "CrimeLog_characterId_createdAt_idx" ON "CrimeLog"("characterId", "createdAt" DESC);
