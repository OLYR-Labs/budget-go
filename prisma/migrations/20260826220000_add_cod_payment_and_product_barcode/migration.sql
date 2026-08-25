ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);

ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;

CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");
