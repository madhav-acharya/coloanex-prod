-- Add scope support to existing tenant payment config table so both users and tenants can configure receiving credentials.
CREATE TYPE "core"."PaymentConfigScope" AS ENUM ('USER', 'TENANT');

ALTER TABLE "core"."tenant_payment_configs"
ADD COLUMN "owner_scope" "core"."PaymentConfigScope" NOT NULL DEFAULT 'TENANT',
ADD COLUMN "owner_user_id" TEXT;

ALTER TABLE "core"."tenant_payment_configs"
ALTER COLUMN "tenant_id" DROP NOT NULL;

CREATE INDEX "tenant_payment_configs_owner_user_id_is_active_idx"
ON "core"."tenant_payment_configs"("owner_user_id", "is_active");

CREATE UNIQUE INDEX "tenant_payment_configs_owner_user_id_gateway_environment_key"
ON "core"."tenant_payment_configs"("owner_user_id", "gateway", "environment");

ALTER TABLE "core"."tenant_payment_configs"
ADD CONSTRAINT "tenant_payment_configs_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
