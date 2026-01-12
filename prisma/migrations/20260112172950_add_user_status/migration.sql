-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('RED', 'YELLOW', 'GREEN', 'CLEAN', 'ARCHIVED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'GREEN';

