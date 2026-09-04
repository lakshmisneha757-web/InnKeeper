-- AlterTable
ALTER TABLE "Payment"
  ADD COLUMN "razorpayOrderId" TEXT,
  ADD COLUMN "razorpayPaymentId" TEXT,
  ADD COLUMN "razorpaySignature" TEXT,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN "gatewayStatus" TEXT,
  ADD COLUMN "failureCode" TEXT,
  ADD COLUMN "failureMessage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");
