/*
  Warnings:

  - You are about to drop the `ConnectionTest` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'TAZKIRA');

-- DropTable
DROP TABLE "ConnectionTest";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "legalFullName" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentIssuingCountry" TEXT,
    "permanentCountry" TEXT NOT NULL,
    "permanentCity" TEXT NOT NULL,
    "currentCountry" TEXT NOT NULL,
    "currentCity" TEXT NOT NULL,
    "passportPhotoUrl" TEXT NOT NULL,
    "facePhotoUrl" TEXT NOT NULL,
    "visaResidencyDocUrl" TEXT,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "packagesDeliveredCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_documentNumber_key" ON "users"("documentNumber");
