/*
  Warnings:

  - The values [OTHER] on the enum `KycFileType` will be removed. If these variants are still used in the database, this will fail.
  - The values [VISIT,LEAVE] on the enum `ActivityAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_REVIEW,DISBURSED,ACTIVE,CLOSED,DEFAULTED] on the enum `LoanStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INVESTMENT,REPAYMENT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isBanned` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastActiveAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `borrowers` table. All the data in the column will be lost.
  - You are about to drop the column `kycLastCheckedAt` on the `borrowers` table. All the data in the column will be lost.
  - You are about to drop the column `kycStatus` on the `borrowers` table. All the data in the column will be lost.
  - You are about to drop the column `rewardScore` on the `borrowers` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `borrowers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `borrowers` table. All the data in the column will be lost.
  - You are about to drop the column `document_number` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `document_type` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_date` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `file_name` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `issue_date` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `issue_district` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `mime_type` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `size_in_bytes` on the `kyc_files` table. All the data in the column will be lost.
  - You are about to drop the column `bank_account_number` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `bank_branch` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `bank_name` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `document_types` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `father_name` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `grandfather_name` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `marital_status` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `middle_name` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `mother_name` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `passport_size_photo_url` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_district` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_municipality` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_province` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_tole` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_ward` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `isBanned` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `collateral_description` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `collateral_image_url` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `collateral_type` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `collateral_value` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `disbursed_at` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `expected_loan_amount` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `interest_rate` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `loan_purpose` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `provided_loan_amount` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `term_months` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `tx_hash` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `loan_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `repayment_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `tx_hash` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccountNumber` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the `investments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `repayments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenant_id,user_id]` on the table `borrowers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `full_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `borrowers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `borrowers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document_metadata` to the `kyc_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bank_details` to the `kycs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `kycs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permanent_address` to the `kycs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personal_details` to the `kycs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photo_url` to the `kycs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity_type` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collateral_details` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_amount` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_term_months` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "finance"."InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "finance"."RuleType" AS ENUM ('STANDARD', 'PREMIUM', 'MICRO_LOAN', 'BUSINESS_LOAN');

-- CreateEnum
CREATE TYPE "finance"."PenaltyType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "finance"."ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "finance"."PaymentFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "finance"."PaymentGateway" AS ENUM ('ESEWA', 'FONEPAY', 'KHALTI', 'WALLET', 'BANK_TRANSFER');

-- AlterEnum
BEGIN;
CREATE TYPE "borrower"."KycFileType_new" AS ENUM ('CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'PASSPORT', 'PAN', 'LICENSE_FRONT', 'LICENSE_BACK', 'SELFIE', 'SUPPORTING_DOCUMENT');
ALTER TABLE "borrower"."kyc_files" ALTER COLUMN "file_type" TYPE "borrower"."KycFileType_new" USING ("file_type"::text::"borrower"."KycFileType_new");
ALTER TYPE "borrower"."KycFileType" RENAME TO "KycFileType_old";
ALTER TYPE "borrower"."KycFileType_new" RENAME TO "KycFileType";
DROP TYPE "borrower"."KycFileType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "core"."ActivityAction_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'KYC_VERIFY', 'KYC_REJECT', 'LOAN_APPROVE', 'LOAN_REJECT', 'CONTRACT_SIGN', 'LOAN_DISBURSE', 'PAYMENT_RECEIVED', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET');
ALTER TABLE "core"."activity_logs" ALTER COLUMN "action" TYPE "core"."ActivityAction_new" USING ("action"::text::"core"."ActivityAction_new");
ALTER TYPE "core"."ActivityAction" RENAME TO "ActivityAction_old";
ALTER TYPE "core"."ActivityAction_new" RENAME TO "ActivityAction";
DROP TYPE "core"."ActivityAction_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "core"."ActivityEntityType" ADD VALUE 'LOAN';
ALTER TYPE "core"."ActivityEntityType" ADD VALUE 'CONTRACT';
ALTER TYPE "core"."ActivityEntityType" ADD VALUE 'RULE';
ALTER TYPE "core"."ActivityEntityType" ADD VALUE 'PAYMENT';

-- AlterEnum
BEGIN;
CREATE TYPE "finance"."LoanStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CONTRACT_GENERATED', 'CONTRACT_SIGNED');
ALTER TABLE "finance"."loans" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "finance"."loans" ALTER COLUMN "status" TYPE "finance"."LoanStatus_new" USING ("status"::text::"finance"."LoanStatus_new");
ALTER TYPE "finance"."LoanStatus" RENAME TO "LoanStatus_old";
ALTER TYPE "finance"."LoanStatus_new" RENAME TO "LoanStatus";
DROP TYPE "finance"."LoanStatus_old";
ALTER TABLE "finance"."loans" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "finance"."TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAW', 'DISBURSEMENT', 'INSTALLMENT_PAYMENT', 'PENALTY_PAYMENT', 'FEE');
ALTER TABLE "finance"."transactions" ALTER COLUMN "type" TYPE "finance"."TransactionType_new" USING ("type"::text::"finance"."TransactionType_new");
ALTER TYPE "finance"."TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "finance"."TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "finance"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "borrower"."borrowers" DROP CONSTRAINT "borrowers_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "finance"."investments" DROP CONSTRAINT "investments_investor_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."investments" DROP CONSTRAINT "investments_loan_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."repayments" DROP CONSTRAINT "repayments_loan_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."repayments" DROP CONSTRAINT "repayments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."transactions" DROP CONSTRAINT "transactions_loan_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."transactions" DROP CONSTRAINT "transactions_repayment_id_fkey";

-- DropIndex
DROP INDEX "auth"."users_tenant_id_isActive_idx";

-- DropIndex
DROP INDEX "borrower"."borrowers_tenantId_idx";

-- DropIndex
DROP INDEX "borrower"."borrowers_tenantId_kycStatus_idx";

-- DropIndex
DROP INDEX "borrower"."borrowers_tenantId_user_id_key";

-- DropIndex
DROP INDEX "core"."activity_logs_actor_user_id_createdAt_idx";

-- DropIndex
DROP INDEX "core"."activity_logs_entityType_entityId_idx";

-- DropIndex
DROP INDEX "core"."activity_logs_tenant_id_createdAt_idx";

-- DropIndex
DROP INDEX "core"."tenants_isActive_idx";

-- DropIndex
DROP INDEX "core"."tenants_isBanned_idx";

-- DropIndex
DROP INDEX "finance"."transactions_loan_id_idx";

-- DropIndex
DROP INDEX "finance"."transactions_repayment_id_idx";

-- DropIndex
DROP INDEX "finance"."wallets_bankAccountNumber_key";

-- AlterTable
ALTER TABLE "auth"."users" DROP COLUMN "createdAt",
DROP COLUMN "fullName",
DROP COLUMN "isActive",
DROP COLUMN "isBanned",
DROP COLUMN "isEmailVerified",
DROP COLUMN "lastActiveAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_active_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "borrower"."borrowers" DROP COLUMN "createdAt",
DROP COLUMN "kycLastCheckedAt",
DROP COLUMN "kycStatus",
DROP COLUMN "rewardScore",
DROP COLUMN "tenantId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "credit_score" DOUBLE PRECISION,
ADD COLUMN     "kyc_last_checked_at" TIMESTAMP(3),
ADD COLUMN     "kyc_status" "borrower"."KycStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "borrower"."kyc_files" DROP COLUMN "document_number",
DROP COLUMN "document_type",
DROP COLUMN "expiry_date",
DROP COLUMN "file_name",
DROP COLUMN "issue_date",
DROP COLUMN "issue_district",
DROP COLUMN "mime_type",
DROP COLUMN "size_in_bytes",
ADD COLUMN     "document_metadata" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "borrower"."kycs" DROP COLUMN "bank_account_number",
DROP COLUMN "bank_branch",
DROP COLUMN "bank_name",
DROP COLUMN "document_types",
DROP COLUMN "father_name",
DROP COLUMN "firstName",
DROP COLUMN "gender",
DROP COLUMN "grandfather_name",
DROP COLUMN "lastName",
DROP COLUMN "marital_status",
DROP COLUMN "middle_name",
DROP COLUMN "mother_name",
DROP COLUMN "passport_size_photo_url",
DROP COLUMN "permanent_district",
DROP COLUMN "permanent_municipality",
DROP COLUMN "permanent_province",
DROP COLUMN "permanent_tole",
DROP COLUMN "permanent_ward",
ADD COLUMN     "bank_details" JSONB NOT NULL,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "permanent_address" JSONB NOT NULL,
ADD COLUMN     "personal_details" JSONB NOT NULL,
ADD COLUMN     "photo_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "core"."activity_logs" DROP COLUMN "createdAt",
DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "entity_type" "core"."ActivityEntityType" NOT NULL,
ADD COLUMN     "ip_address" VARCHAR(45),
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "core"."tenants" DROP COLUMN "contactEmail",
DROP COLUMN "contactPhone",
DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "isBanned",
DROP COLUMN "updatedAt",
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_phone" VARCHAR(20),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "established_year" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_publicly_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "total_loans_issued" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "finance"."loans" DROP COLUMN "amount",
DROP COLUMN "collateral_description",
DROP COLUMN "collateral_image_url",
DROP COLUMN "collateral_type",
DROP COLUMN "collateral_value",
DROP COLUMN "disbursed_at",
DROP COLUMN "due_date",
DROP COLUMN "expected_loan_amount",
DROP COLUMN "interest_rate",
DROP COLUMN "loan_purpose",
DROP COLUMN "provided_loan_amount",
DROP COLUMN "term_months",
DROP COLUMN "tx_hash",
ADD COLUMN     "approved_amount" DECIMAL(20,2),
ADD COLUMN     "collateral_details" JSONB NOT NULL,
ADD COLUMN     "purpose" TEXT NOT NULL,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "requested_amount" DECIMAL(20,2) NOT NULL,
ADD COLUMN     "requested_term_months" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "finance"."transactions" DROP COLUMN "loan_id",
DROP COLUMN "repayment_id",
DROP COLUMN "tx_hash",
ADD COLUMN     "blockchain_tx_hash" TEXT,
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "contract_id" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "gateway_details" JSONB,
ADD COLUMN     "payment_schedule_id" TEXT;

-- AlterTable
ALTER TABLE "finance"."wallets" DROP COLUMN "bankAccountNumber",
ADD COLUMN     "payment_gateway_links" JSONB,
ADD COLUMN     "pending_balance" DECIMAL(20,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "finance"."investments";

-- DropTable
DROP TABLE "finance"."repayments";

-- DropEnum
DROP TYPE "borrower"."KycDocumentType";

-- DropEnum
DROP TYPE "finance"."RepaymentStatus";

-- CreateTable
CREATE TABLE "finance"."rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rule_type" "finance"."RuleType" NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "loan_limits" JSONB NOT NULL,
    "penalty_config" JSONB NOT NULL,
    "payment_config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_publicly_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."contracts" (
    "id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "status" "finance"."ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "loan_amount" DECIMAL(20,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "payment_frequency" "finance"."PaymentFrequency" NOT NULL,
    "installment_amount" DECIMAL(20,2) NOT NULL,
    "total_installments" INTEGER NOT NULL,
    "total_amount_due" DECIMAL(20,2) NOT NULL,
    "total_amount_paid" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "outstanding_balance" DECIMAL(20,2) NOT NULL,
    "contract_pdf_url" TEXT,
    "signatures" JSONB,
    "blockchain_data" JSONB,
    "terms_and_conditions" TEXT NOT NULL,
    "disbursement_info" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."payment_schedules" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "principal_amount" DECIMAL(20,2) NOT NULL,
    "interest_amount" DECIMAL(20,2) NOT NULL,
    "total_amount" DECIMAL(20,2) NOT NULL,
    "status" "finance"."InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "amount_paid" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "penalty_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMP(3),
    "payment_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rules_tenant_id_idx" ON "finance"."rules"("tenant_id");

-- CreateIndex
CREATE INDEX "rules_rule_type_idx" ON "finance"."rules"("rule_type");

-- CreateIndex
CREATE INDEX "rules_is_active_idx" ON "finance"."rules"("is_active");

-- CreateIndex
CREATE INDEX "rules_is_publicly_visible_idx" ON "finance"."rules"("is_publicly_visible");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "finance"."contracts"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_loan_id_key" ON "finance"."contracts"("loan_id");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_idx" ON "finance"."contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "contracts_borrower_id_idx" ON "finance"."contracts"("borrower_id");

-- CreateIndex
CREATE INDEX "contracts_loan_id_idx" ON "finance"."contracts"("loan_id");

-- CreateIndex
CREATE INDEX "contracts_rule_id_idx" ON "finance"."contracts"("rule_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "finance"."contracts"("status");

-- CreateIndex
CREATE INDEX "payment_schedules_contract_id_idx" ON "finance"."payment_schedules"("contract_id");

-- CreateIndex
CREATE INDEX "payment_schedules_status_idx" ON "finance"."payment_schedules"("status");

-- CreateIndex
CREATE INDEX "payment_schedules_due_date_idx" ON "finance"."payment_schedules"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_contract_id_installment_number_key" ON "finance"."payment_schedules"("contract_id", "installment_number");

-- CreateIndex
CREATE INDEX "users_tenant_id_is_active_idx" ON "auth"."users"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "borrowers_tenant_id_kyc_status_idx" ON "borrower"."borrowers"("tenant_id", "kyc_status");

-- CreateIndex
CREATE INDEX "borrowers_tenant_id_idx" ON "borrower"."borrowers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "borrowers_tenant_id_user_id_key" ON "borrower"."borrowers"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "activity_logs_tenant_id_created_at_idx" ON "core"."activity_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_actor_user_id_created_at_idx" ON "core"."activity_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "core"."activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "tenants_is_active_idx" ON "core"."tenants"("is_active");

-- CreateIndex
CREATE INDEX "tenants_is_banned_idx" ON "core"."tenants"("is_banned");

-- CreateIndex
CREATE INDEX "tenants_is_publicly_visible_idx" ON "core"."tenants"("is_publicly_visible");

-- CreateIndex
CREATE INDEX "transactions_contract_id_idx" ON "finance"."transactions"("contract_id");

-- CreateIndex
CREATE INDEX "transactions_payment_schedule_id_idx" ON "finance"."transactions"("payment_schedule_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "finance"."transactions"("status");

-- AddForeignKey
ALTER TABLE "borrower"."borrowers" ADD CONSTRAINT "borrowers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."rules" ADD CONSTRAINT "rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."contracts" ADD CONSTRAINT "contracts_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "borrower"."borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."contracts" ADD CONSTRAINT "contracts_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "finance"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."contracts" ADD CONSTRAINT "contracts_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "finance"."rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."payment_schedules" ADD CONSTRAINT "payment_schedules_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "finance"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transactions" ADD CONSTRAINT "transactions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "finance"."contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transactions" ADD CONSTRAINT "transactions_payment_schedule_id_fkey" FOREIGN KEY ("payment_schedule_id") REFERENCES "finance"."payment_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
