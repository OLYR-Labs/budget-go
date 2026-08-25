-- Ensure all seven storefront branches exist and have demo delivery coordinates.
INSERT INTO "Branch" ("id", "name", "code", "latitude", "longitude", "deliveryRadius", "isActive", "createdAt", "updatedAt")
VALUES
  (md5('branch-HOR'), 'Horana', 'HOR', 6.7156, 80.0626, 20, true, NOW(), NOW()),
  (md5('branch-ING'), 'Ingiriya', 'ING', 6.7428, 80.1770, 20, true, NOW(), NOW()),
  (md5('branch-BAN'), 'Bandaragama', 'BAN', 6.7151, 80.9850, 20, true, NOW(), NOW()),
  (md5('branch-KES'), 'Kesbewa', 'KES', 6.7953, 79.9383, 20, true, NOW(), NOW()),
  (md5('branch-PIL'), 'Piliyandala', 'PIL', 6.8015, 79.9227, 20, true, NOW(), NOW()),
  (md5('branch-PAN'), 'Panadura', 'PAN', 6.7132, 79.9042, 20, true, NOW(), NOW()),
  (md5('branch-KAL'), 'Kalutara', 'KAL', 6.5854, 79.9607, 20, true, NOW(), NOW())
ON CONFLICT ("code") DO UPDATE SET
  "latitude" = EXCLUDED."latitude",
  "longitude" = EXCLUDED."longitude",
  "deliveryRadius" = EXCLUDED."deliveryRadius",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Give every active branch every seeded product so the storefront can be switched
-- between all seven branches immediately. Existing branch inventory is preserved.
INSERT INTO "BranchInventory" ("id", "branchId", "productId", "price", "stock", "isActive", "updatedAt")
SELECT
  md5('inventory-' || b."code" || '-' || p."sku"),
  b."id",
  p."id",
  CASE p."sku"
    WHEN 'DEMO-COKE-1500' THEN 420
    WHEN 'DEMO-MILK-1000' THEN 520
    WHEN 'DEMO-RICE-5000' THEN 1450
    WHEN 'DEMO-BISC-200' THEN 280
    ELSE 0
  END,
  20,
  true,
  NOW()
FROM "Branch" b
CROSS JOIN "Product" p
WHERE b."isActive" = true
  AND p."isActive" = true
  AND p."sku" IN ('DEMO-COKE-1500', 'DEMO-MILK-1000', 'DEMO-RICE-5000', 'DEMO-BISC-200')
ON CONFLICT ("branchId", "productId") DO NOTHING;
