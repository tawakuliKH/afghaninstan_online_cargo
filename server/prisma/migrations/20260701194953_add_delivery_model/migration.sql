-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentLocation" AS ENUM ('ORIGIN', 'DESTINATION');

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "tripId" TEXT,
    "senderId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "agreedAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentLocation" "PaymentLocation" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PROPOSED',
    "estimatedDeliveryDate" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "commissionAmount" DOUBLE PRECISION,
    "commissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
