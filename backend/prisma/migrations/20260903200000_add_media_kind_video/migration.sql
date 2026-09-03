-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "media_kind_createdAt_idx" ON "media"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "tours_status_destinationId_priceFrom_idx" ON "tours"("status", "destinationId", "priceFrom");

