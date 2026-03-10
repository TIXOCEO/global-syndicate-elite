-- CreateTable
CREATE TABLE "JailActionLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JailActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JailActionLog_actorId_idx" ON "JailActionLog"("actorId");

-- CreateIndex
CREATE INDEX "JailActionLog_targetId_idx" ON "JailActionLog"("targetId");
