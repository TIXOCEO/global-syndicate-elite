-- CreateEnum
CREATE TYPE "FactoryType" AS ENUM ('MINI', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateTable
CREATE TABLE "BulletFactory" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "factoryType" "FactoryType" NOT NULL,
    "productionRatePerHour" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulletFactory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulletFactory_characterId_idx" ON "BulletFactory"("characterId");

-- AddForeignKey
ALTER TABLE "BulletFactory" ADD CONSTRAINT "BulletFactory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
