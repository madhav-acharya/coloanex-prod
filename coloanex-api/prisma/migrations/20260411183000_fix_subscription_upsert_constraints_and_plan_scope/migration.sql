ALTER TABLE "core"."subscription_plans"
ADD COLUMN IF NOT EXISTS "scope" "core"."SubscriptionScope" NOT NULL DEFAULT 'USER';

DROP INDEX IF EXISTS "core"."subscriptions_scope_user_id_key";
DROP INDEX IF EXISTS "core"."subscriptions_scope_tenant_id_key";

CREATE UNIQUE INDEX "subscriptions_scope_user_id_key"
ON "core"."subscriptions"("scope", "user_id");

CREATE UNIQUE INDEX "subscriptions_scope_tenant_id_key"
ON "core"."subscriptions"("scope", "tenant_id");
