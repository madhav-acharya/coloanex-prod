CREATE TYPE "core"."WalletPurpose" AS ENUM ('PRIMARY', 'GAS', 'RECEIVE_ESEWA', 'RECEIVE_KHALTI', 'GENERAL');

ALTER TABLE "core"."wallets"
ADD COLUMN "purpose" "core"."WalletPurpose" NOT NULL DEFAULT 'PRIMARY';

UPDATE "core"."wallets"
SET "purpose" = CASE
  WHEN "is_primary" = true THEN 'PRIMARY'::"core"."WalletPurpose"
  ELSE 'GENERAL'::"core"."WalletPurpose"
END;

DELETE FROM "core"."wallets" w
USING "core"."wallets" w2
WHERE w."user_id" = w2."user_id"
  AND w."purpose" = w2."purpose"
  AND (
    w."updated_at" < w2."updated_at"
    OR (w."updated_at" = w2."updated_at" AND w."id" < w2."id")
  );

CREATE UNIQUE INDEX "wallets_user_id_purpose_key"
ON "core"."wallets"("user_id", "purpose");

DELETE FROM "core"."subscriptions" s
USING "core"."subscriptions" s2
WHERE s."scope" = 'USER'::"core"."SubscriptionScope"
  AND s2."scope" = 'USER'::"core"."SubscriptionScope"
  AND s."user_id" IS NOT NULL
  AND s."user_id" = s2."user_id"
  AND (
    s."updated_at" < s2."updated_at"
    OR (s."updated_at" = s2."updated_at" AND s."id" < s2."id")
  );

DELETE FROM "core"."subscriptions" s
USING "core"."subscriptions" s2
WHERE s."scope" = 'TENANT'::"core"."SubscriptionScope"
  AND s2."scope" = 'TENANT'::"core"."SubscriptionScope"
  AND s."tenant_id" IS NOT NULL
  AND s."tenant_id" = s2."tenant_id"
  AND (
    s."updated_at" < s2."updated_at"
    OR (s."updated_at" = s2."updated_at" AND s."id" < s2."id")
  );

CREATE UNIQUE INDEX "subscriptions_scope_user_id_key"
ON "core"."subscriptions"("scope", "user_id")
WHERE "user_id" IS NOT NULL;

CREATE UNIQUE INDEX "subscriptions_scope_tenant_id_key"
ON "core"."subscriptions"("scope", "tenant_id")
WHERE "tenant_id" IS NOT NULL;
