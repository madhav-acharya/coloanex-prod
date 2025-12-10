/*
  Warnings:

  - The values [KYC_DOCUMENT] on the enum `ActivityEntityType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `primary_kyc_document_id` on the `borrowers` table. All the data in the column will be lost.
  - You are about to drop the `kyc_documents` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "borrower"."KycDocumentType" AS ENUM ('CITIZENSHIP', 'PASSPORT', 'DRIVING_LICENSE', 'PAN', 'OTHER');

-- CreateEnum
CREATE TYPE "borrower"."KycFileType" AS ENUM ('CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'PASSPORT', 'PAN', 'LICENSE_FRONT', 'LICENSE_BACK', 'SELFIE', 'COLLATERAL_PHOTO', 'SUPPORTING_DOCUMENT', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "core"."ActivityEntityType_new" AS ENUM ('ROLE', 'PERMISSION', 'USER', 'TENANT', 'BORROWER', 'KYC');
ALTER TABLE "core"."activity_logs" ALTER COLUMN "entityType" TYPE "core"."ActivityEntityType_new" USING ("entityType"::text::"core"."ActivityEntityType_new");
ALTER TYPE "core"."ActivityEntityType" RENAME TO "ActivityEntityType_old";
ALTER TYPE "core"."ActivityEntityType_new" RENAME TO "ActivityEntityType";
DROP TYPE "core"."ActivityEntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "borrower"."borrowers" DROP CONSTRAINT "borrowers_primary_kyc_document_id_fkey";

-- DropForeignKey
ALTER TABLE "borrower"."kyc_documents" DROP CONSTRAINT "kyc_documents_borrower_id_fkey";

-- DropIndex
DROP INDEX "borrower"."borrowers_primary_kyc_document_id_key";

-- AlterTable
ALTER TABLE "borrower"."borrowers" DROP COLUMN "primary_kyc_document_id";

-- DropTable
DROP TABLE "borrower"."kyc_documents";

-- CreateTable
CREATE TABLE "borrower"."kycs" (
    "id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "document_types" TEXT[],
    "firstName" TEXT NOT NULL,
    "middle_name" TEXT,
    "lastName" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "marital_status" TEXT,
    "spouse_name" TEXT,
    "father_name" TEXT,
    "mother_name" TEXT,
    "grandfather_name" TEXT,
    "citizenship_number" TEXT,
    "citizenship_issue_date" TIMESTAMP(3),
    "citizenship_district" TEXT,
    "passport_number" TEXT,
    "passport_issue_date" TIMESTAMP(3),
    "passport_expiry_date" TIMESTAMP(3),
    "pan_number" TEXT,
    "license_number" TEXT,
    "license_issue_date" TIMESTAMP(3),
    "license_expiry_date" TIMESTAMP(3),
    "permanent_province" TEXT,
    "permanent_district" TEXT,
    "permanent_municipality" TEXT,
    "permanent_ward" TEXT,
    "permanent_tole" TEXT,
    "temporary_province" TEXT,
    "temporary_district" TEXT,
    "temporary_municipality" TEXT,
    "temporary_ward" TEXT,
    "temporary_tole" TEXT,
    "phone_number" TEXT,
    "alternate_phone" TEXT,
    "email" TEXT,
    "occupation" TEXT,
    "employer_name" TEXT,
    "monthly_income" DOUBLE PRECISION,
    "bank_name" TEXT,
    "bank_account_number" TEXT,
    "bank_branch" TEXT,
    "loan_amount" DOUBLE PRECISION,
    "loan_purpose" TEXT,
    "loan_duration" INTEGER,
    "collateral_type" TEXT,
    "collateral_description" TEXT,
    "collateral_value" DOUBLE PRECISION,
    "status" "borrower"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kycs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrower"."kyc_files" (
    "id" TEXT NOT NULL,
    "kyc_id" TEXT NOT NULL,
    "file_type" "borrower"."KycFileType" NOT NULL,
    "document_type" TEXT,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_in_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kycs_borrower_id_idx" ON "borrower"."kycs"("borrower_id");

-- CreateIndex
CREATE INDEX "kycs_status_idx" ON "borrower"."kycs"("status");

-- CreateIndex
CREATE INDEX "kycs_citizenship_number_idx" ON "borrower"."kycs"("citizenship_number");

-- CreateIndex
CREATE INDEX "kycs_pan_number_idx" ON "borrower"."kycs"("pan_number");

-- CreateIndex
CREATE INDEX "kyc_files_kyc_id_idx" ON "borrower"."kyc_files"("kyc_id");

-- CreateIndex
CREATE INDEX "kyc_files_file_type_idx" ON "borrower"."kyc_files"("file_type");

-- AddForeignKey
ALTER TABLE "borrower"."kycs" ADD CONSTRAINT "kycs_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "borrower"."borrowers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrower"."kyc_files" ADD CONSTRAINT "kyc_files_kyc_id_fkey" FOREIGN KEY ("kyc_id") REFERENCES "borrower"."kycs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
