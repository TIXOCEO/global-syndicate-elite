-- CreateEnum
CREATE TYPE "HitlistStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "CombatLog" ADD COLUMN     "hitlistContractId" TEXT;

-- CreateTable
CREATE TABLE "HitlistContract" (
    "id" TEXT NOT NULL,
    "creatorCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "rewardCash" INTEGER NOT NULL,
    "minBulletsRequired" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "HitlistStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "HitlistContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HitlistContract_targetCharacterId_idx" ON "HitlistContract"("targetCharacterId");

-- CreateIndex
CREATE INDEX "HitlistContract_status_idx" ON "HitlistContract"("status");

-- CreateIndex
CREATE INDEX "HitlistContract_deadline_idx" ON "HitlistContract"("deadline");

-- AddForeignKey
ALTER TABLE "HitlistContract" ADD CONSTRAINT "HitlistContract_creatorCharacterId_fkey" FOREIGN KEY ("creatorCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HitlistContract" ADD CONSTRAINT "HitlistContract_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
