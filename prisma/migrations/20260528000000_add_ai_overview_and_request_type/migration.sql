-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('ADD_PERSON', 'AI_OVERVIEW');

-- AlterTable: add aiOverview to Person
ALTER TABLE "Person" ADD COLUMN "aiOverview" TEXT;

-- AlterTable: add type and personId to Request
ALTER TABLE "Request" ADD COLUMN "type" "RequestType" NOT NULL DEFAULT 'ADD_PERSON';
ALTER TABLE "Request" ADD COLUMN "personId" TEXT;

-- CreateIndex
CREATE INDEX "Request_type_idx" ON "Request"("type");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
