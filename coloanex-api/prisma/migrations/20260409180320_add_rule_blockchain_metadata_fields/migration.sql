-- AlterTable
ALTER TABLE "finance"."rules" ADD COLUMN     "blockchain_data" JSONB,
ADD COLUMN     "blockchain_tx_hash" TEXT;
