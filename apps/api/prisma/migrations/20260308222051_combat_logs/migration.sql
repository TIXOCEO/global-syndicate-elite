-- CreateTable
CREATE TABLE "CombatLog" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "bulletsUsed" INTEGER NOT NULL,
    "hit" BOOLEAN NOT NULL,
    "damage" DOUBLE PRECISION NOT NULL,
    "shootXp" INTEGER NOT NULL,
    "rxp" INTEGER NOT NULL,
    "notorietyGain" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CombatLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CombatLog_attackerId_idx" ON "CombatLog"("attackerId");

-- CreateIndex
CREATE INDEX "CombatLog_defenderId_idx" ON "CombatLog"("defenderId");

-- AddForeignKey
ALTER TABLE "CombatLog" ADD CONSTRAINT "CombatLog_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatLog" ADD CONSTRAINT "CombatLog_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
