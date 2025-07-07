-- AlterTable
ALTER TABLE "events" ADD COLUMN     "parentId" INTEGER;

-- CreateIndex
CREATE INDEX "events_parentId_idx" ON "events"("parentId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
