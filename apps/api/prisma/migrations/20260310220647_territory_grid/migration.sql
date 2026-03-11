-- CreateTable
CREATE TABLE "TerritoryCell" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "gridX" INTEGER NOT NULL,
    "gridY" INTEGER NOT NULL,
    "ownerCharacterId" TEXT,
    "controlPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerritoryCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TerritoryCell_countryId_idx" ON "TerritoryCell"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "TerritoryCell_countryId_gridX_gridY_key" ON "TerritoryCell"("countryId", "gridX", "gridY");

-- AddForeignKey
ALTER TABLE "TerritoryCell" ADD CONSTRAINT "TerritoryCell_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerritoryCell" ADD CONSTRAINT "TerritoryCell_ownerCharacterId_fkey" FOREIGN KEY ("ownerCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
