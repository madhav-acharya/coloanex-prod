/*
  Warnings:

  - You are about to drop the column `user_id` on the `investments` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `amount_due` on the `repayments` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `repayments` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `repayments` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `wallets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bankAccountNumber]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `investor_id` to the `investments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collateral_description` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collateral_image_url` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collateral_type` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collateral_value` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expected_loan_amount` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loan_purpose` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provided_loan_amount` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "finance"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "finance"."investments" DROP CONSTRAINT "investments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."loans" DROP CONSTRAINT "loans_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."wallets" DROP CONSTRAINT "wallets_tenant_id_fkey";

-- DropIndex
DROP INDEX "finance"."investments_user_id_idx";

-- DropIndex
DROP INDEX "finance"."loans_tenant_id_idx";

-- DropIndex
DROP INDEX "finance"."repayments_status_idx";

-- DropIndex
DROP INDEX "finance"."wallets_address_key";

-- DropIndex
DROP INDEX "finance"."wallets_tenant_id_idx";

-- AlterTable
ALTER TABLE "finance"."investments" DROP COLUMN "user_id",
ADD COLUMN     "investor_id" TEXT NOT NULL,
ADD COLUMN     "tx_hash" TEXT;

-- AlterTable
ALTER TABLE "finance"."loans" DROP COLUMN "tenant_id",
ADD COLUMN     "collateral_description" TEXT NOT NULL,
ADD COLUMN     "collateral_image_url" TEXT NOT NULL,
ADD COLUMN     "collateral_type" TEXT NOT NULL,
ADD COLUMN     "collateral_value" DECIMAL(20,2) NOT NULL,
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "expected_loan_amount" DECIMAL(20,2) NOT NULL,
ADD COLUMN     "loan_purpose" TEXT NOT NULL,
ADD COLUMN     "provided_loan_amount" DECIMAL(20,2) NOT NULL,
ADD COLUMN     "tx_hash" TEXT;

-- AlterTable
ALTER TABLE "finance"."repayments" DROP COLUMN "amount_due",
DROP COLUMN "due_date",
DROP COLUMN "status",
ADD COLUMN     "tx_hash" TEXT;

-- AlterTable
ALTER TABLE "finance"."transactions" ADD COLUMN     "status" "finance"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tx_hash" TEXT;

-- AlterTable
ALTER TABLE "finance"."wallets" DROP COLUMN "address",
DROP COLUMN "tenant_id",
ADD COLUMN     "bankAccountNumber" TEXT;

-- CreateIndex
CREATE INDEX "investments_investor_id_idx" ON "finance"."investments"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_bankAccountNumber_key" ON "finance"."wallets"("bankAccountNumber");

-- AddForeignKey
ALTER TABLE "finance"."investments" ADD CONSTRAINT "investments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
