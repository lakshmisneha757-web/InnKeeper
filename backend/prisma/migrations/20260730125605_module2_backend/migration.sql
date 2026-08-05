/*
  Warnings:

  - Added the required column `difference` to the `PricingHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OccupancyHistory" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PricingHistory" ADD COLUMN     "difference" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "PricingRule" ADD COLUMN     "scope" TEXT;

-- CreateTable
CREATE TABLE "Statistics" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "total_rooms" INTEGER NOT NULL,
    "occupied_rooms" INTEGER NOT NULL,
    "available_rooms" INTEGER NOT NULL,
    "connected_channels" INTEGER NOT NULL,
    "active_bookings" INTEGER NOT NULL,
    "average_occupancy" DOUBLE PRECISION NOT NULL,
    "average_sync_time" DOUBLE PRECISION NOT NULL,
    "pricing_rules_enabled" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id")
);
