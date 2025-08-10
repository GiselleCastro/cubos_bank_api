/*
  Warnings:

  - Added the required column `last4` to the `Cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Cards" ADD COLUMN     "last4" TEXT NOT NULL;
