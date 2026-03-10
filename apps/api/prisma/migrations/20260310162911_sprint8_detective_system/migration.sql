/*
  Warnings:

  - A unique constraint covering the columns `[viewerCharacterId,targetCharacterId]` on the table `DetectiveCooldown` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DetectiveCooldown_viewerCharacterId_targetCharacterId_key" ON "DetectiveCooldown"("viewerCharacterId", "targetCharacterId");
