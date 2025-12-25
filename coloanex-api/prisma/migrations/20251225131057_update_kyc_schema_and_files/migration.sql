/*
  Warnings:

  - You are about to drop the column `alternate_phone` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `citizenship_district` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `citizenship_issue_date` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `citizenship_number` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `employer_name` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `license_expiry_date` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `license_issue_date` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `license_number` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `pan_number` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `passport_expiry_date` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `passport_issue_date` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `passport_number` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `spouse_name` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `temporary_district` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `temporary_municipality` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `temporary_province` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `temporary_tole` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `temporary_ward` on the `kycs` table. All the data in the column will be lost.
  - Added the required column `passport_size_photo_url` to the `kycs` table without a default value. This is not possible if the table is not empty.
  - Made the column `gender` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `marital_status` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `father_name` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mother_name` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `grandfather_name` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_province` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_district` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_municipality` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_ward` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_tole` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `occupation` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `monthly_income` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bank_name` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bank_account_number` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bank_branch` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `loan_amount` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `loan_purpose` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `loan_duration` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `collateral_type` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `collateral_description` on table `kycs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `collateral_value` on table `kycs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "borrower"."kycs_citizenship_number_idx";

-- DropIndex
DROP INDEX "borrower"."kycs_pan_number_idx";

-- AlterTable: Add new columns to kyc_files
ALTER TABLE "borrower"."kyc_files" ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "issue_date" TIMESTAMP(3),
ADD COLUMN     "issue_district" TEXT;

-- AlterTable: First, add the new column with a default value
ALTER TABLE "borrower"."kycs" ADD COLUMN "passport_size_photo_url" TEXT NOT NULL DEFAULT 'https://via.placeholder.com/150';

-- Update NULL values with default values before making columns NOT NULL
UPDATE "borrower"."kycs" 
SET 
  "gender" = COALESCE("gender", 'Not Specified'),
  "marital_status" = COALESCE("marital_status", 'Not Specified'),
  "father_name" = COALESCE("father_name", 'Not Provided'),
  "mother_name" = COALESCE("mother_name", 'Not Provided'),
  "grandfather_name" = COALESCE("grandfather_name", 'Not Provided'),
  "permanent_province" = COALESCE("permanent_province", 'Not Specified'),
  "permanent_district" = COALESCE("permanent_district", 'Not Specified'),
  "permanent_municipality" = COALESCE("permanent_municipality", 'Not Specified'),
  "permanent_ward" = COALESCE("permanent_ward", 'Not Specified'),
  "permanent_tole" = COALESCE("permanent_tole", 'Not Specified'),
  "occupation" = COALESCE("occupation", 'Not Specified'),
  "monthly_income" = COALESCE("monthly_income", 0),
  "bank_name" = COALESCE("bank_name", 'Not Specified'),
  "bank_account_number" = COALESCE("bank_account_number", 'Not Specified'),
  "bank_branch" = COALESCE("bank_branch", 'Not Specified'),
  "loan_amount" = COALESCE("loan_amount", 0),
  "loan_purpose" = COALESCE("loan_purpose", 'Not Specified'),
  "loan_duration" = COALESCE("loan_duration", 0),
  "collateral_type" = COALESCE("collateral_type", 'Not Specified'),
  "collateral_description" = COALESCE("collateral_description", 'Not Specified'),
  "collateral_value" = COALESCE("collateral_value", 0)
WHERE 
  "gender" IS NULL OR
  "marital_status" IS NULL OR
  "father_name" IS NULL OR
  "mother_name" IS NULL OR
  "grandfather_name" IS NULL OR
  "permanent_province" IS NULL OR
  "permanent_district" IS NULL OR
  "permanent_municipality" IS NULL OR
  "permanent_ward" IS NULL OR
  "permanent_tole" IS NULL OR
  "occupation" IS NULL OR
  "monthly_income" IS NULL OR
  "bank_name" IS NULL OR
  "bank_account_number" IS NULL OR
  "bank_branch" IS NULL OR
  "loan_amount" IS NULL OR
  "loan_purpose" IS NULL OR
  "loan_duration" IS NULL OR
  "collateral_type" IS NULL OR
  "collateral_description" IS NULL OR
  "collateral_value" IS NULL;

-- Now drop the old columns and alter the table structure
ALTER TABLE "borrower"."kycs" 
DROP COLUMN "alternate_phone",
DROP COLUMN "citizenship_district",
DROP COLUMN "citizenship_issue_date",
DROP COLUMN "citizenship_number",
DROP COLUMN "email",
DROP COLUMN "employer_name",
DROP COLUMN "license_expiry_date",
DROP COLUMN "license_issue_date",
DROP COLUMN "license_number",
DROP COLUMN "pan_number",
DROP COLUMN "passport_expiry_date",
DROP COLUMN "passport_issue_date",
DROP COLUMN "passport_number",
DROP COLUMN "phone_number",
DROP COLUMN "spouse_name",
DROP COLUMN "temporary_district",
DROP COLUMN "temporary_municipality",
DROP COLUMN "temporary_province",
DROP COLUMN "temporary_tole",
DROP COLUMN "temporary_ward",
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "marital_status" SET NOT NULL,
ALTER COLUMN "father_name" SET NOT NULL,
ALTER COLUMN "mother_name" SET NOT NULL,
ALTER COLUMN "grandfather_name" SET NOT NULL,
ALTER COLUMN "permanent_province" SET NOT NULL,
ALTER COLUMN "permanent_district" SET NOT NULL,
ALTER COLUMN "permanent_municipality" SET NOT NULL,
ALTER COLUMN "permanent_ward" SET NOT NULL,
ALTER COLUMN "permanent_tole" SET NOT NULL,
ALTER COLUMN "occupation" SET NOT NULL,
ALTER COLUMN "monthly_income" SET NOT NULL,
ALTER COLUMN "bank_name" SET NOT NULL,
ALTER COLUMN "bank_account_number" SET NOT NULL,
ALTER COLUMN "bank_branch" SET NOT NULL,
ALTER COLUMN "loan_amount" SET NOT NULL,
ALTER COLUMN "loan_purpose" SET NOT NULL,
ALTER COLUMN "loan_duration" SET NOT NULL,
ALTER COLUMN "collateral_type" SET NOT NULL,
ALTER COLUMN "collateral_description" SET NOT NULL,
ALTER COLUMN "collateral_value" SET NOT NULL;

-- Remove the default constraint after data has been migrated
ALTER TABLE "borrower"."kycs" ALTER COLUMN "passport_size_photo_url" DROP DEFAULT;
