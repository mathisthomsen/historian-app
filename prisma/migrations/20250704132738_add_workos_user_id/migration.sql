/*
  Warnings:

  - A unique constraint covering the columns `[workosUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "workosUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_workosUserId_key" ON "users"("workosUserId");
