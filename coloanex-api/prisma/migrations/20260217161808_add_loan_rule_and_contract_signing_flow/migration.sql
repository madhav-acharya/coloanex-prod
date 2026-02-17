-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "finance"."ContractStatus" ADD VALUE 'GENERATED';
ALTER TYPE "finance"."ContractStatus" ADD VALUE 'SIGNED';
ALTER TYPE "finance"."ContractStatus" ADD VALUE 'REPORTED';

-- AlterEnum
ALTER TYPE "finance"."LoanStatus" ADD VALUE 'LOAN_PROVIDED';

-- AlterTable
ALTER TABLE "finance"."contracts" ADD COLUMN     "report_reason" TEXT,
ADD COLUMN     "signed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "finance"."loans" ADD COLUMN     "approved_term_months" INTEGER,
ADD COLUMN     "rule_id" TEXT;

-- CreateIndex
CREATE INDEX "loans_rule_id_idx" ON "finance"."loans"("rule_id");

-- AddForeignKey
ALTER TABLE "finance"."loans" ADD CONSTRAINT "loans_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "finance"."rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
