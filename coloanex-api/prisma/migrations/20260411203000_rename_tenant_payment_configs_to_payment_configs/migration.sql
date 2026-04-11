ALTER TABLE "core"."tenant_payment_configs" RENAME TO "payment_configs";

ALTER INDEX IF EXISTS "core"."tenant_payment_configs_tenant_id_gateway_environment_key"
RENAME TO "payment_configs_tenant_id_gateway_environment_key";

ALTER INDEX IF EXISTS "core"."tenant_payment_configs_tenant_id_is_active_idx"
RENAME TO "payment_configs_tenant_id_is_active_idx";

ALTER INDEX IF EXISTS "core"."tenant_payment_configs_owner_user_id_is_active_idx"
RENAME TO "payment_configs_owner_user_id_is_active_idx";

ALTER INDEX IF EXISTS "core"."tenant_payment_configs_owner_user_id_gateway_environment_key"
RENAME TO "payment_configs_owner_user_id_gateway_environment_key";

ALTER TABLE "core"."payment_configs"
RENAME CONSTRAINT "tenant_payment_configs_owner_user_id_fkey"
TO "payment_configs_owner_user_id_fkey";
