-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_publicId_key" ON "Video"("publicId");

-- CreateIndex
CREATE INDEX "Video_isActive_displayOrder_idx" ON "Video"("isActive", "displayOrder");
