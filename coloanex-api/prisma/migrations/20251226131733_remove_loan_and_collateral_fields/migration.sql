/*
  Warnings:

  - The values [COLLATERAL_PHOTO] on the enum `KycFileType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `collateral_description` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `collateral_type` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `collateral_value` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `loan_amount` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `loan_duration` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `loan_purpose` on the `kycs` table. All the data in the column will be lost.
  - Made the column `document_type` on table `kyc_files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `document_number` on table `kyc_files` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "borrower"."KycFileType_new" AS ENUM ('CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'PASSPORT', 'PAN', 'LICENSE_FRONT', 'LICENSE_BACK', 'SELFIE', 'SUPPORTING_DOCUMENT', 'OTHER');
ALTER TABLE "borrower"."kyc_files" ALTER COLUMN "file_type" TYPE "borrower"."KycFileType_new" USING ("file_type"::text::"borrower"."KycFileType_new");
ALTER TYPE "borrower"."KycFileType" RENAME TO "KycFileType_old";
ALTER TYPE "borrower"."KycFileType_new" RENAME TO "KycFileType";
DROP TYPE "borrower"."KycFileType_old";
COMMIT;

-- AlterTable
ALTER TABLE "borrower"."kyc_files" ALTER COLUMN "document_type" SET NOT NULL,
ALTER COLUMN "document_number" SET NOT NULL;

-- AlterTable
ALTER TABLE "borrower"."kycs" DROP COLUMN "collateral_description",
DROP COLUMN "collateral_type",
DROP COLUMN "collateral_value",
DROP COLUMN "loan_amount",
DROP COLUMN "loan_duration",
DROP COLUMN "loan_purpose";
