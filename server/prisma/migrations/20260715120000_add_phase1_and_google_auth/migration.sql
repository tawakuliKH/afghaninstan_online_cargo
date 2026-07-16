-- AlterTable: relax existing required KYC/personal fields to optional (Phase 1 accounts
-- don't collect these until Phase 2 profile completion), add new Phase1/Google-auth columns.
-- documentNumber's existing unique index is left untouched — a unique index in Postgres
-- already allows multiple NULLs regardless of the column's NOT NULL status.
ALTER TABLE "users"
  ALTER COLUMN "dateOfBirth" DROP NOT NULL,
  ALTER COLUMN "whatsappNumber" DROP NOT NULL,
  ALTER COLUMN "documentType" DROP NOT NULL,
  ALTER COLUMN "documentNumber" DROP NOT NULL,
  ALTER COLUMN "permanentCountry" DROP NOT NULL,
  ALTER COLUMN "permanentCity" DROP NOT NULL,
  ALTER COLUMN "currentCountry" DROP NOT NULL,
  ALTER COLUMN "currentCity" DROP NOT NULL,
  ALTER COLUMN "passportPhotoUrl" DROP NOT NULL,
  ALTER COLUMN "facePhotoUrl" DROP NOT NULL,
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "googleId" TEXT,
  ADD COLUMN "googleEmail" TEXT,
  ADD COLUMN "profileCompleted" BOOLEAN NOT NULL DEFAULT false;

-- New unique index for Google account linking
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
