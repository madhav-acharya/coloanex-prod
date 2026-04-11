ALTER TABLE "core"."subscription_plans"
ADD COLUMN "max_transactions" INTEGER NOT NULL DEFAULT 100;

ALTER TABLE "finance"."transaction_policy_evaluations"
ADD COLUMN "plan_code" TEXT;

UPDATE "finance"."transaction_policy_evaluations" tpe
SET "plan_code" = t."orchestration_data"->>'plan'
FROM "finance"."transactions" t
WHERE tpe."transaction_id" = t."id";

DROP INDEX IF EXISTS "finance"."transaction_policy_evaluations_policy_id_idx";
ALTER TABLE "finance"."transaction_policy_evaluations" DROP COLUMN IF EXISTS "policy_id";

DROP TABLE IF EXISTS "core"."subscription_policies";

CREATE INDEX "transaction_policy_evaluations_plan_code_idx"
ON "finance"."transaction_policy_evaluations"("plan_code");
