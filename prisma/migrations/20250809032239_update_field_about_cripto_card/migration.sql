/*
  Warnings:

  - You are about to drop the column `cvv` on the `Cards` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Cards` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `Cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blob` to the `Cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Cards_number_key";

-- AlterTable
ALTER TABLE "public"."Cards" DROP COLUMN "cvv",
DROP COLUMN "number",
ADD COLUMN     "blob" BYTEA NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cards_token_key" ON "public"."Cards"("token");
