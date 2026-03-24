// valuationEngine.ts — Orchestrator
// Imports all sub-engines. Single source of truth for property valuation.

import { getLocalityBasePrice } from "./areaIntelligenceEngine";
import { getDealScore } from "./dealEngine";
import { getDemandOutput } from "./demandEngine";
import {
  getRawAmenityScore,
  getRawTechScore,
  getTopHospitals,
  getTopSchools,
  getTopTechParks,
} from "./infraEngine";
import {
  getMetroFactor,
  getNearestMetros,
  haversineDistance,
} from "./metroEngine";
import { getPricePrediction } from "./predictionEngine";
import { getRecommendation } from "./recommendationEngine";

export type { DealOutput, DealClassification } from "./dealEngine";
export type { PredictionOutput } from "./predictionEngine";
export type { RecommendationOutput } from "./recommendationEngine";
export type { AreaIntelligenceOutput } from "./areaIntelligenceEngine";
export { getAreaIntelligence } from "./areaIntelligenceEngine";
export { getDealScore } from "./dealEngine";
export { getPricePrediction } from "./predictionEngine";
export { getRecommendation } from "./recommendationEngine";

// Explicitly re-export haversineDistance for external use
export { haversineDistance };

// ─── Builder Dataset ──────────────────────────────────────────────────────────
const BUILDERS: Record<string, number> = {
  prestige: 1.1,
  sobha: 1.1,
  brigade: 1.08,
  "embassy group": 1.1,
  "salarpuria sattva": 1.05,
  "century real estate": 1.05,
  "assetz property group": 1.05,
  puravankara: 1.05,
  "godrej properties": 1.08,
  "mahindra lifespaces": 1.05,
  "shriram properties": 1.0,
  "ds max": 0.98,
  aratt: 0.98,
  "gopalan enterprises": 1.05,
  "nitesh estates": 1.05,
  "vaishnavi group": 1.05,
  "adarsh developers": 1.08,
  "total environment": 1.1,
  "concorde group": 1.05,
  "sumadhura group": 1.05,
  "kolte patil": 1.05,
  dlf: 1.1,
  "tata housing": 1.08,
  "ats infrastructure": 1.1,
  "m3m india": 1.1,
  "panchshil realty": 1.1,
  "kumar properties": 1.08,
  "vtp realty": 1.08,
  "shapoorji pallonji": 1.1,
  "lodha group": 1.1,
  "gera developments": 1.05,
};

// ─── Micro-location Weights ───────────────────────────────────────────────────
const MICRO_WEIGHTS: Record<string, number> = {
  "manyata tech park": 1.0,
  whitefield: 0.95,
  "sarjapur road": 0.95,
  hebbal: 0.95,
  indiranagar: 0.98,
  koramangala: 0.98,
  "hsr layout": 0.97,
  bellandur: 0.95,
  "electronic city": 0.9,
  devanahalli: 0.8,
  yelahanka: 0.85,
  nagawara: 0.95,
  thanisandra: 0.95,
  "hennur road": 0.92,
  marathahalli: 0.9,
  "kr puram": 0.88,
  "jp nagar": 0.9,
  jayanagar: 0.93,
  "bannerghatta road": 0.9,
  "btm layout": 0.92,
  rajajinagar: 0.9,
  "rt nagar": 0.88,
  jalahalli: 0.88,
  peenya: 0.85,
  yeshwanthpur: 0.9,
  default: 0.85,
};

function getBuilderScore(builder: string): number {
  const key = builder.toLowerCase();
  for (const [k, v] of Object.entries(BUILDERS)) {
    if (key.includes(k)) return v;
  }
  return 0.95; // Local builder default
}

function getMicroWeight(locality: string): number {
  const key = locality.toLowerCase();
  for (const [k, v] of Object.entries(MICRO_WEIGHTS)) {
    if (key.includes(k)) return v;
  }
  return MICRO_WEIGHTS.default;
}

// ─── Locality Coordinate Lookup ───────────────────────────────────────────────
// IMPORTANT: These are real-world coordinates for each locality.
// DO NOT use Bangalore center (12.9716, 77.5946) as a stand-in for any named locality.
// The fallback is only used when the locality is genuinely unknown.
const LOCALITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // North Bangalore
  jalahalli: { lat: 13.0516, lng: 77.5348 },
  "jalahalli east": { lat: 13.05, lng: 77.55 },
  "jalahalli west": { lat: 13.0516, lng: 77.52 },
  peenya: { lat: 13.028, lng: 77.515 },
  yeshwanthpur: { lat: 13.028, lng: 77.554 },
  rajajinagar: { lat: 12.991, lng: 77.555 },
  "rt nagar": { lat: 13.022, lng: 77.594 },
  hebbal: { lat: 13.0358, lng: 77.597 },
  nagawara: { lat: 13.0486, lng: 77.62 },
  thanisandra: { lat: 13.05, lng: 77.62 },
  "hennur road": { lat: 13.04, lng: 77.64 },
  hennur: { lat: 13.04, lng: 77.64 },
  yelahanka: { lat: 13.1007, lng: 77.5963 },
  devanahalli: { lat: 13.2, lng: 77.71 },
  bagalur: { lat: 13.14, lng: 77.67 },
  "manyata tech park": { lat: 13.0486, lng: 77.62 },
  jakkur: { lat: 13.07, lng: 77.61 },
  kogilu: { lat: 13.09, lng: 77.62 },
  "kalyan nagar": { lat: 13.02, lng: 77.64 },
  "hrbr layout": { lat: 13.02, lng: 77.65 },
  banaswadi: { lat: 13.01, lng: 77.65 },
  horamavu: { lat: 13.03, lng: 77.66 },
  "sahakar nagar": { lat: 13.062, lng: 77.583 },
  byatarayanapura: { lat: 13.06, lng: 77.59 },
  amruthahalli: { lat: 13.06, lng: 77.6 },
  vidyaranyapura: { lat: 13.08, lng: 77.56 },
  kodigehalli: { lat: 13.07, lng: 77.58 },

  // East Bangalore
  whitefield: { lat: 12.9698, lng: 77.7499 },
  "sarjapur road": { lat: 12.91, lng: 77.687 },
  sarjapur: { lat: 12.91, lng: 77.687 },
  marathahalli: { lat: 12.9547, lng: 77.7019 },
  bellandur: { lat: 12.9352, lng: 77.6958 },
  kadubeesanahalli: { lat: 12.935, lng: 77.697 },
  "kr puram": { lat: 13.0077, lng: 77.695 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  domlur: { lat: 12.96, lng: 77.639 },
  hoodi: { lat: 12.992, lng: 77.716 },
  kundalahalli: { lat: 12.967, lng: 77.715 },
  yemalur: { lat: 12.95, lng: 77.68 },
  varthur: { lat: 12.94, lng: 77.75 },
  brookefield: { lat: 12.97, lng: 77.73 },
  mahadevapura: { lat: 12.99, lng: 77.7 },

  // South Bangalore
  "electronic city": { lat: 12.8399, lng: 77.677 },
  "bannerghatta road": { lat: 12.9, lng: 77.6 },
  "jp nagar": { lat: 12.9, lng: 77.58 },
  jayanagar: { lat: 12.929, lng: 77.583 },
  banashankari: { lat: 12.918, lng: 77.573 },
  "kanakapura road": { lat: 12.88, lng: 77.55 },
  "btm layout": { lat: 12.9166, lng: 77.6101 },
  "hsr layout": { lat: 12.91, lng: 77.65 },
  hsr: { lat: 12.91, lng: 77.65 },
  "silk board": { lat: 12.917, lng: 77.622 },
  bommanahalli: { lat: 12.9, lng: 77.63 },
  "begur road": { lat: 12.88, lng: 77.61 },
  yelachenahalli: { lat: 12.8856, lng: 77.5747 },
  kengeri: { lat: 12.914, lng: 77.484 },
  akshayanagar: { lat: 12.875, lng: 77.61 },

  // West Bangalore
  "rr nagar": { lat: 12.9145, lng: 77.504 },
  vijayanagar: { lat: 12.971, lng: 77.537 },
  nagarbhavi: { lat: 12.95, lng: 77.51 },
  "magadi road": { lat: 12.98, lng: 77.525 },

  // Central Bangalore
  koramangala: { lat: 12.9352, lng: 77.6245 },
  "mg road": { lat: 12.9756, lng: 77.6066 },
  "ub city": { lat: 12.9721, lng: 77.5933 },
  majestic: { lat: 12.9763, lng: 77.5713 },
  "cunningham road": { lat: 12.99, lng: 77.59 },
  "richmond road": { lat: 12.96, lng: 77.61 },
  "lavelle road": { lat: 12.97, lng: 77.595 },
  "residency road": { lat: 12.972, lng: 77.602 },
  "brigade road": { lat: 12.974, lng: 77.608 },
  "church street": { lat: 12.975, lng: 77.607 },
  "frazer town": { lat: 12.989, lng: 77.614 },
  "cox town": { lat: 12.993, lng: 77.615 },

  // Pune
  wakad: { lat: 18.5985, lng: 73.7706 },
  baner: { lat: 18.559, lng: 73.7868 },
  hinjewadi: { lat: 18.5912, lng: 73.7389 },
  kharadi: { lat: 18.559, lng: 73.9454 },
  magarpatta: { lat: 18.512, lng: 73.9275 },
  hadapsar: { lat: 18.5067, lng: 73.9259 },
  "viman nagar": { lat: 18.5679, lng: 73.9143 },
  "koregaon park": { lat: 18.5362, lng: 73.8955 },
  "kalyani nagar": { lat: 18.5479, lng: 73.9036 },
  aundh: { lat: 18.5621, lng: 73.8081 },
  pimpri: { lat: 18.6279, lng: 73.7993 },
  chinchwad: { lat: 18.6442, lng: 73.7902 },

  // Delhi NCR
  dwarka: { lat: 28.5921, lng: 77.046 },
  "noida sector 62": { lat: 28.6261, lng: 77.3653 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  "cyber city": { lat: 28.4944, lng: 77.0861 },
  "greater noida": { lat: 28.4744, lng: 77.504 },
  "south delhi": { lat: 28.5355, lng: 77.21 },
  noida: { lat: 28.5355, lng: 77.391 },
  // North Bangalore — extended localities
  rajankunte: { lat: 13.13, lng: 77.6 },
  sadahalli: { lat: 13.21, lng: 77.67 },
  "sadahalli gate": { lat: 13.21, lng: 77.67 },
  chikkajala: { lat: 13.17, lng: 77.64 },
  "sinthan nagar": { lat: 13.065, lng: 77.593 },
  "nikoo campus": { lat: 13.21, lng: 77.67 },
  "airport road": { lat: 13.2, lng: 77.7 },
  "kial road": { lat: 13.2, lng: 77.7 },
  "aerospace park": { lat: 13.17, lng: 77.67 },
  huvinayakanahalli: { lat: 13.17, lng: 77.67 },
  gummanahalli: { lat: 13.18, lng: 77.68 },
  kannamangala: { lat: 13.18, lng: 77.68 },
  kiadb: { lat: 13.17, lng: 77.665 },
  "ivc road": { lat: 13.22, lng: 77.69 },
  doddaballapur: { lat: 13.292, lng: 77.537 },
  "doddaballapur road": { lat: 13.15, lng: 77.6 },
  hessarghatta: { lat: 13.19, lng: 77.48 },
  "hessarghatta lake road": { lat: 13.19, lng: 77.48 },
  marasandra: { lat: 13.18, lng: 77.56 },
  doddajala: { lat: 13.18, lng: 77.66 },
  "doddajala junction": { lat: 13.18, lng: 77.66 },
  nagavara: { lat: 13.048, lng: 77.62 },
  "nagawara junction": { lat: 13.048, lng: 77.62 },
  "bellary road": { lat: 13.05, lng: 77.6 },
  shettigere: { lat: 13.198, lng: 77.683 },
  "shettigere road": { lat: 13.198, lng: 77.683 },
  "airport corridor": { lat: 13.198, lng: 77.683 },
  "airport zone": { lat: 13.2, lng: 77.7 },
  "embassy springs": { lat: 13.21, lng: 77.71 },
  waraguppe: { lat: 13.25, lng: 77.73 },
  bettenahalli: { lat: 13.24, lng: 77.72 },
  boovanahalli: { lat: 13.26, lng: 77.7 },
  "nandi hills road": { lat: 13.26, lng: 77.68 },
  "devanahalli town": { lat: 13.246, lng: 77.712 },
  "strr corridor": { lat: 13.24, lng: 77.71 },
  "strr belt": { lat: 13.24, lng: 77.71 },
  "bagalur main road": { lat: 13.145, lng: 77.653 },
  "bagalur kiadb": { lat: 13.15, lng: 77.66 },
  "kiadb area": { lat: 13.17, lng: 77.665 },
  "kiadb extension": { lat: 13.15, lng: 77.655 },
  "bellary road thanisandra": { lat: 13.07, lng: 77.625 },
  "thanisandra main road": { lat: 13.08, lng: 77.63 },
  "thanisandra extension": { lat: 13.085, lng: 77.635 },
  "thanisandra road": { lat: 13.082, lng: 77.632 },
  "thanisandra junction": { lat: 13.07, lng: 77.625 },
  "yelahanka new town": { lat: 13.1007, lng: 77.5963 },
  "yelahanka extension": { lat: 13.105, lng: 77.6 },
  "yelahanka hobli": { lat: 13.09, lng: 77.58 },
  "yelahanka doddaballapur road": { lat: 13.12, lng: 77.61 },
  "yelahanka satellite town": { lat: 13.1007, lng: 77.5963 },
  "doddaballapur road devanahalli": { lat: 13.255, lng: 77.705 },
  "jakkur lake road": { lat: 13.0785, lng: 77.62 },
  "jakkur main road": { lat: 13.0785, lng: 77.62 },
  "jakkur road": { lat: 13.077, lng: 77.622 },
  "airport road jakkur": { lat: 13.078, lng: 77.618 },
  "kogilu main road": { lat: 13.09, lng: 77.61 },
  "kogilu road": { lat: 13.095, lng: 77.605 },
  "hennur road horamavu": { lat: 13.03, lng: 77.65 },
  "dollars colony": { lat: 13.03, lng: 77.58 },
  "rmv 2nd stage": { lat: 13.03, lng: 77.58 },
  "hebbal lake": { lat: 13.04, lng: 77.6 },
  "hebbal flyover": { lat: 13.035, lng: 77.597 },
  "hebbal orr": { lat: 13.036, lng: 77.598 },
  "hebbal main road": { lat: 13.04, lng: 77.59 },
  "nagawara lake": { lat: 13.05, lng: 77.61 },
  "outer ring road hebbal": { lat: 13.036, lng: 77.597 },

  // East Bangalore — extended localities
  "old airport road": { lat: 12.96, lng: 77.65 },
  kodihalli: { lat: 12.96, lng: 77.645 },
  panathur: { lat: 12.94, lng: 77.7 },
  "panathur road": { lat: 12.94, lng: 77.7 },
  "itpl road": { lat: 12.975, lng: 77.75 },
  "epip zone": { lat: 12.98, lng: 77.745 },
  "whitefield main road": { lat: 12.985, lng: 77.735 },
  "whitefield east": { lat: 12.98, lng: 77.75 },
  "whitefield extension": { lat: 12.97, lng: 77.745 },
  channasandra: { lat: 12.98, lng: 77.74 },
  gunjur: { lat: 12.93, lng: 77.72 },
  "varthur road": { lat: 12.94, lng: 77.73 },
  harlur: { lat: 12.91, lng: 77.695 },
  chikkanayakanahalli: { lat: 12.905, lng: 77.705 },
  garudacharpalya: { lat: 12.99, lng: 77.73 },
  "hoodi junction": { lat: 12.992, lng: 77.716 },
  "hal 2nd stage": { lat: 12.9705, lng: 77.64 },
  "hal road": { lat: 12.95, lng: 77.66 },
  hal: { lat: 12.95, lng: 77.66 },
  "old madras road": { lat: 13.0, lng: 77.72 },
  "kr puram old madras road": { lat: 13.0, lng: 77.7 },
  budur: { lat: 13.01, lng: 77.72 },
  "budigere cross": { lat: 13.03, lng: 77.73 },
  budigere: { lat: 13.03, lng: 77.73 },
  "yemalur hal road": { lat: 12.95, lng: 77.68 },
  "sarjapur sarjapur": { lat: 12.9, lng: 77.72 },
  "the prestige city": { lat: 12.89, lng: 77.71 },
  "whitefield varthur": { lat: 12.93, lng: 77.74 },
  "whitefield itpl": { lat: 12.975, lng: 77.75 },
  "whitefield hoodi": { lat: 12.992, lng: 77.716 },

  // South Bangalore — extended localities
  "begur road yelenahalli": { lat: 12.88, lng: 77.63 },
  yelenahalli: { lat: 12.88, lng: 77.63 },
  doddakannelli: { lat: 12.88, lng: 77.65 },
  "kanakapura konanakunte": { lat: 12.89, lng: 77.56 },
  konanakunte: { lat: 12.89, lng: 77.56 },
  turahalli: { lat: 12.88, lng: 77.55 },
  "holiday village road": { lat: 12.87, lng: 77.54 },
  thalaghattapura: { lat: 12.88, lng: 77.55 },
  "banashankari banashankari": { lat: 12.918, lng: 77.573 },
  bilekahalli: { lat: 12.89, lng: 77.6 },
  "electronic city phase 1": { lat: 12.8399, lng: 77.677 },
  "electronic city phase 2": { lat: 12.83, lng: 77.68 },
  "electronic city phase1": { lat: 12.8399, lng: 77.677 },
  "electronic city phase2": { lat: 12.83, lng: 77.68 },
  singasandra: { lat: 12.86, lng: 77.65 },
  "hosur road singasandra": { lat: 12.86, lng: 77.65 },
  "hosur road bommasandra": { lat: 12.82, lng: 77.69 },
  bommasandra: { lat: 12.82, lng: 77.69 },
  "hosur road": { lat: 12.86, lng: 77.67 },
  padmanabhanagar: { lat: 12.91, lng: 77.55 },
  "uttarahalli road": { lat: 12.91, lng: 77.54 },
  uttarahalli: { lat: 12.91, lng: 77.54 },
  "mysore road kengeri": { lat: 12.914, lng: 77.484 },
  "kanakapura banashankari": { lat: 12.9, lng: 77.56 },

  // West Bangalore — extended localities
  "tumkur road": { lat: 13.05, lng: 77.5 },
  nagasandra: { lat: 13.0475, lng: 77.4993 },
  "tumkur road nagasandra": { lat: 13.0475, lng: 77.4993 },

  // Central Bangalore — extended localities
  "vasanth nagar": { lat: 12.99, lng: 77.59 },
  "cunningham road vasanth nagar": { lat: 12.99, lng: 77.59 },
  "mg road central": { lat: 12.9756, lng: 77.6066 },
  "central business district": { lat: 12.9756, lng: 77.6066 },
  "frazer town central": { lat: 12.989, lng: 77.614 },
};

/**
 * Returns coordinates for a named locality.
 * Uses fuzzy substring matching against the LOCALITY_COORDS map.
 * Falls back to Bangalore center ONLY for truly unknown localities — logs a warning.
 */
export function getLocalityCoords(locality: string): {
  lat: number;
  lng: number;
} {
  const key = locality.toLowerCase().trim();

  // Exact match first
  if (LOCALITY_COORDS[key]) {
    console.log(
      `[ValuBrix] Locality exact match: "${locality}" (${LOCALITY_COORDS[key].lat}, ${LOCALITY_COORDS[key].lng})`,
    );
    return LOCALITY_COORDS[key];
  }

  // Fuzzy substring match
  for (const [k, v] of Object.entries(LOCALITY_COORDS)) {
    if (key.includes(k) || k.includes(key)) {
      console.log(
        `[ValuBrix] Locality matched: "${locality}" → "${k}" (${v.lat}, ${v.lng})`,
      );
      return v;
    }
  }

  // Log when fallback is used — this is a potential data gap
  console.warn(
    `[ValuBrix] WARNING: No coordinates found for locality "${locality}". Using Bangalore center fallback. Distances will be inaccurate.`,
  );
  return { lat: 12.9716, lng: 77.5946 }; // Bangalore center — only if truly unknown
}

// ─── Full Valuation Input/Output ──────────────────────────────────────────────
export interface ValuationInput {
  locality: string;
  lat?: number;
  lng?: number;
  builder: string;
  city: string;
  area: number; // sq ft
  floor: number;
  propertyType: string;
  bhk: number;
  listingPrice?: number;
}

export interface ValuationOutput {
  // Core
  fMV: number;
  range: [number, number];
  pricePerSqft: number;
  confidence: number;

  // Scores (0–100 for UI)
  scores: {
    tech: number;
    amenity: number;
    builder: number;
    location: number;
    demand: number;
    livability: number;
  };

  // Factors (multipliers)
  factors: {
    locationFactor: number;
    builderFactor: number;
    demandFactor: number;
    livabilityFactor: number;
    metroFactor: number;
    microWeight: number;
  };

  // Infra breakdown
  infra: {
    nearestMetros: ReturnType<typeof getNearestMetros>;
    topTechParks: ReturnType<typeof getTopTechParks>;
    topHospitals: ReturnType<typeof getTopHospitals>;
    topSchools: ReturnType<typeof getTopSchools>;
  };

  // Deal analysis
  deal: ReturnType<typeof getDealScore> | null;
  recommendation: ReturnType<typeof getRecommendation> | null;
  prediction: ReturnType<typeof getPricePrediction>;

  // Why this price
  priceExplanation: {
    basePrice: number;
    locationContrib: number; // %
    builderContrib: number;
    demandContrib: number;
    livabilityContrib: number;
  };

  metroDistance: number;
  nearestMetroName: string;
  basePrice: number;
}

/**
 * Main orchestrator. Runs all engines and returns the full valuation output.
 */
export function valuate(input: ValuationInput): ValuationOutput {
  const coords = {
    lat: input.lat ?? getLocalityCoords(input.locality).lat,
    lng: input.lng ?? getLocalityCoords(input.locality).lng,
  };

  // Debug logging for distance verification
  console.log(`[ValuBrix] Project: ${input.locality}`, coords.lat, coords.lng);

  const basePrice = getLocalityBasePrice(input.locality);
  const builderFactor = getBuilderScore(input.builder);
  const microWeight = getMicroWeight(input.locality);

  // Metro engine
  const metros = getNearestMetros(coords.lat, coords.lng, 3);

  for (const m of metros) {
    console.log(`[ValuBrix] Metro: ${m.name} → ${m.distance} km`);
  }

  // Validation: flag suspiciously small travel times
  const nearestTravelTime = metros[0]?.travelTimeMin ?? 999;
  if (nearestTravelTime < 2) {
    console.warn(
      `[ValuBrix] VALIDATION WARNING: Nearest metro travel time ${nearestTravelTime} min is suspiciously low. Check coordinates for ${input.locality}.`,
    );
  }

  const nearestMetro = metros[0];
  const metroFactor = getMetroFactor(nearestMetro.travelTimeMin);

  // Infra engines
  const techScore = getRawTechScore(coords.lat, coords.lng);
  const amenityScore = getRawAmenityScore(coords.lat, coords.lng);

  // Pre-compute tech parks for logging + reuse in return
  const techParks = getTopTechParks(coords.lat, coords.lng, 5);
  for (const tp of techParks) {
    console.log(`[ValuBrix] Tech Park: ${tp.name} → ${tp.distance} km`);
    if (tp.distance < 0.1) {
      console.warn(
        `[ValuBrix] VALIDATION WARNING: Tech park "${tp.name}" distance ${tp.distance} km is suspiciously small. Possible coordinate collision.`,
      );
    }
  }

  // Demand engine
  const demandOutput = getDemandOutput(coords.lat, coords.lng, input.locality);

  // Formula:
  // FinalPrice/sqft = BasePrice × LocationFactor × BuilderFactor × DemandFactor × LivabilityFactor
  const locationFactor = microWeight * metroFactor;
  const demandFactor = 1 + techScore * 0.15;
  const livabilityFactor = 1 + amenityScore * 0.1;

  // Property-level adjustments
  const floorMult =
    input.floor <= 0 ? 1.0 : Math.min(1 + input.floor * 0.003, 1.06);
  const bhkMult =
    input.bhk === 1
      ? 0.95
      : input.bhk === 2
        ? 1.0
        : input.bhk === 3
          ? 1.02
          : 1.04;
  const typeMult = input.propertyType?.toLowerCase().includes("villa")
    ? 1.08
    : input.propertyType?.toLowerCase().includes("plot")
      ? 0.88
      : 1.0;

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
  const fMV = Math.round(pricePerSqft * input.area);
  const range: [number, number] = [
    Math.round(fMV * 0.93),
    Math.round(fMV * 1.07),
  ];

  // Confidence score
  const dataCoverage = techScore > 0.3 && amenityScore > 0.3 ? 0.85 : 0.6;
  const amenityDensity = amenityScore;
  const techDensity = techScore;
  const builderReliability =
    builderFactor > 1.07 ? 1.0 : builderFactor > 1.03 ? 0.85 : 0.7;
  const confidence = Math.round(
    Math.min(
      0.35 * dataCoverage * 100 +
        0.25 * amenityDensity * 100 +
        0.25 * techDensity * 100 +
        0.15 * builderReliability * 100,
      95,
    ),
  );

  // Deal score (only if listing price provided)
  const deal = input.listingPrice
    ? getDealScore(fMV, input.listingPrice)
    : null;

  // Price prediction
  const prediction = getPricePrediction(
    fMV,
    coords.lat,
    coords.lng,
    input.locality,
  );

  // Recommendation (only if deal score available)
  const locationScore = Math.round(locationFactor * 85);
  const recommendation = deal
    ? getRecommendation(
        deal.score,
        deal.classification,
        prediction.pctGrowth1Y,
        locationScore,
        demandOutput.demandScore,
        prediction.classification,
      )
    : null;

  // Why this price explanation
  const locationContrib = Math.round((locationFactor - 1) * 100);
  const builderContrib = Math.round((builderFactor - 1) * 100);
  const demandContrib = Math.round((demandFactor - 1) * 100);
  const livabilityContrib = Math.round((livabilityFactor - 1) * 100);

  return {
    fMV,
    range,
    pricePerSqft,
    confidence,
    scores: {
      tech: Math.round(techScore * 100),
      amenity: Math.round(amenityScore * 100),
      builder: Math.round((builderFactor / 1.1) * 100),
      location: Math.round(locationFactor * 85),
      demand: demandOutput.demandScore,
      livability: Math.round(amenityScore * 100),
    },
    factors: {
      locationFactor: Math.round(locationFactor * 100) / 100,
      builderFactor,
      demandFactor: Math.round(demandFactor * 100) / 100,
      livabilityFactor: Math.round(livabilityFactor * 100) / 100,
      metroFactor,
      microWeight,
    },
    infra: {
      nearestMetros: metros,
      topTechParks: techParks,
      topHospitals: getTopHospitals(coords.lat, coords.lng, 5),
      topSchools: getTopSchools(coords.lat, coords.lng, 5),
    },
    deal,
    recommendation,
    prediction,
    priceExplanation: {
      basePrice,
      locationContrib,
      builderContrib,
      demandContrib,
      livabilityContrib,
    },
    metroDistance: nearestMetro.distance,
    nearestMetroName: nearestMetro.name,
    basePrice,
  };
}
