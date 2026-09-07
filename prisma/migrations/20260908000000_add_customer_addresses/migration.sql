CREATE TABLE "CustomerAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Home',
  "recipientName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerAddress_userId_isDefault_idx" ON "CustomerAddress"("userId", "isDefault");
CREATE INDEX "CustomerAddress_userId_updatedAt_idx" ON "CustomerAddress"("userId", "updatedAt");

ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
