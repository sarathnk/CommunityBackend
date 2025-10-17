-- AlterTable
ALTER TABLE "Event" ADD COLUMN "actualCost" REAL;
ALTER TABLE "Event" ADD COLUMN "budget" REAL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME;
