/*
  Warnings:

  - The values [SICK_LEAVE] on the enum `ActivityType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('CODING', 'REVIEW', 'STUDING', 'SICKLEAVE');
ALTER TABLE "WorkLog" ALTER COLUMN "activity" TYPE "ActivityType_new" USING ("activity"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "public"."ActivityType_old";
COMMIT;
