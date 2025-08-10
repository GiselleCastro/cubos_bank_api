-- AlterTable
ALTER TABLE "public"."Transactions" ADD COLUMN     "isReverted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reversedById" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Transactions" ADD CONSTRAINT "Transactions_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "public"."Transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
