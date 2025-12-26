-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finance";

-- CreateEnum
CREATE TYPE "finance"."LoanStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "finance"."RepaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "finance"."TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'INVESTMENT', 'DISBURSEMENT', 'REPAYMENT', 'FEE');

-- CreateTable
CREATE TABLE "core"."notification_reads" (
    "id" TEXT NOT NULL,
    "activity_log_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."wallets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."loans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "status" "finance"."LoanStatus" NOT NULL DEFAULT 'DRAFT',
    "disbursed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."investments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."repayments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount_due" DECIMAL(20,2) NOT NULL,
    "amount_paid" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "status" "finance"."RepaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "loan_id" TEXT,
    "repayment_id" TEXT,
    "type" "finance"."TransactionType" NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_reads_user_id_idx" ON "core"."notification_reads"("user_id");

-- CreateIndex
CREATE INDEX "notification_reads_activity_log_id_idx" ON "core"."notification_reads"("activity_log_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_activity_log_id_user_id_key" ON "core"."notification_reads"("activity_log_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "finance"."wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_tenant_id_idx" ON "finance"."wallets"("tenant_id");

-- CreateIndex
CREATE INDEX "wallets_user_id_idx" ON "finance"."wallets"("user_id");

-- CreateIndex
CREATE INDEX "loans_tenant_id_idx" ON "finance"."loans"("tenant_id");

-- CreateIndex
CREATE INDEX "loans_borrower_id_idx" ON "finance"."loans"("borrower_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "finance"."loans"("status");

-- CreateIndex
CREATE INDEX "investments_loan_id_idx" ON "finance"."investments"("loan_id");

-- CreateIndex
CREATE INDEX "investments_user_id_idx" ON "finance"."investments"("user_id");

-- CreateIndex
CREATE INDEX "repayments_loan_id_idx" ON "finance"."repayments"("loan_id");

-- CreateIndex
CREATE INDEX "repayments_user_id_idx" ON "finance"."repayments"("user_id");

-- CreateIndex
CREATE INDEX "repayments_status_idx" ON "finance"."repayments"("status");

-- CreateIndex
CREATE INDEX "transactions_wallet_id_idx" ON "finance"."transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "transactions_loan_id_idx" ON "finance"."transactions"("loan_id");

-- CreateIndex
CREATE INDEX "transactions_repayment_id_idx" ON "finance"."transactions"("repayment_id");

-- AddForeignKey
ALTER TABLE "core"."notification_reads" ADD CONSTRAINT "notification_reads_activity_log_id_fkey" FOREIGN KEY ("activity_log_id") REFERENCES "core"."activity_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."wallets" ADD CONSTRAINT "wallets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "borrower"."borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."investments" ADD CONSTRAINT "investments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "finance"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."investments" ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."repayments" ADD CONSTRAINT "repayments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "finance"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."repayments" ADD CONSTRAINT "repayments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transactions" ADD CONSTRAINT "transactions_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "finance"."loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transactions" ADD CONSTRAINT "transactions_repayment_id_fkey" FOREIGN KEY ("repayment_id") REFERENCES "finance"."repayments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
