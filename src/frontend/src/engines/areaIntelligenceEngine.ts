// areaIntelligenceEngine.ts — Area-level intelligence aggregation
// Uses same engines as property valuation. No duplicate logic.
// Area = aggregation of property-level signals at locality coordinates.

import { getDemandOutput } from "./demandEngine";
import {
  getRawAmenityScore,
  getRawTechScore,
  getTopHospitals,
  getTopSchools,
  getTopTechParks,
} from "./infraEngine";
import { getMetroFactor, getNearestMetros } from "./metroEngine";
import { getPricePrediction } from "./predictionEngine";

export interface AreaIntelligenceOutput {
  investmentScore: number; // 0–100
  growthScore: number; // 0–100
  livabilityScore: number; // 0–100
  demandScore: number; // 0–100
  avgPricePerSqft: number;
  priceTrend1Y: number; // % growth
  priceTrend3Y: number; // % growth
  confidence: number; // 0–100
  classification: "High Growth" | "Emerging" | "Saturated";
  growthDriver: string;
  nearestMetros: ReturnType<typeof getNearestMetros>;
  topTechParks: ReturnType<typeof getTopTechParks>;
  topHospitals: ReturnType<typeof getTopHospitals>;
  topSchools: ReturnType<typeof getTopSchools>;
}

// Base price per sqft by locality (deterministic)
const LOCALITY_BASE_PRICE: Record<string, number> = {
  whitefield: 8200,
  "sarjapur road": 7800,
  sarjapur: 6500,
  "electronic city": 6200,
  hebbal: 13500,
  nagawara: 15000,
  devanahalli: 9000,
  yelahanka: 9000,
  rajankunte: 10500,
  hsr: 9200,
  "hsr layout": 10000,
  bellandur: 7000,
  koramangala: 12000,
  indiranagar: 11500,
  jayanagar: 9500,
  "bannerghatta road": 6500,
  bannerghatta: 6000,
  "jp nagar": 8500,
  marathahalli: 7500,
  "kr puram": 5500,
  "btm layout": 8000,
  domlur: 8500,
  "mg road": 11000,
  malleshwaram: 9000,
  malleswaram: 9000,
  sadashivanagar: 13000,
  "richmond town": 12000,
  ulsoor: 9500,
  "frazer town": 9000,
  "cv raman nagar": 6500,
  "old airport road": 7500,
  thanisandra: 10500,
  hennur: 13000,
  "kalyan nagar": 10000,
  "rt nagar": 6000,
  nagarbhavi: 5800,
  rajajinagar: 7000,
  vijayanagar: 6500,
  banashankari: 7000,
  "kanakapura road": 5500,
  kanakapura: 5000,
  "tumkur road": 5000,
  yeshwanthpur: 7000,
  peenya: 4500,
  banaswadi: 6000,
  horamavu: 5800,
  kammanahalli: 6200,
  varthur: 5500,
  kadugodi: 5000,
  shivajinagar: 9000,
  hal: 8000,
  "vasanth nagar": 10000,
  doddaballapur: 6800,
  nelamangala: 3500,
  attibele: 3200,
  chandapura: 3500,
  bommanahalli: 5500,
  budigere: 4000,
  bagalur: 7500,
  "hbr layout": 15000,
  "sahakara nagar": 14000,
  "hennur road": 13000,
  "manyata tech park": 11500,
  "aerospace park": 11000,
  chikkagubbi: 11000,
  sadahalli: 8500,
  chikkajala: 8000,
  kogilu: 8700,
  "ivc road": 6500,
  narayanapura: 11000,
  kothanur: 8300,
};

export function getLocalityBasePrice(locality: string): number {
  const key = locality.toLowerCase();
  for (const [k, v] of Object.entries(LOCALITY_BASE_PRICE)) {
    if (key.includes(k)) return v;
  }
  return 7000; // default for unknown localities
}

export function getAreaIntelligence(
  locality: string,
  lat: number,
  lng: number,
): AreaIntelligenceOutput {
  const techScore = getRawTechScore(lat, lng);
  const amenityScore = getRawAmenityScore(lat, lng);
  const metros = getNearestMetros(lat, lng, 3);
  const nearestMetro = metros[0];
  const metroFactor = nearestMetro
    ? getMetroFactor(nearestMetro.travelTimeMin)
    : 0.98;
  const demand = getDemandOutput(lat, lng, locality);

  const avgPrice = getLocalityBasePrice(locality);
  const prediction = getPricePrediction(avgPrice, lat, lng, locality);

  // Investment Score: tech + demand + metro proximity + appreciation
  const investmentRaw =
    techScore * 0.3 +
    (demand.demandScore / 100) * 0.25 +
    ((metroFactor - 0.95) / 0.13) * 0.2 +
    Math.min(prediction.pctGrowth1Y / 12, 1) * 0.25;
  const investmentScore = Math.round(Math.min(investmentRaw * 100, 100));

  // Growth Score from predictionEngine (formula-based)
  const growthScore = prediction.growthScore;

  // Livability Score: amenities density
  const livabilityScore = Math.round(Math.min(amenityScore * 100, 100));

  // Confidence: based on data coverage
  const dataCoverage = techScore > 0.3 && amenityScore > 0.3 ? 0.85 : 0.6;
  const confidence = Math.round(
    0.35 * dataCoverage * 100 +
      0.25 * (amenityScore * 100) * 0.01 * 100 +
      0.25 * (techScore * 100) * 0.01 * 100 +
      0.15 * 75,
  );

  return {
    investmentScore,
    growthScore,
    livabilityScore,
    demandScore: demand.demandScore,
    avgPricePerSqft: avgPrice,
    priceTrend1Y: prediction.pctGrowth1Y,
    priceTrend3Y: prediction.pctGrowth3Y,
    confidence: Math.min(confidence, 95),
    classification: prediction.classification,
    growthDriver: prediction.growthDriver,
    nearestMetros: metros,
    topTechParks: getTopTechParks(lat, lng, 5),
    topHospitals: getTopHospitals(lat, lng, 5),
    topSchools: getTopSchools(lat, lng, 5),
  };
}
