/*
  Warnings:

  - You are about to drop the column `wallet_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `wallets` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `received_by` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sent_by` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "finance"."transactions" DROP CONSTRAINT "transactions_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."wallets" DROP CONSTRAINT "wallets_user_id_fkey";

-- DropIndex
DROP INDEX "finance"."transactions_wallet_id_idx";

-- AlterTable
ALTER TABLE "finance"."transactions" DROP COLUMN "wallet_id",
ADD COLUMN     "received_by" TEXT NOT NULL,
ADD COLUMN     "sent_by" TEXT NOT NULL;

-- DropTable
DROP TABLE "finance"."wallets";

-- CreateIndex
CREATE INDEX "transactions_sent_by_idx" ON "finance"."transactions"("sent_by");

-- CreateIndex
CREATE INDEX "transactions_received_by_idx" ON "finance"."transactions"("received_by");
