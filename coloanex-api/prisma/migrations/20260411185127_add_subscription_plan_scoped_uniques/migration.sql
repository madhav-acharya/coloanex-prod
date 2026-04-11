/*
  Warnings:

  - A unique constraint covering the columns `[scope,user_id,plan_code]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scope,tenant_id,plan_code]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "core"."subscriptions_scope_tenant_id_key";

-- DropIndex
DROP INDEX "core"."subscriptions_scope_user_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_scope_user_id_plan_key" ON "core"."subscriptions"("scope", "user_id", "plan_code");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_scope_tenant_id_plan_key" ON "core"."subscriptions"("scope", "tenant_id", "plan_code");
