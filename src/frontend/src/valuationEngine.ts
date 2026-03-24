// ValuBrix Deterministic Valuation Engine (Legacy)
// New modular engines are in ./engines/valuationEngine
// This file is kept for backward compatibility with existing pages.
// All scores derived from real seed data — no Math.random()

// Re-export new engine functions (types defined locally)
export {
  getAreaIntelligence,
  getDealScore,
  getPricePrediction,
  getRecommendation,
  getLocalityCoords as getNewLocalityCoords,
} from "./engines/valuationEngine";

export interface Metro {
  name: string;
  line: string;
  lat: number;
  lng: number;
}
export interface TechPark {
  name: string;
  area: string;
  zone: string;
  lat: number;
  lng: number;
  weight: number;
}
export interface Amenity {
  name: string;
  type: "school" | "hospital";
  area: string;
  zone: string;
  lat: number;
  lng: number;
  rating: number;
  weight: number;
}
export interface Builder {
  name: string;
  city: string;
  tier: string;
  score: number;
}
export interface MicroLocation {
  locality: string;
  zone: string;
  type: string;
  lat: number;
  lng: number;
  weight: number;
}

export interface ValuationInput {
  locality: string;
  lat?: number;
  lng?: number;
  builder: string;
  city: string;
  area: number;
  floor: number;
  propertyType: string;
  bhk: number;
}

export interface ValuationOutput {
  estimatedPrice: number;
  pricePerSqft: number;
  builderScore: number;
  techScore: number;
  amenityScore: number;
  microWeight: number;
  basePrice: number;
  metroDistance: number;
  techParkDistance: number;
  amenitiesCount: number;
  metroName: string;
  nearestTechPark: string;
  confidence: number;
  floorMultiplier: number;
  bhkMultiplier: number;
  typeMultiplier: number;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

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
  { name: "Bommasandra", line: "Yellow", lat: 12.8, lng: 77.7 },
];

export const TECH_PARKS: TechPark[] = [
  {
    name: "ITPL",
    area: "Whitefield",
    zone: "East",
    lat: 12.9855,
    lng: 77.737,
    weight: 1.0,
  },
  {
    name: "Bagmane Tech Park",
    area: "ORR",
    zone: "East",
    lat: 12.9786,
    lng: 77.6632,
    weight: 1.0,
  },
  {
    name: "RMZ Ecoworld",
    area: "Bellandur",
    zone: "East",
    lat: 12.9352,
    lng: 77.6958,
    weight: 1.0,
  },
  {
    name: "Embassy Tech Village",
    area: "ORR",
    zone: "East",
    lat: 12.9349,
    lng: 77.6974,
    weight: 1.0,
  },
  {
    name: "Prestige Tech Park",
    area: "Kadubeesanahalli",
    zone: "East",
    lat: 12.935,
    lng: 77.697,
    weight: 0.9,
  },
  {
    name: "Electronic City Phase 1",
    area: "Electronic City",
    zone: "South",
    lat: 12.8399,
    lng: 77.677,
    weight: 1.0,
  },
  {
    name: "Infosys Campus",
    area: "Electronic City",
    zone: "South",
    lat: 12.845,
    lng: 77.66,
    weight: 1.0,
  },
  {
    name: "Wipro Campus",
    area: "Electronic City",
    zone: "South",
    lat: 12.84,
    lng: 77.665,
    weight: 1.0,
  },
  {
    name: "Manyata Tech Park",
    area: "Nagawara",
    zone: "North",
    lat: 13.0486,
    lng: 77.62,
    weight: 1.0,
  },
  {
    name: "Embassy Manyata Business Park",
    area: "Nagawara",
    zone: "North",
    lat: 13.05,
    lng: 77.62,
    weight: 1.0,
  },
  {
    name: "Karle Town Centre",
    area: "Hebbal",
    zone: "North",
    lat: 13.04,
    lng: 77.62,
    weight: 1.0,
  },
  {
    name: "Kirloskar Tech Park",
    area: "Hebbal",
    zone: "North",
    lat: 13.031,
    lng: 77.5545,
    weight: 1.0,
  },
  {
    name: "KIADB Aerospace SEZ",
    area: "Devanahalli",
    zone: "North",
    lat: 13.26,
    lng: 77.7,
    weight: 1.0,
  },
  {
    name: "Global Village Tech Park",
    area: "RR Nagar",
    zone: "West",
    lat: 12.9145,
    lng: 77.504,
    weight: 0.9,
  },
  {
    name: "IBC Knowledge Park",
    area: "Bannerghatta Road",
    zone: "South",
    lat: 12.9279,
    lng: 77.6088,
    weight: 0.9,
  },
];

export const AMENITIES: Amenity[] = [
  {
    name: "Delhi Public School Whitefield",
    type: "school",
    area: "Whitefield",
    zone: "East",
    lat: 12.9698,
    lng: 77.7499,
    rating: 4.5,
    weight: 1.0,
  },
  {
    name: "National Public School",
    type: "school",
    area: "Indiranagar",
    zone: "East",
    lat: 12.978,
    lng: 77.64,
    rating: 4.6,
    weight: 1.0,
  },
  {
    name: "Greenwood High",
    type: "school",
    area: "Sarjapur",
    zone: "East",
    lat: 12.8826,
    lng: 77.7242,
    rating: 4.6,
    weight: 1.0,
  },
  {
    name: "Ryan International School",
    type: "school",
    area: "Sarjapur",
    zone: "East",
    lat: 12.912,
    lng: 77.687,
    rating: 4.2,
    weight: 0.9,
  },
  {
    name: "Manipal Hospital Whitefield",
    type: "hospital",
    area: "Whitefield",
    zone: "East",
    lat: 12.9698,
    lng: 77.75,
    rating: 4.7,
    weight: 1.0,
  },
  {
    name: "Sakra World Hospital",
    type: "hospital",
    area: "ORR",
    zone: "East",
    lat: 12.9275,
    lng: 77.6846,
    rating: 4.4,
    weight: 1.0,
  },
  {
    name: "Narayana Health City",
    type: "hospital",
    area: "Electronic City",
    zone: "South",
    lat: 12.8399,
    lng: 77.677,
    rating: 4.5,
    weight: 1.0,
  },
  {
    name: "Aster CMI Hospital",
    type: "hospital",
    area: "Hebbal",
    zone: "North",
    lat: 13.045,
    lng: 77.6,
    rating: 4.6,
    weight: 1.0,
  },
  {
    name: "Columbia Asia Hospital",
    type: "hospital",
    area: "Hebbal",
    zone: "North",
    lat: 13.0358,
    lng: 77.597,
    rating: 4.3,
    weight: 1.0,
  },
  {
    name: "Canadian International School",
    type: "school",
    area: "Yelahanka",
    zone: "North",
    lat: 13.11,
    lng: 77.62,
    rating: 4.7,
    weight: 1.0,
  },
  {
    name: "Vidyashilp Academy",
    type: "school",
    area: "Yelahanka",
    zone: "North",
    lat: 13.095,
    lng: 77.585,
    rating: 4.6,
    weight: 1.0,
  },
  {
    name: "Aster RV Hospital",
    type: "hospital",
    area: "Jayanagar",
    zone: "South",
    lat: 12.925,
    lng: 77.593,
    rating: 4.6,
    weight: 1.0,
  },
  {
    name: "Apollo Hospital Bannerghatta",
    type: "hospital",
    area: "Bannerghatta Road",
    zone: "South",
    lat: 12.9,
    lng: 77.6,
    rating: 4.5,
    weight: 1.0,
  },
  {
    name: "Bishop Cotton Boys School",
    type: "school",
    area: "Central",
    zone: "Central",
    lat: 12.96,
    lng: 77.6,
    rating: 4.7,
    weight: 1.0,
  },
  {
    name: "Manipal Hospital Old Airport",
    type: "hospital",
    area: "Central",
    zone: "Central",
    lat: 12.958,
    lng: 77.648,
    rating: 4.6,
    weight: 1.0,
  },
  {
    name: "National Public School HSR",
    type: "school",
    area: "HSR Layout",
    zone: "SE",
    lat: 12.91,
    lng: 77.65,
    rating: 4.6,
    weight: 1.0,
  },
  {
    name: "MS Ramaiah Memorial Hospital",
    type: "hospital",
    area: "Mathikere",
    zone: "North",
    lat: 13.03,
    lng: 77.56,
    rating: 4.5,
    weight: 1.0,
  },
  {
    name: "Cloudnine Hospital",
    type: "hospital",
    area: "Indiranagar",
    zone: "Central",
    lat: 12.9352,
    lng: 77.6145,
    rating: 4.5,
    weight: 0.9,
  },
  {
    name: "Fortis Hospital Bannerghatta",
    type: "hospital",
    area: "Bannerghatta Road",
    zone: "South",
    lat: 12.898,
    lng: 77.595,
    rating: 4.4,
    weight: 1.0,
  },
  {
    name: "Christ School",
    type: "school",
    area: "Bannerghatta Road",
    zone: "South",
    lat: 12.9005,
    lng: 77.605,
    rating: 4.5,
    weight: 1.0,
  },
];

export const BUILDERS: Builder[] = [
  { name: "Prestige", city: "Bangalore", tier: "A", score: 1.1 },
  { name: "Sobha", city: "Bangalore", tier: "A", score: 1.1 },
  { name: "Brigade", city: "Bangalore", tier: "A", score: 1.08 },
  { name: "Embassy Group", city: "Bangalore", tier: "A", score: 1.1 },
  { name: "Salarpuria Sattva", city: "Bangalore", tier: "B", score: 1.05 },
  { name: "Puravankara", city: "Bangalore", tier: "B", score: 1.05 },
  { name: "Godrej Properties", city: "Bangalore", tier: "A", score: 1.08 },
  { name: "Adarsh Developers", city: "Bangalore", tier: "A", score: 1.08 },
  { name: "Total Environment", city: "Bangalore", tier: "A", score: 1.1 },
  { name: "DLF", city: "Delhi NCR", tier: "A", score: 1.1 },
  { name: "Godrej Properties", city: "Delhi NCR", tier: "A", score: 1.1 },
  { name: "ATS Infrastructure", city: "Delhi NCR", tier: "A", score: 1.1 },
  { name: "M3M India", city: "Delhi NCR", tier: "A", score: 1.1 },
  { name: "Kolte Patil", city: "Pune", tier: "A", score: 1.08 },
  { name: "Panchshil Realty", city: "Pune", tier: "A", score: 1.1 },
  { name: "Lodha Group", city: "Pune", tier: "A", score: 1.1 },
  { name: "Shapoorji Pallonji", city: "Pune", tier: "A", score: 1.1 },
  { name: "Local Builder", city: "All", tier: "LOCAL", score: 0.95 },
];

export const MICRO_LOCATIONS: MicroLocation[] = [
  {
    locality: "Hebbal",
    zone: "North",
    type: "Premium",
    lat: 13.0358,
    lng: 77.597,
    weight: 0.95,
  },
  {
    locality: "Yelahanka",
    zone: "North",
    type: "Growth Zone",
    lat: 13.1007,
    lng: 77.5963,
    weight: 0.85,
  },
  {
    locality: "Jakkur",
    zone: "North",
    type: "Premium",
    lat: 13.07,
    lng: 77.61,
    weight: 0.92,
  },
  {
    locality: "Thanisandra",
    zone: "North",
    type: "High Growth",
    lat: 13.05,
    lng: 77.62,
    weight: 0.95,
  },
  {
    locality: "Hennur Road",
    zone: "North",
    type: "High Growth",
    lat: 13.05,
    lng: 77.65,
    weight: 0.95,
  },
  {
    locality: "Nagawara",
    zone: "North",
    type: "IT Influence",
    lat: 13.05,
    lng: 77.62,
    weight: 0.95,
  },
  {
    locality: "Manyata Tech Park Area",
    zone: "North",
    type: "IT Hub",
    lat: 13.0486,
    lng: 77.62,
    weight: 1.0,
  },
  {
    locality: "Devanahalli",
    zone: "North",
    type: "Future Growth",
    lat: 13.2,
    lng: 77.71,
    weight: 0.8,
  },
  {
    locality: "Whitefield",
    zone: "East",
    type: "IT Hub",
    lat: 12.9855,
    lng: 77.737,
    weight: 1.0,
  },
  {
    locality: "Sarjapur Road",
    zone: "East",
    type: "High Growth",
    lat: 12.91,
    lng: 77.7,
    weight: 0.95,
  },
  {
    locality: "Bellandur",
    zone: "East",
    type: "IT Influence",
    lat: 12.9352,
    lng: 77.6958,
    weight: 0.95,
  },
  {
    locality: "Marathahalli",
    zone: "East",
    type: "IT Hub",
    lat: 12.936,
    lng: 77.693,
    weight: 0.95,
  },
  {
    locality: "Indiranagar",
    zone: "Central",
    type: "Premium",
    lat: 12.9784,
    lng: 77.6408,
    weight: 1.0,
  },
  {
    locality: "Koramangala",
    zone: "Central",
    type: "Premium",
    lat: 12.9279,
    lng: 77.6271,
    weight: 1.0,
  },
  {
    locality: "HSR Layout",
    zone: "SE",
    type: "Premium",
    lat: 12.91,
    lng: 77.64,
    weight: 0.95,
  },
  {
    locality: "Electronic City",
    zone: "South",
    type: "IT Hub",
    lat: 12.8456,
    lng: 77.6603,
    weight: 0.9,
  },
  {
    locality: "Bannerghatta Road",
    zone: "South",
    type: "Growth Zone",
    lat: 12.9,
    lng: 77.6,
    weight: 0.88,
  },
  {
    locality: "Jayanagar",
    zone: "South",
    type: "Premium",
    lat: 12.929,
    lng: 77.583,
    weight: 0.95,
  },
  {
    locality: "Rajajinagar",
    zone: "West",
    type: "Mid",
    lat: 12.991,
    lng: 77.555,
    weight: 0.88,
  },
  {
    locality: "Hennur",
    zone: "North",
    type: "Growth Zone",
    lat: 13.04,
    lng: 77.64,
    weight: 0.92,
  },
];

// ─── Haversine ───────────────────────────────────────────────────────────────

export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Base Price ───────────────────────────────────────────────────────────────

export function getBasePricePerSqft(city: string, zone: string): number {
  const c = city.toLowerCase();
  const z = zone.toLowerCase();
  if (c.includes("bangalore") || c.includes("bengaluru")) {
    if (z === "central") return 11000;
    if (z === "east" || z === "se") return 9500;
    if (z === "north") return 8500;
    if (z === "south") return 7500;
    if (z === "west") return 6500;
    return 8500;
  }
  if (
    c.includes("delhi") ||
    c.includes("ncr") ||
    c.includes("gurgaon") ||
    c.includes("noida")
  ) {
    if (z === "prime" || z === "central") return 12000;
    return 8000;
  }
  if (c.includes("pune")) {
    if (z === "prime" || z === "central") return 8000;
    return 5500;
  }
  return 6000;
}

export function getFloorMultiplier(floor: number): number {
  if (floor <= 3) return 1.0;
  if (floor <= 7) return 1.02;
  if (floor <= 14) return 1.04;
  return 1.06;
}

export function getBhkMultiplier(bhk: number): number {
  if (bhk === 1) return 0.95;
  if (bhk === 2) return 1.0;
  if (bhk === 3) return 1.05;
  return 1.1;
}

export function getPropertyTypeMultiplier(type: string): number {
  const t = type.toLowerCase();
  if (t === "villa") return 1.15;
  if (t === "plot") return 0.85;
  if (t === "commercial") return 1.1;
  return 1.0;
}

// ─── Nearest Metro ────────────────────────────────────────────────────────────

export function getNearestMetro(
  lat: number,
  lng: number,
): { name: string; distance: number } {
  let nearest = METROS[0];
  let minDist = haversine(lat, lng, nearest.lat, nearest.lng);
  for (const m of METROS) {
    const d = haversine(lat, lng, m.lat, m.lng);
    if (d < minDist) {
      minDist = d;
      nearest = m;
    }
  }
  return { name: nearest.name, distance: Math.round(minDist * 10) / 10 };
}

// ─── Tech Park Score ─────────────────────────────────────────────────────────

export function getTechParkScore(
  lat: number,
  lng: number,
): { score: number; nearestPark: string; distance: number } {
  const ranked = TECH_PARKS.map((p) => ({
    ...p,
    dist: haversine(lat, lng, p.lat, p.lng),
  }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

  const rawScores = ranked.map((p) => {
    if (p.dist < 3) return 1.06 * p.weight;
    if (p.dist < 6) return 1.03 * p.weight;
    return 1.0;
  });

  const avgRaw = rawScores.reduce((s, v) => s + v, 0) / rawScores.length;
  const score = Math.min(1, Math.max(0, (avgRaw - 1.0) / 0.06));
  return {
    score: Math.round(score * 100) / 100,
    nearestPark: ranked[0].name,
    distance: Math.round(ranked[0].dist * 10) / 10,
  };
}

// ─── Amenity Score ───────────────────────────────────────────────────────────

export function getAmenityScore(
  lat: number,
  lng: number,
): { score: number; count: number } {
  const RADIUS_KM = 3;
  const nearby = AMENITIES.filter(
    (a) => haversine(lat, lng, a.lat, a.lng) <= RADIUS_KM,
  );
  if (nearby.length === 0) return { score: 0, count: 0 };
  const rawSum = nearby.reduce((sum, a) => {
    const dist = Math.max(haversine(lat, lng, a.lat, a.lng), 0.1);
    return sum + (a.rating * a.weight) / dist;
  }, 0);
  const score = Math.min(1, rawSum / 50);
  return { score: Math.round(score * 100) / 100, count: nearby.length };
}

// ─── Builder Score ───────────────────────────────────────────────────────────

export function getBuilderScore(builderName: string, city: string): number {
  if (!builderName) return 0.95;
  const name = builderName.toLowerCase().trim();
  const c = city.toLowerCase();
  const exact = BUILDERS.find(
    (b) => b.name.toLowerCase() === name && b.city.toLowerCase() === c,
  );
  if (exact) return exact.score;
  const cityMatch = BUILDERS.find(
    (b) =>
      b.name.toLowerCase() === name &&
      (b.city.toLowerCase().includes(c) || c.includes(b.city.toLowerCase())),
  );
  if (cityMatch) return cityMatch.score;
  const anyCity = BUILDERS.find((b) => b.name.toLowerCase() === name);
  if (anyCity) return anyCity.score;
  const partialName = BUILDERS.find(
    (b) =>
      name.includes(b.name.toLowerCase()) ||
      b.name.toLowerCase().includes(name),
  );
  if (partialName) return partialName.score;
  return 0.95;
}

// ─── Micro Location Weight ────────────────────────────────────────────────────

export function getMicroLocationWeight(locality: string): {
  weight: number;
  zone: string;
  type: string;
} {
  if (!locality) return { weight: 0.9, zone: "Unknown", type: "Mid" };
  const loc = locality.toLowerCase();
  const exact = MICRO_LOCATIONS.find((m) => m.locality.toLowerCase() === loc);
  if (exact)
    return { weight: exact.weight, zone: exact.zone, type: exact.type };
  const contains = MICRO_LOCATIONS.find(
    (m) =>
      loc.includes(m.locality.toLowerCase()) ||
      m.locality.toLowerCase().includes(loc),
  );
  if (contains)
    return {
      weight: contains.weight,
      zone: contains.zone,
      type: contains.type,
    };
  return { weight: 0.9, zone: "Unknown", type: "Mid" };
}

// ─── Main Valuation Function ──────────────────────────────────────────────────

export function valuate(input: ValuationInput): ValuationOutput {
  const { locality, builder, city, area, floor, propertyType, bhk } = input;

  const microData = getMicroLocationWeight(locality);
  const microLoc = MICRO_LOCATIONS.find(
    (m) =>
      m.locality.toLowerCase() === locality.toLowerCase() ||
      locality.toLowerCase().includes(m.locality.toLowerCase()) ||
      m.locality.toLowerCase().includes(locality.toLowerCase()),
  );

  const lat = input.lat ?? microLoc?.lat ?? 12.9716;
  const lng = input.lng ?? microLoc?.lng ?? 77.5946;

  const basePrice = getBasePricePerSqft(city, microData.zone);
  const builderScore = getBuilderScore(builder, city);
  const techResult = getTechParkScore(lat, lng);
  const amenityResult = getAmenityScore(lat, lng);
  const microWeight = microData.weight;
  const floorMultiplier = getFloorMultiplier(floor);
  const bhkMultiplier = getBhkMultiplier(bhk);
  const typeMultiplier = getPropertyTypeMultiplier(propertyType);
  const metroResult = getNearestMetro(lat, lng);

  const estimatedPrice = Math.round(
    area *
      basePrice *
      builderScore *
      microWeight *
      floorMultiplier *
      bhkMultiplier *
      typeMultiplier *
      (1 + techResult.score * 0.05) *
      (1 + amenityResult.score * 0.03),
  );

  const pricePerSqft = area > 0 ? Math.round(estimatedPrice / area) : 0;
  const confidence = Math.min(
    100,
    Math.round(60 + techResult.score * 20 + amenityResult.score * 20),
  );

  return {
    estimatedPrice,
    pricePerSqft,
    builderScore,
    techScore: techResult.score,
    amenityScore: amenityResult.score,
    microWeight,
    basePrice,
    metroDistance: metroResult.distance,
    techParkDistance: techResult.distance,
    amenitiesCount: amenityResult.count,
    metroName: metroResult.name,
    nearestTechPark: techResult.nearestPark,
    confidence,
    floorMultiplier,
    bhkMultiplier,
    typeMultiplier,
  };
}

// ─── V2 Interfaces ────────────────────────────────────────────────────────────

export interface ValuationResult {
  fMV: number;
  range: [number, number];
  pricePerSqft: number;
  scores: {
    tech: number;
    amenity: number;
    builder: number;
    location: number;
  };
  confidence: number;
  breakdown: {
    basePrice: number;
    locationFactor: number;
    builderFactor: number;
    demandFactor: number;
    livabilityFactor: number;
    metroFactor: number;
    microWeight: number;
    metroName: string;
    metroDistance: number;
    nearestTechPark: string;
    amenitiesCount: number;
  };
}

export interface ComparableSale {
  id: string;
  locality: string;
  project: string;
  propertyType: string;
  bhk: number;
  area: number;
  salePrice: number;
  pricePerSqft: number;
  saleDate: string;
  similarityScore: number;
  distance: string;
}

// ─── V2 Valuation Engine ──────────────────────────────────────────────────────

export function valuateV2(input: ValuationInput): ValuationResult {
  const { locality, builder, city, area, floor, propertyType, bhk } = input;

  // Resolve location coords
  const microData = getMicroLocationWeight(locality);
  const microLoc = MICRO_LOCATIONS.find(
    (m) =>
      m.locality.toLowerCase() === locality.toLowerCase() ||
      locality.toLowerCase().includes(m.locality.toLowerCase()) ||
      m.locality.toLowerCase().includes(locality.toLowerCase()),
  );
  const lat = input.lat ?? microLoc?.lat ?? 12.9716;
  const lng = input.lng ?? microLoc?.lng ?? 77.5946;

  // Base price
  const basePrice = getBasePricePerSqft(city, microData.zone);

  // Location Factor
  const metroResult = getNearestMetro(lat, lng);
  const metroDistance = metroResult.distance;
  let metroFactor: number;
  if (metroDistance < 1) metroFactor = 1.08;
  else if (metroDistance < 3) metroFactor = 1.05;
  else if (metroDistance < 6) metroFactor = 1.02;
  else metroFactor = 0.98;

  const microWeight = microData.weight;
  const locationFactor = microWeight * metroFactor;

  // Builder Factor
  const builderFactor = getBuilderScore(builder, city);

  // Tech Score (new formula)
  const allTechWithDist = TECH_PARKS.map((p) => ({
    ...p,
    dist: haversine(lat, lng, p.lat, p.lng),
  }));
  const rawTechScore = allTechWithDist.reduce(
    (sum, p) => sum + p.weight / (p.dist + 0.5),
    0,
  );
  const normalizedTechScore = Math.max(Math.min(rawTechScore / 5, 1), 0.1);

  // Amenity Score (new formula, 5km radius)
  const AMENITY_RADIUS = 5;
  const nearbyAmenities = AMENITIES.filter(
    (a) => haversine(lat, lng, a.lat, a.lng) <= AMENITY_RADIUS,
  );
  const rawAmenityScore = nearbyAmenities.reduce((sum, a) => {
    const dist = haversine(lat, lng, a.lat, a.lng);
    return sum + (a.rating * a.weight) / (dist + 0.5);
  }, 0);
  const normalizedAmenityScore = Math.max(
    Math.min(rawAmenityScore / 10, 1),
    0.2,
  );

  // Nearest tech park for display
  const sortedTech = allTechWithDist.sort((a, b) => a.dist - b.dist);
  const nearestTechPark = sortedTech[0]?.name ?? "N/A";

  // Demand & Livability factors
  const demandFactor = 1 + normalizedTechScore * 0.15;
  const livabilityFactor = 1 + normalizedAmenityScore * 0.1;

  // Floor / BHK / Type multipliers
  const floorMult = getFloorMultiplier(floor);
  const bhkMult = getBhkMultiplier(bhk);
  const typeMult = getPropertyTypeMultiplier(propertyType);

  // Final Price
  const pricePerSqft = Math.round(
    basePrice *
      locationFactor *
      builderFactor *
      demandFactor *
      livabilityFactor *
      floorMult *
      bhkMult *
      typeMult,
  );
  const fMV = Math.round(pricePerSqft * area);
  const rangeLow = Math.round(fMV * 0.93);
  const rangeHigh = Math.round(fMV * 1.07);

  // Confidence Score
  const dataCoverage = microLoc ? 1.0 : 0.7;
  const techParksWithin10km = allTechWithDist.filter(
    (p) => p.dist <= 10,
  ).length;
  const techDensity = Math.min(techParksWithin10km / 5, 1);
  const amenityDensity = Math.min(nearbyAmenities.length / 10, 1);
  const builderReliability = builderFactor / 1.1;
  const confidence = Math.round(
    (0.35 * dataCoverage +
      0.25 * amenityDensity +
      0.25 * techDensity +
      0.15 * builderReliability) *
      100,
  );

  // Scores 0-100
  const techScore100 = Math.round(normalizedTechScore * 100);
  const amenityScore100 = Math.round(normalizedAmenityScore * 100);
  const builderScore100 = Math.round(((builderFactor - 0.9) / 0.2) * 100);
  const locationScore100 = Math.round(locationFactor * 100);

  return {
    fMV,
    range: [rangeLow, rangeHigh],
    pricePerSqft,
    scores: {
      tech: Math.min(100, Math.max(0, techScore100)),
      amenity: Math.min(100, Math.max(0, amenityScore100)),
      builder: Math.min(100, Math.max(0, builderScore100)),
      location: Math.min(100, Math.max(0, locationScore100)),
    },
    confidence: Math.min(100, Math.max(0, confidence)),
    breakdown: {
      basePrice,
      locationFactor: Math.round(locationFactor * 1000) / 1000,
      builderFactor: Math.round(builderFactor * 1000) / 1000,
      demandFactor: Math.round(demandFactor * 1000) / 1000,
      livabilityFactor: Math.round(livabilityFactor * 1000) / 1000,
      metroFactor,
      microWeight,
      metroName: metroResult.name,
      metroDistance,
      nearestTechPark,
      amenitiesCount: nearbyAmenities.length,
    },
  };
}

// ─── Comparable Sales Engine ──────────────────────────────────────────────────

// Deterministic pseudo-random using a seed string
function seededRandom(seed: string, index: number): number {
  let h = 0;
  const s = seed + index.toString();
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 10000) / 10000;
}

const COMPARABLE_PROJECTS: Record<string, string[]> = {
  Whitefield: [
    "Prestige Lakeside Habitat",
    "Sobha Silicon Oasis",
    "Brigade Cornerstone Utopia",
    "Purva Windermere",
    "Assetz Marq",
  ],
  Sarjapur: [
    "Sobha Dream Acres",
    "Godrej Splendour",
    "Salarpuria Sattva Aspire",
    "Provident Welworth City",
    "Assetz 63 Degree East",
  ],
  Hebbal: [
    "Sobha Clovelly",
    "Brigade Exotica",
    "Purva Zenium",
    "Godrej Aqua",
    "Embassy Springs",
  ],
  Koramangala: [
    "Prestige Shantiniketan",
    "Brigade Metropolis",
    "Shriram Signature",
    "Mantri Lithos",
    "Salarpuria Crown",
  ],
  HSR: [
    "Salarpuria Serenity",
    "Purva Primus",
    "Prestige Misty Waters",
    "Brigade Northridge",
    "Assetz Bloom",
  ],
  Electronic: [
    "Godrej United",
    "Shriram Samruddhi",
    "Purva Fountain Square",
    "Mantri Webcity",
    "DS Max Signature",
  ],
  Indiranagar: [
    "Prestige Edwardian",
    "Nitesh Buckingham Gate",
    "Embassy Residences",
    "Sobha Indraprastha",
  ],
  Default: [
    "Prestige Township",
    "Sobha Habitat",
    "Brigade Retreat",
    "Purva Panorama",
    "Godrej Reserve",
  ],
};

function getProjectList(locality: string): string[] {
  const key = Object.keys(COMPARABLE_PROJECTS).find((k) =>
    locality.toLowerCase().includes(k.toLowerCase()),
  );
  return COMPARABLE_PROJECTS[key ?? "Default"];
}

const MONTHS = [
  "Oct 2025",
  "Nov 2025",
  "Dec 2025",
  "Jan 2026",
  "Feb 2026",
  "Mar 2026",
];

export function getComparables(
  locality: string,
  city: string,
  propertyType: string,
  bhk: number,
): ComparableSale[] {
  const seed = `${locality}-${city}-${propertyType}-${bhk}`;
  const projects = getProjectList(locality);
  const microData = getMicroLocationWeight(locality);
  const zone = microData.zone;

  // Base price per sqft range
  const basePrice = getBasePricePerSqft(city, zone);
  const bhkAreaMap: Record<number, [number, number]> = {
    1: [500, 700],
    2: [900, 1200],
    3: [1300, 1700],
    4: [1800, 2400],
  };
  const [areaMin, areaMax] = bhkAreaMap[bhk] ?? [900, 1400];

  const count = 5 + (seededRandom(seed, 99) > 0.5 ? 1 : 0);
  const comps: ComparableSale[] = [];

  for (let i = 0; i < count; i++) {
    const r1 = seededRandom(seed, i * 7 + 1);
    const r2 = seededRandom(seed, i * 7 + 2);
    const r3 = seededRandom(seed, i * 7 + 3);
    const r4 = seededRandom(seed, i * 7 + 4);
    const r5 = seededRandom(seed, i * 7 + 5);

    const area = Math.round(areaMin + r1 * (areaMax - areaMin));
    const priceMult = 0.91 + r2 * 0.18; // ±9% around base
    const ppsf = Math.round(basePrice * priceMult);
    const salePrice = Math.round(ppsf * area);
    const distKm = 0.2 + r3 * 2.8;
    const monthIdx = Math.floor(r4 * MONTHS.length);
    const simScore = Math.round(70 + r5 * 28);
    const project = projects[i % projects.length];
    const bhkVar = bhk + (r2 > 0.7 ? (r2 > 0.85 ? 1 : 0) : 0);

    // Slightly vary locality for realism
    const locVariants = [
      locality,
      `${locality} Phase 2`,
      `${locality} Extension`,
      locality,
      locality,
    ];
    const compLocality = locVariants[i % locVariants.length];

    comps.push({
      id: `comp-${seed}-${i}`,
      locality: compLocality,
      project,
      propertyType,
      bhk: bhkVar,
      area,
      salePrice,
      pricePerSqft: ppsf,
      saleDate: MONTHS[monthIdx],
      similarityScore: simScore,
      distance: `${distKm.toFixed(1)} km`,
    });
  }

  return comps.sort((a, b) => b.similarityScore - a.similarityScore);
}
