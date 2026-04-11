-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "core"."WalletProvider" ADD VALUE 'ESEWA';
ALTER TYPE "core"."WalletProvider" ADD VALUE 'KHALTI';

-- AlterTable
ALTER TABLE "auth"."users" ALTER COLUMN "gas_payment_mode" SET DEFAULT 'PLATFORM_WALLET';

-- AlterTable
ALTER TABLE "core"."tenant_payment_configs" RENAME CONSTRAINT "tenant_payment_configs_pkey" TO "payment_configs_pkey";

-- RenameForeignKey
ALTER TABLE "core"."tenant_payment_configs" RENAME CONSTRAINT "tenant_payment_configs_tenant_id_fkey" TO "payment_configs_tenant_id_fkey";

-- RenameIndex
ALTER INDEX IF EXISTS "core"."tenant_payment_configs_owner_user_id_gateway_environment_key" RENAME TO "payment_configs_owner_user_id_gateway_environment_key";

-- RenameIndex
ALTER INDEX IF EXISTS "core"."tenant_payment_configs_owner_user_id_is_active_idx" RENAME TO "payment_configs_owner_user_id_is_active_idx";

-- RenameIndex
ALTER INDEX IF EXISTS "core"."tenant_payment_configs_tenant_id_gateway_environment_key" RENAME TO "payment_configs_tenant_id_gateway_environment_key";

-- RenameIndex
ALTER INDEX IF EXISTS "core"."tenant_payment_configs_tenant_id_is_active_idx" RENAME TO "payment_configs_tenant_id_is_active_idx";
