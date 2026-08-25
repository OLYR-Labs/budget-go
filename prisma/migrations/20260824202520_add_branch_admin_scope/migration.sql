/*
  Warnings:

  - A unique constraint covering the columns `[branchId,userId]` on the table `BranchStaff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchId,userId]` on the table `DeliveryStaff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `BranchStaff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DeliveryStaff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'BRANCH_ADMIN';

-- AlterTable
ALTER TABLE "BranchStaff" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "DeliveryStaff" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "BranchAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchAdmin_userId_key" ON "BranchAdmin"("userId");

-- CreateIndex
CREATE INDEX "BranchAdmin_branchId_idx" ON "BranchAdmin"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchAdmin_branchId_userId_key" ON "BranchAdmin"("branchId", "userId");

-- CreateIndex
CREATE INDEX "Branch_isActive_idx" ON "Branch"("isActive");

-- CreateIndex
CREATE INDEX "BranchInventory_isActive_idx" ON "BranchInventory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BranchStaff_branchId_userId_key" ON "BranchStaff"("branchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryStaff_branchId_userId_key" ON "DeliveryStaff"("branchId", "userId");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- AddForeignKey
ALTER TABLE "BranchAdmin" ADD CONSTRAINT "BranchAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchAdmin" ADD CONSTRAINT "BranchAdmin_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
