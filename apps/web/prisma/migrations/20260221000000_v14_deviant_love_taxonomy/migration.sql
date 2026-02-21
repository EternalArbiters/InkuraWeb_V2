-- v14: Add Deviant Love taxonomy (separate locked tag table)

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deviantLoveConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DeviantLoveTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviantLoveTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkDeviantLove" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkDeviantLove_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserBlockedDeviantLove" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserBlockedDeviantLove_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviantLoveTag_slug_key" ON "DeviantLoveTag"("slug");

-- CreateIndex
CREATE INDEX "DeviantLoveTag_slug_idx" ON "DeviantLoveTag"("slug");

-- CreateIndex
CREATE INDEX "_WorkDeviantLove_B_index" ON "_WorkDeviantLove"("B");

-- CreateIndex
CREATE INDEX "_UserBlockedDeviantLove_B_index" ON "_UserBlockedDeviantLove"("B");

-- AddForeignKey
ALTER TABLE "_WorkDeviantLove" ADD CONSTRAINT "_WorkDeviantLove_A_fkey" FOREIGN KEY ("A") REFERENCES "DeviantLoveTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkDeviantLove" ADD CONSTRAINT "_WorkDeviantLove_B_fkey" FOREIGN KEY ("B") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserBlockedDeviantLove" ADD CONSTRAINT "_UserBlockedDeviantLove_A_fkey" FOREIGN KEY ("A") REFERENCES "DeviantLoveTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserBlockedDeviantLove" ADD CONSTRAINT "_UserBlockedDeviantLove_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
