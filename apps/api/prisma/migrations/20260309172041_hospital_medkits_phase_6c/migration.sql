-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('MEDKIT_I');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "medkitCooldownUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CharacterItem" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterItem_characterId_idx" ON "CharacterItem"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterItem_characterId_itemType_key" ON "CharacterItem"("characterId", "itemType");

-- AddForeignKey
ALTER TABLE "CharacterItem" ADD CONSTRAINT "CharacterItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
