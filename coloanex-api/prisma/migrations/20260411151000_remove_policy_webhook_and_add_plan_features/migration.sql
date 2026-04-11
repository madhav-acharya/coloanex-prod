ALTER TABLE "core"."subscriptions"
DROP COLUMN IF EXISTS "auto_renew";

ALTER TABLE "core"."subscription_plans"
ADD COLUMN IF NOT EXISTS "features" JSONB;

DROP TABLE IF EXISTS "finance"."transaction_policy_evaluations";
DROP TABLE IF EXISTS "finance"."payment_webhook_events";
