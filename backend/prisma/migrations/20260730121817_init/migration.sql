/*
  Warnings:

  - A unique constraint covering the columns `[booking_number]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_booking_number_key" ON "Booking"("booking_number");
