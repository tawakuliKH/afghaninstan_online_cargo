-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "destCountry" TEXT NOT NULL,
    "destCity" TEXT NOT NULL,
    "capacityWeight" DOUBLE PRECISION,
    "capacityNote" TEXT,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
