-- AlterTable
ALTER TABLE "borrower"."kycs" ADD COLUMN     "blockchain_data" JSONB,
ADD COLUMN     "blockchain_tx_hash" TEXT;

-- AlterTable
ALTER TABLE "finance"."contracts" ADD COLUMN     "blockchain_tx_hash" TEXT;

-- AlterTable
ALTER TABLE "finance"."loans" ADD COLUMN     "blockchain_data" JSONB;

-- AlterTable
ALTER TABLE "finance"."transactions" ADD COLUMN     "blockchain_data" JSONB;
