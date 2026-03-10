-- AddForeignKey
ALTER TABLE "CombatLog" ADD CONSTRAINT "CombatLog_hitlistContractId_fkey" FOREIGN KEY ("hitlistContractId") REFERENCES "HitlistContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
