-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('processing', 'unauthorized', 'authorized');

-- AlterTable
ALTER TABLE "public"."Transactions" ADD COLUMN     "status" "public"."TransactionStatus";
