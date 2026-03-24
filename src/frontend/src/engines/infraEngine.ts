// infraEngine.ts — Infrastructure proximity engine with road distance + travel time

import { estimateRoute, haversineDistance } from "./metroEngine";

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

export interface InfraItem {
  name: string;
  aerialKm: number;
  roadKm: number;
  travelTimeMin: number;
  distance: number; // backward compat (= roadKm)
  weight: number;
  rating?: number;
  type?: string;
}

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
    name: "Bagmane Constellation",
    area: "ORR",
    zone: "East",
    lat: 12.97,
    lng: 77.66,
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
    name: "Global Tech Park",
    area: "Marathahalli",
    zone: "East",
    lat: 12.936,
    lng: 77.693,
    weight: 0.9,
  },
  {
    name: "Divyasree Technopolis",
    area: "Yemalur",
    zone: "East",
    lat: 12.95,
    lng: 77.68,
    weight: 0.9,
  },
  {
    name: "RGA Tech Park",
    area: "Sarjapur Road",
    zone: "East",
    lat: 12.91,
    lng: 77.7,
    weight: 0.85,
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
    name: "Electronic City Phase 2",
    area: "Electronic City",
    zone: "South",
    lat: 12.83,
    lng: 77.68,
    weight: 0.95,
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
    name: "Velankani Tech Park",
    area: "Electronic City",
    zone: "South",
    lat: 12.8455,
    lng: 77.6665,
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
  {
    name: "Kalyani Magnum Tech Park",
    area: "Bannerghatta Road",
    zone: "South",
    lat: 12.906,
    lng: 77.6,
    weight: 0.85,
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
    name: "RMZ Latitude",
    area: "Hebbal",
    zone: "North",
    lat: 13.0455,
    lng: 77.618,
    weight: 0.95,
  },
  {
    name: "Prestige Tech Cloud",
    area: "Hebbal",
    zone: "North",
    lat: 13.042,
    lng: 77.615,
    weight: 0.95,
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
    name: "Devanahalli Business Park",
    area: "Devanahalli",
    zone: "North",
    lat: 13.23,
    lng: 77.71,
    weight: 0.95,
  },
  {
    name: "Shell Technology Centre",
    area: "Bagalur",
    zone: "North",
    lat: 13.15,
    lng: 77.68,
    weight: 0.9,
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
    name: "UB City Business District",
    area: "Central",
    zone: "Central",
    lat: 12.9753,
    lng: 77.5997,
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
    name: "Orchids International School ORR",
    type: "school",
    area: "Bellandur",
    zone: "East",
    lat: 12.95,
    lng: 77.65,
    rating: 4.3,
    weight: 0.8,
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
    name: "Delhi Public School North",
    type: "school",
    area: "Yelahanka",
    zone: "North",
    lat: 13.1,
    lng: 77.596,
    rating: 4.4,
    weight: 0.95,
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
    name: "St. Joseph's Boys High School",
    type: "school",
    area: "Central",
    zone: "Central",
    lat: 12.97,
    lng: 77.6,
    rating: 4.6,
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
    name: "Fortis Hospital Cunningham",
    type: "hospital",
    area: "Central",
    zone: "Central",
    lat: 12.99,
    lng: 77.59,
    rating: 4.4,
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
    name: "Narayana Multispeciality Hospital",
    type: "hospital",
    area: "Devanahalli",
    zone: "North",
    lat: 13.24,
    lng: 77.71,
    rating: 4.2,
    weight: 0.9,
  },
  {
    name: "Devanahalli Govt Hospital",
    type: "hospital",
    area: "Devanahalli",
    zone: "North",
    lat: 13.247,
    lng: 77.712,
    rating: 3.8,
    weight: 0.7,
  },
  {
    name: "BGS International School",
    type: "school",
    area: "Devanahalli",
    zone: "North",
    lat: 13.235,
    lng: 77.705,
    rating: 4.3,
    weight: 0.9,
  },
  {
    name: "VIBGYOR High School",
    type: "school",
    area: "Marathahalli",
    zone: "East",
    lat: 12.956,
    lng: 77.701,
    rating: 4.3,
    weight: 0.9,
  },
  {
    name: "Sparsh Hospital",
    type: "hospital",
    area: "Yeshwanthpur",
    zone: "North",
    lat: 13.025,
    lng: 77.554,
    rating: 4.3,
    weight: 0.9,
  },
];

function makeInfraItem(
  fromLat: number,
  fromLng: number,
  lat: number,
  lng: number,
  name: string,
  weight: number,
  rating?: number,
  type?: string,
): InfraItem {
  const route = estimateRoute(fromLat, fromLng, lat, lng);
  const aerial = haversineDistance(fromLat, fromLng, lat, lng);
  // Validate: if aerial < 0.05 km flag a warning (likely coordinate bug)
  if (aerial < 0.05) {
    console.warn(
      `[ValuBrix] Suspicious distance for ${name}: aerial ${aerial.toFixed(3)} km — possible coordinate overlap`,
    );
  }
  return {
    name,
    aerialKm: Math.round(aerial * 10) / 10,
    roadKm: route.roadKm,
    travelTimeMin: route.travelTimeMin,
    distance: route.roadKm,
    weight,
    rating,
    type,
  };
}

/** Returns top N nearest tech parks sorted by travel time. */
export function getTopTechParks(lat: number, lng: number, n = 5): InfraItem[] {
  console.log(
    `[ValuBrix] Computing tech parks from (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
  );
  return TECH_PARKS.map((t) =>
    makeInfraItem(
      lat,
      lng,
      t.lat,
      t.lng,
      t.name,
      t.weight,
      undefined,
      "techpark",
    ),
  )
    .sort((a, b) => a.travelTimeMin - b.travelTimeMin)
    .slice(0, n);
}

/** Returns top N nearest hospitals sorted by travel time. */
export function getTopHospitals(lat: number, lng: number, n = 5): InfraItem[] {
  return AMENITIES.filter((a) => a.type === "hospital")
    .map((a) =>
      makeInfraItem(
        lat,
        lng,
        a.lat,
        a.lng,
        a.name,
        a.weight,
        a.rating,
        "hospital",
      ),
    )
    .sort((a, b) => a.travelTimeMin - b.travelTimeMin)
    .slice(0, n);
}

/** Returns top N nearest schools sorted by travel time. */
export function getTopSchools(lat: number, lng: number, n = 5): InfraItem[] {
  return AMENITIES.filter((a) => a.type === "school")
    .map((a) =>
      makeInfraItem(
        lat,
        lng,
        a.lat,
        a.lng,
        a.name,
        a.weight,
        a.rating,
        "school",
      ),
    )
    .sort((a, b) => a.travelTimeMin - b.travelTimeMin)
    .slice(0, n);
}

/**
 * Tech score: sum(weight / (travelTimeMin + 5)), normalized, floor 0.1
 */
export function getRawTechScore(lat: number, lng: number): number {
  const parks = getTopTechParks(lat, lng, 5);
  const raw = parks.reduce(
    (sum, p) => sum + p.weight / (p.travelTimeMin + 5),
    0,
  );
  return Math.max(Math.min(raw / 0.8, 1), 0.1);
}

/**
 * Amenity score: sum(rating * weight / (travelTimeMin + 5)), normalized, floor 0.2
 */
export function getRawAmenityScore(lat: number, lng: number): number {
  const hospitals = getTopHospitals(lat, lng, 5);
  const schools = getTopSchools(lat, lng, 5);
  const combined = [...hospitals, ...schools];
  const raw = combined.reduce(
    (sum, a) => sum + ((a.rating ?? 4.0) * a.weight) / (a.travelTimeMin + 5),
    0,
  );
  return Math.max(Math.min(raw / 3.5, 1), 0.2);
}
