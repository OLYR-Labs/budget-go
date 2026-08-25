export const DEFAULT_DELIVERY_BASE_FEE_LKR = 100;
export const DEFAULT_DELIVERY_PER_KM_FEE_LKR = 30;

export function haversineDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLatitude = toRadians(latitude2 - latitude1);
  const dLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(dLongitude / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function calculateDeliveryFee(distanceKm: number) {
  const baseFee = numberFromEnv(
    "DELIVERY_BASE_FEE_LKR",
    DEFAULT_DELIVERY_BASE_FEE_LKR,
  );
  const perKmFee = numberFromEnv(
    "DELIVERY_PER_KM_FEE_LKR",
    DEFAULT_DELIVERY_PER_KM_FEE_LKR,
  );

  const rawFee = baseFee + distanceKm * perKmFee;
  const deliveryFee = Math.ceil(rawFee / 10) * 10;

  return { baseFee, perKmFee, deliveryFee };
}
