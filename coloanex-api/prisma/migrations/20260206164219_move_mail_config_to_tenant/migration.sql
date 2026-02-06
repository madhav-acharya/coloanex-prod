/*
  Warnings:

  - You are about to drop the `mail_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "core"."tenants" ADD COLUMN     "mail_access_token" TEXT,
ADD COLUMN     "mail_email" TEXT,
ADD COLUMN     "mail_refresh_token" TEXT,
ADD COLUMN     "mail_token_expiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "core"."mail_configs";
