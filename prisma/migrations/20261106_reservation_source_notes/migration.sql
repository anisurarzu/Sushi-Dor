-- AlterEnum
CREATE TYPE "ReservationSource" AS ENUM ('ONLINE', 'PHONE', 'WALK_IN', 'OTHER');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "source" "ReservationSource" NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
