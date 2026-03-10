-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "currentCountryId" TEXT NOT NULL DEFAULT 'GLOBAL';

-- CreateTable
CREATE TABLE "KnownLocation" (
    "id" TEXT NOT NULL,
    "viewerCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isFalseIntel" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "KnownLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectiveCooldown" (
    "id" TEXT NOT NULL,
    "viewerCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "cooldownUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectiveCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnownLocation_viewerCharacterId_idx" ON "KnownLocation"("viewerCharacterId");

-- CreateIndex
CREATE INDEX "KnownLocation_targetCharacterId_idx" ON "KnownLocation"("targetCharacterId");

-- CreateIndex
CREATE INDEX "DetectiveCooldown_viewerCharacterId_idx" ON "DetectiveCooldown"("viewerCharacterId");

-- CreateIndex
CREATE INDEX "DetectiveCooldown_targetCharacterId_idx" ON "DetectiveCooldown"("targetCharacterId");

-- AddForeignKey
ALTER TABLE "KnownLocation" ADD CONSTRAINT "KnownLocation_viewerCharacterId_fkey" FOREIGN KEY ("viewerCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnownLocation" ADD CONSTRAINT "KnownLocation_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
