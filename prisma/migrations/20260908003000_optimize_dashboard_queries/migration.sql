-- Indexes used by dashboard branch-scoped inventory and order queries.
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "BranchInventory_branchId_isActive_stock_updatedAt_idx" ON "BranchInventory"("branchId", "isActive", "stock", "updatedAt");
CREATE INDEX "Order_branchId_createdAt_idx" ON "Order"("branchId", "createdAt");
CREATE INDEX "Order_branchId_status_idx" ON "Order"("branchId", "status");
CREATE INDEX "Order_branchId_paymentStatus_idx" ON "Order"("branchId", "paymentStatus");
