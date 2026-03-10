-- AlterTable
ALTER TABLE "finance"."loans" ADD COLUMN IF NOT EXISTS "blockchain_tx_hash" TEXT;
