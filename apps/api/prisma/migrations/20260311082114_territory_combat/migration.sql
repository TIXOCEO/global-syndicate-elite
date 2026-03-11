-- CreateTable
CREATE TABLE "TerritoryCombatLog" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "territoryCellId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerritoryCombatLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TerritoryCombatLog_attackerId_idx" ON "TerritoryCombatLog"("attackerId");

-- CreateIndex
CREATE INDEX "TerritoryCombatLog_defenderId_idx" ON "TerritoryCombatLog"("defenderId");

-- CreateIndex
CREATE INDEX "TerritoryCombatLog_territoryCellId_idx" ON "TerritoryCombatLog"("territoryCellId");
