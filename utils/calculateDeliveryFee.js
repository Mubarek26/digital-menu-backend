const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const roundToTwo = (value) => Math.round(value * 100) / 100;
const isCoordinatePair = (coords) =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  coords.every((coord) => Number.isFinite(coord));
const parseNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

module.exports = function calculateDeliveryFee({
  restaurantCoords,
  customerCoords,
  baseFee = 0,
  perKmRate = 0,
  maxDistanceKm,
  settings,
} = {}) {
  if (!isCoordinatePair(restaurantCoords) || !isCoordinatePair(customerCoords)) {
    return {
      fee: roundToTwo(Math.max(0, baseFee)),
      distanceKm: null,
      exceededDistance: false,
    };
  }

  let effectiveMaxDistanceKm = parseNumeric(maxDistanceKm);
  if (effectiveMaxDistanceKm === null && settings) {
    effectiveMaxDistanceKm = parseNumeric(settings.max_delivery_distance_km);
  }

  const [restaurantLng, restaurantLat] = restaurantCoords;
  const [customerLng, customerLat] = customerCoords;

  const dLat = toRadians(customerLat - restaurantLat);
  const dLng = toRadians(customerLng - restaurantLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(restaurantLat)) *
      Math.cos(toRadians(customerLat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  if (
    typeof effectiveMaxDistanceKm === "number" &&
    effectiveMaxDistanceKm >= 0 &&
    distanceKm > effectiveMaxDistanceKm
  ) {
    return {
      fee: null,
      distanceKm: roundToTwo(distanceKm),
      exceededDistance: true,
    };
  }

  const fee = Math.max(0, baseFee + distanceKm * perKmRate);

  return {
    fee: roundToTwo(fee),
    distanceKm: roundToTwo(distanceKm),
    exceededDistance: false,
  };
};
