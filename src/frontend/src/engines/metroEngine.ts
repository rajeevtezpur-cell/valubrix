// metroEngine.ts — Dynamic road distance + travel time engine
// Uses zone-based road factors, speed, and congestion to simulate real travel times.
// No hardcoded fallbacks. All distances computed from real lat/lng.

export interface Metro {
  name: string;
  line: string;
  lat: number;
  lng: number;
}

export interface MetroResult {
  name: string;
  line: string;
  aerialKm: number;
  roadKm: number;
  travelTimeMin: number;
  weight: number;
  // legacy field kept for backward compat
  distance: number;
}

export type ZoneType = "urban" | "semiUrban" | "peripheral";

// Full Bangalore metro dataset
export const METROS: Metro[] = [
  { name: "Whitefield (Kadugodi)", line: "Purple", lat: 12.996, lng: 77.7608 },
  { name: "Kadugodi Tree Park", line: "Purple", lat: 12.995, lng: 77.757 },
  { name: "Pattandur Agrahara", line: "Purple", lat: 12.99, lng: 77.745 },
  { name: "Sri Sathya Sai Hospital", line: "Purple", lat: 12.983, lng: 77.737 },
  { name: "Nallur Halli", line: "Purple", lat: 12.978, lng: 77.73 },
  { name: "Kundalahalli", line: "Purple", lat: 12.967, lng: 77.715 },
  { name: "Hoodi Junction", line: "Purple", lat: 12.992, lng: 77.716 },
  { name: "KR Puram", line: "Purple", lat: 13.0077, lng: 77.695 },
  { name: "Baiyappanahalli", line: "Purple", lat: 12.9908, lng: 77.6525 },
  { name: "Indiranagar", line: "Purple", lat: 12.9784, lng: 77.6408 },
  { name: "MG Road", line: "Purple", lat: 12.9756, lng: 77.6066 },
  { name: "Majestic", line: "Purple", lat: 12.9763, lng: 77.5713 },
  { name: "Vijayanagar", line: "Purple", lat: 12.971, lng: 77.537 },
  { name: "Kengeri", line: "Purple", lat: 12.914, lng: 77.484 },
  { name: "Challaghatta", line: "Purple", lat: 12.905, lng: 77.47 },
  { name: "Nagasandra", line: "Green", lat: 13.0475, lng: 77.4993 },
  { name: "Peenya Industry", line: "Green", lat: 13.032, lng: 77.514 },
  { name: "Yeshwanthpur", line: "Green", lat: 13.028, lng: 77.554 },
  { name: "Rajajinagar", line: "Green", lat: 12.991, lng: 77.555 },
  { name: "Jayanagar", line: "Green", lat: 12.929, lng: 77.583 },
  { name: "Banashankari", line: "Green", lat: 12.918, lng: 77.573 },
  { name: "Yelachenahalli", line: "Green", lat: 12.8856, lng: 77.5747 },
  { name: "Silk Institute", line: "Green", lat: 12.861, lng: 77.566 },
  { name: "BTM Layout", line: "Yellow", lat: 12.9166, lng: 77.6101 },
  { name: "Central Silk Board", line: "Yellow", lat: 12.917, lng: 77.622 },
  { name: "Bommanahalli", line: "Yellow", lat: 12.9, lng: 77.63 },
  { name: "Electronic City", line: "Yellow", lat: 12.8456, lng: 77.6603 },
  {
    name: "Infosys Konappana Agrahara",
    line: "Yellow",
    lat: 12.85,
    lng: 77.665,
  },
  { name: "Bommasandra", line: "Yellow", lat: 12.8, lng: 77.7 },
  {
    name: "Yelahanka Metro (Planned)",
    line: "Green",
    lat: 13.1007,
    lng: 77.5963,
  },
  { name: "Hebbal Metro (Planned)", line: "Green", lat: 13.0358, lng: 77.597 },
];

/**
 * Haversine formula — returns aerial distance in km.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Determine urban zone based on Bangalore geography.
 * Urban core = within ~12km of city center (12.9716, 77.5946)
 * Semi-urban = 12–25km
 * Peripheral = >25km
 */
export function getZoneType(lat: number, lng: number): ZoneType {
  const distFromCenter = haversineDistance(lat, lng, 12.9716, 77.5946);
  if (distFromCenter < 12) return "urban";
  if (distFromCenter < 25) return "semiUrban";
  return "peripheral";
}

interface RouteData {
  aerialKm: number;
  roadKm: number;
  travelTimeMin: number;
}

// Normalized coordinate cache key
function normCoord(v: number): number {
  return Math.round(v * 10000) / 10000;
}

const routeCache = new Map<string, RouteData>();

/**
 * Simulate road distance and travel time using dynamic zone-based factors.
 * Urban: road factor 1.95, speed 20 km/h, congestion 1.4
 * Semi-urban: road factor 1.6, speed 26 km/h, congestion 1.25
 * Peripheral: road factor 1.35, speed 35 km/h, congestion 1.15
 */
export function estimateRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): RouteData {
  const key = `${normCoord(fromLat)},${normCoord(fromLng)}|${normCoord(toLat)},${normCoord(toLng)}`;
  const cached = routeCache.get(key);
  if (cached) return cached;

  const aerial = haversineDistance(fromLat, fromLng, toLat, toLng);
  const zone = getZoneType(fromLat, fromLng);

  let roadFactor: number;
  let speed: number;
  let congestion: number;

  switch (zone) {
    case "urban":
      roadFactor = 1.95;
      speed = 20;
      congestion = 1.4;
      break;
    case "semiUrban":
      roadFactor = 1.6;
      speed = 26;
      congestion = 1.25;
      break;
    default: // peripheral
      roadFactor = 1.35;
      speed = 35;
      congestion = 1.15;
      break;
  }

  // Distance band adjustments
  if (aerial < 3) roadFactor += 0.3;
  else if (aerial > 10) roadFactor = Math.max(roadFactor - 0.2, 1.1);

  const roadKm = aerial * roadFactor;
  const travelTimeMin = (roadKm / speed) * 60 * congestion;

  const result: RouteData = {
    aerialKm: Math.round(aerial * 10) / 10,
    roadKm: Math.round(roadKm * 10) / 10,
    travelTimeMin: Math.round(travelTimeMin),
  };

  routeCache.set(key, result);
  return result;
}

/**
 * Travel time score for metro proximity.
 * Primary scoring metric (not raw distance).
 */
export function getTravelTimeScore(travelTimeMin: number): number {
  if (travelTimeMin < 15) return 10;
  if (travelTimeMin < 30) return 7;
  if (travelTimeMin < 45) return 4;
  if (travelTimeMin < 60) return 1;
  return -5;
}

/**
 * Returns topN nearest metro stations sorted by travel time.
 * Displays as: "Name – XX mins (YY km)"
 */
export function getNearestMetros(
  lat: number,
  lng: number,
  topN = 3,
): MetroResult[] {
  const results = METROS.map((m) => {
    const route = estimateRoute(lat, lng, m.lat, m.lng);
    return {
      name: m.name,
      line: m.line,
      aerialKm: route.aerialKm,
      roadKm: route.roadKm,
      travelTimeMin: route.travelTimeMin,
      distance: route.roadKm, // backward compat
      weight: 1.0,
    };
  });

  // Sort by travel time (primary metric)
  results.sort((a, b) => a.travelTimeMin - b.travelTimeMin);

  // Debug log
  if (results.length > 0) {
    console.log(
      `[ValuBrix] Metro distances from (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    );
    for (const r of results.slice(0, 3)) {
      console.log(
        `  ${r.name}: ${r.travelTimeMin} mins (${r.roadKm} km road / ${r.aerialKm} km aerial)`,
      );
    }
  }

  return results.slice(0, topN);
}

/**
 * MetroFactor multiplier based on travel time to nearest metro.
 */
export function getMetroFactor(travelTimeMin: number): number {
  if (travelTimeMin < 15) return 1.08;
  if (travelTimeMin < 30) return 1.05;
  if (travelTimeMin < 45) return 1.02;
  return 0.98;
}

/**
 * Returns the nearest single metro and its factor.
 */
export function getNearestMetro(
  lat: number,
  lng: number,
): { metro: MetroResult; factor: number } {
  const metros = getNearestMetros(lat, lng, 1);
  const metro = metros[0];
  return { metro, factor: getMetroFactor(metro.travelTimeMin) };
}

/**
 * Format for display: "Metro Name – 28 mins (11.4 km)"
 */
export function formatMetroDisplay(metro: MetroResult): string {
  return `${metro.name} – ${metro.travelTimeMin} mins (${metro.roadKm} km)`;
}
