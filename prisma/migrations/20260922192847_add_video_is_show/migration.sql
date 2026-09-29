-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "isShow" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Video_isShow_displayOrder_idx" ON "Video"("isShow", "displayOrder");
