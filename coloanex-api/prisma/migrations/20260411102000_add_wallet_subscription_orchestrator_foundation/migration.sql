-- CreateEnum
CREATE TYPE "core"."GasPaymentMode" AS ENUM ('USER_WALLET', 'PLATFORM_WALLET', 'AUTO');

-- CreateEnum
CREATE TYPE "core"."WalletProvider" AS ENUM ('METAMASK', 'EXPO_SECURE');

-- CreateEnum
CREATE TYPE "core"."PlatformType" AS ENUM ('WEB', 'APP');

-- CreateEnum
CREATE TYPE "core"."SubscriptionScope" AS ENUM ('USER', 'TENANT');

-- CreateEnum
CREATE TYPE "core"."SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "auth"."users"
ADD COLUMN "gas_payment_mode" "core"."GasPaymentMode" NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "finance"."transactions"
ADD COLUMN "gas_paid_by" TEXT,
ADD COLUMN "gas_payment_mode" "core"."GasPaymentMode",
ADD COLUMN "orchestration_data" JSONB,
ADD COLUMN "platform" "core"."PlatformType",
ADD COLUMN "wallet_id" TEXT,
ADD COLUMN "wallet_provider" "core"."WalletProvider";

-- CreateTable
CREATE TABLE "core"."wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "core"."WalletProvider" NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "platform" "core"."PlatformType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."subscriptions" (
    "id" TEXT NOT NULL,
    "scope" "core"."SubscriptionScope" NOT NULL,
    "plan_code" TEXT NOT NULL,
    "status" "core"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "user_id" TEXT,
    "tenant_id" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "usage_window_start" TIMESTAMP(3),
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."subscription_policies" (
    "id" TEXT NOT NULL,
    "scope" "core"."SubscriptionScope" NOT NULL,
    "plan_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB NOT NULL,
    "feature_flags" JSONB NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."subscription_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."transaction_policy_evaluations" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "policy_id" TEXT,
    "eligible" BOOLEAN NOT NULL,
    "denial_reason" TEXT,
    "gas_payer" TEXT NOT NULL,
    "resolved_wallet_id" TEXT,
    "resolved_wallet_source" "core"."WalletProvider",
    "evaluation_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_policy_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."tenant_payment_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "gateway" "finance"."PaymentGateway" NOT NULL,
    "environment" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "public_key" TEXT,
    "secret_key" TEXT,
    "merchant_id" TEXT,
    "webhook_url" TEXT,
    "payout_config" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."payment_webhook_events" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "transaction_id" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_provider_address_key" ON "core"."wallets"("provider", "address");

-- CreateIndex
CREATE INDEX "wallets_user_id_idx" ON "core"."wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_user_id_is_primary_idx" ON "core"."wallets"("user_id", "is_primary");

-- CreateIndex
CREATE INDEX "wallets_platform_idx" ON "core"."wallets"("platform");

-- CreateIndex
CREATE INDEX "subscriptions_scope_status_idx" ON "core"."subscriptions"("scope", "status");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_idx" ON "core"."subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_status_idx" ON "core"."subscriptions"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_policies_scope_plan_code_key" ON "core"."subscription_policies"("scope", "plan_code");

-- CreateIndex
CREATE INDEX "subscription_policies_is_active_idx" ON "core"."subscription_policies"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "core"."subscription_plans"("code");

-- CreateIndex
CREATE INDEX "subscription_plans_is_active_idx" ON "core"."subscription_plans"("is_active");

-- CreateIndex
CREATE INDEX "transaction_policy_evaluations_transaction_id_idx" ON "finance"."transaction_policy_evaluations"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_policy_evaluations_policy_id_idx" ON "finance"."transaction_policy_evaluations"("policy_id");

-- CreateIndex
CREATE INDEX "transaction_policy_evaluations_eligible_idx" ON "finance"."transaction_policy_evaluations"("eligible");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payment_configs_tenant_id_gateway_environment_key" ON "core"."tenant_payment_configs"("tenant_id", "gateway", "environment");

-- CreateIndex
CREATE INDEX "tenant_payment_configs_tenant_id_is_active_idx" ON "core"."tenant_payment_configs"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_gateway_event_id_key" ON "finance"."payment_webhook_events"("gateway", "event_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_tenant_id_idx" ON "finance"."payment_webhook_events"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_transaction_id_idx" ON "finance"."payment_webhook_events"("transaction_id");

-- CreateIndex
CREATE INDEX "transactions_wallet_id_idx" ON "finance"."transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "transactions_platform_idx" ON "finance"."transactions"("platform");

-- CreateIndex
CREATE INDEX "transactions_gas_payment_mode_idx" ON "finance"."transactions"("gas_payment_mode");

-- AddForeignKey
ALTER TABLE "core"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."subscriptions" ADD CONSTRAINT "subscriptions_plan_code_fkey" FOREIGN KEY ("plan_code") REFERENCES "core"."subscription_plans"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "core"."wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transaction_policy_evaluations" ADD CONSTRAINT "transaction_policy_evaluations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "finance"."transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transaction_policy_evaluations" ADD CONSTRAINT "transaction_policy_evaluations_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "core"."subscription_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."subscription_policies" ADD CONSTRAINT "subscription_policies_plan_code_fkey" FOREIGN KEY ("plan_code") REFERENCES "core"."subscription_plans"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tenant_payment_configs" ADD CONSTRAINT "tenant_payment_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
