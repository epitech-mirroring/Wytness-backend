/*
  Warnings:

  - Added the required column `logo` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "logo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Field" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "nullable" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nodeId" INTEGER NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
