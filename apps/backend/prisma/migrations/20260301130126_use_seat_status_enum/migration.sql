/*
  Warnings:

  - The `status` column on the `Seat` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'HELD', 'RESERVED');

-- AlterTable
ALTER TABLE "Seat" DROP COLUMN "status",
ADD COLUMN     "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE';
