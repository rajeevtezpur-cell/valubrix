// predictionEngine.ts — Price prediction and area classification engine

import { getDemandOutput } from "./demandEngine";
import { getRawTechScore } from "./infraEngine";
import { getNearestMetros } from "./metroEngine";

export interface PredictionOutput {
  currentPrice: number;
  oneYearPrice: number;
  threeYearPrice: number;
  pctGrowth1Y: number;
  pctGrowth3Y: number;
  classification: "High Growth" | "Emerging" | "Saturated";
  classificationColor: string;
  growthScore: number; // 0–100, from formula
  growthDriver: string;
}

// Locality-specific historical appreciation rates (annual %)
const LOCALITY_APPRECIATION: Record<string, number> = {
  devanahalli: 0.12,
  yelahanka: 0.1,
  rajankunte: 0.1,
  "aerospace park": 0.11,
  bagalur: 0.11,
  thanisandra: 0.1,
  "hennur road": 0.09,
  nagawara: 0.09,
  hebbal: 0.08,
  whitefield: 0.08,
  "sarjapur road": 0.08,
  bellandur: 0.08,
  marathahalli: 0.07,
  manyata: 0.09,
  "electronic city": 0.07,
  "kr puram": 0.07,
  "hsr layout": 0.06,
  koramangala: 0.06,
  indiranagar: 0.05,
  jayanagar: 0.05,
  bannerghatta: 0.07,
  "jp nagar": 0.06,
  default: 0.06,
};

function getBaseAppreciation(locality: string): number {
  const key = locality.toLowerCase();
  for (const [k, v] of Object.entries(LOCALITY_APPRECIATION)) {
    if (key.includes(k)) return v;
  }
  return LOCALITY_APPRECIATION.default;
}

function getGrowthDriver(
  techScore: number,
  metroDistance: number,
  appreciation: number,
): string {
  if (appreciation >= 0.1) return "Airport expansion + emerging tech corridors";
  if (techScore > 0.7)
    return "Major IT park proximity driving sustained demand";
  if (metroDistance < 3) return "Metro connectivity boosting accessibility";
  if (appreciation >= 0.08)
    return "High demand micro-market with infrastructure growth";
  if (appreciation >= 0.06) return "Established area with steady appreciation";
  return "Mature market with stable, moderate growth";
}

/**
 * Compute area growth score using the formula:
 * Growth Score = (Price Growth * 0.3) + (Transactions * 0.2) + (Location Score * 0.3) + (Inventory Demand Ratio * 0.2)
 * All inputs normalized to 0–100.
 *
 * Classify:
 * > 70  → High Growth
 * 40–70 → Emerging
 * < 40  → Saturated
 */
function computeGrowthScore(
  pctGrowth1Y: number, // e.g. 10 = 10%
  techScore: number, // 0–1
  metroDistance: number, // km
  demandScore: number, // 0–100
): number {
  // Normalize each component to 0–100
  const priceGrowthNorm = Math.min(pctGrowth1Y / 12, 1) * 100;
  const transactionsNorm = Math.min(demandScore, 100);
  const locationScore = Math.min(
    techScore * 100 + (metroDistance < 5 ? 15 : 0),
    100,
  );
  const inventoryDemandRatio =
    metroDistance < 3
      ? 85
      : metroDistance < 7
        ? 65
        : metroDistance < 15
          ? 45
          : 25;

  return (
    priceGrowthNorm * 0.3 +
    transactionsNorm * 0.2 +
    locationScore * 0.3 +
    inventoryDemandRatio * 0.2
  );
}

/**
 * Predicts 1Y and 3Y prices based on infra signals and historical appreciation.
 */
export function getPricePrediction(
  currentPrice: number,
  lat: number,
  lng: number,
  locality: string,
): PredictionOutput {
  const baseRate = getBaseAppreciation(locality);
  const techScore = getRawTechScore(lat, lng);
  const metros = getNearestMetros(lat, lng, 1);
  const metroDistance = metros[0]?.distance ?? 10;
  const demand = getDemandOutput(lat, lng, locality);

  // Infra bonus: metro proximity and tech parks add to growth
  const metroBonus = metroDistance < 2 ? 0.02 : metroDistance < 5 ? 0.01 : 0;
  const techBonus = techScore > 0.7 ? 0.015 : techScore > 0.4 ? 0.008 : 0;

  const annualGrowth = baseRate + metroBonus + techBonus;

  const oneYearPrice = Math.round(currentPrice * (1 + annualGrowth));
  const threeYearPrice = Math.round(currentPrice * (1 + annualGrowth) ** 3);
  const pctGrowth1Y = Math.round(annualGrowth * 100 * 10) / 10;
  const pctGrowth3Y = Math.round(((1 + annualGrowth) ** 3 - 1) * 100 * 10) / 10;

  // Compute composite growth score using the specified formula
  const growthScore = Math.round(
    computeGrowthScore(
      pctGrowth1Y,
      techScore,
      metroDistance,
      demand.demandScore,
    ),
  );

  let classification: "High Growth" | "Emerging" | "Saturated";
  let classificationColor: string;
  if (growthScore > 70) {
    classification = "High Growth";
    classificationColor = "#22c55e";
  } else if (growthScore >= 40) {
    classification = "Emerging";
    classificationColor = "#eab308";
  } else {
    classification = "Saturated";
    classificationColor = "#ef4444";
  }

  return {
    currentPrice,
    oneYearPrice,
    threeYearPrice,
    pctGrowth1Y,
    pctGrowth3Y,
    classification,
    classificationColor,
    growthScore,
    growthDriver: getGrowthDriver(techScore, metroDistance, annualGrowth),
  };
}
