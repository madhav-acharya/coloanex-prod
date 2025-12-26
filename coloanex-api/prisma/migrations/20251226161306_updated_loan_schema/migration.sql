/*
  Warnings:

  - Added the required column `tenant_id` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "finance"."loans" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "loans_tenant_id_idx" ON "finance"."loans"("tenant_id");

-- AddForeignKey
ALTER TABLE "finance"."loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
