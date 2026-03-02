-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "CharacterStatus" AS ENUM ('ACTIVE', 'CRITICAL', 'DEAD');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredByCode" TEXT,
    "eliteCredits" INTEGER NOT NULL DEFAULT 0,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "rxp" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL DEFAULT 1000,
    "notoriety" INTEGER NOT NULL DEFAULT 0,
    "cash" INTEGER NOT NULL DEFAULT 0,
    "lead" INTEGER NOT NULL DEFAULT 0,
    "bullets" INTEGER NOT NULL DEFAULT 0,
    "status" "CharacterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diedAt" TIMESTAMP(3),

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skills" (
    "characterId" TEXT NOT NULL,
    "shooting" INTEGER NOT NULL DEFAULT 0,
    "smuggling" INTEGER NOT NULL DEFAULT 0,
    "investigation" INTEGER NOT NULL DEFAULT 0,
    "jailXp" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Skills_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "Energy" (
    "characterId" TEXT NOT NULL,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "lastRegenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Energy_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "JailState" (
    "characterId" TEXT NOT NULL,
    "jailRemainingSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JailState_pkey" PRIMARY KEY ("characterId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_referralCode_key" ON "Account"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Character_nickname_key" ON "Character"("nickname");

-- CreateIndex
CREATE INDEX "Character_accountId_idx" ON "Character"("accountId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skills" ADD CONSTRAINT "Skills_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Energy" ADD CONSTRAINT "Energy_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JailState" ADD CONSTRAINT "JailState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
