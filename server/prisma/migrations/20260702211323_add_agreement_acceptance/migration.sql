-- CreateEnum
CREATE TYPE "AgreementType" AS ENUM ('ACCOUNT_CREATION_SENDER', 'ACCOUNT_CREATION_TRAVELER', 'DELIVER_PACKAGE', 'ACCEPT_DELIVERY');

-- CreateTable
CREATE TABLE "agreement_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AgreementType" NOT NULL,
    "deliveryId" TEXT,
    "version" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_acceptances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
