/*
  Warnings:

  - You are about to drop the column `is_system` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `is_system` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `roles` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "core"."ActivityAction" ADD VALUE 'VISIT';
ALTER TYPE "core"."ActivityAction" ADD VALUE 'LEAVE';

-- DropForeignKey
ALTER TABLE "auth"."permissions" DROP CONSTRAINT "permissions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."roles" DROP CONSTRAINT "roles_tenant_id_fkey";

-- DropIndex
DROP INDEX "auth"."permissions_tenant_id_idx";

-- DropIndex
DROP INDEX "auth"."roles_tenant_id_idx";

-- AlterTable
ALTER TABLE "auth"."permissions" DROP COLUMN "is_system",
DROP COLUMN "tenant_id";

-- AlterTable
ALTER TABLE "auth"."roles" DROP COLUMN "is_system",
DROP COLUMN "tenant_id";

-- AlterTable
ALTER TABLE "auth"."users" ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "borrower"."kyc_documents" ADD COLUMN     "notes" TEXT;
