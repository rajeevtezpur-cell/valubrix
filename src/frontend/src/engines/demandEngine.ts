// demandEngine.ts — Demand factor computation
// Based on tech park proximity, transaction volume signals, and price trend.

import { getRawTechScore } from "./infraEngine";

export interface DemandOutput {
  demandFactor: number; // multiplier 0.95 – 1.10
  demandScore: number; // 0–100 for UI display
  techProximityScore: number;
  transactionVolumeScore: number;
  priceTrendScore: number;
}

// Locality-level demand signals (deterministic, based on known market data)
const LOCALITY_DEMAND: Record<
  string,
  { transactionVolume: number; priceTrend: number }
> = {
  whitefield: { transactionVolume: 0.9, priceTrend: 0.85 },
  "sarjapur road": { transactionVolume: 0.88, priceTrend: 0.9 },
  "electronic city": { transactionVolume: 0.85, priceTrend: 0.8 },
  hebbal: { transactionVolume: 0.8, priceTrend: 0.82 },
  "manyata tech park": { transactionVolume: 0.9, priceTrend: 0.88 },
  nagawara: { transactionVolume: 0.82, priceTrend: 0.85 },
  devanahalli: { transactionVolume: 0.75, priceTrend: 0.92 },
  yelahanka: { transactionVolume: 0.72, priceTrend: 0.88 },
  hsr: { transactionVolume: 0.85, priceTrend: 0.82 },
  bellandur: { transactionVolume: 0.87, priceTrend: 0.85 },
  indiranagar: { transactionVolume: 0.75, priceTrend: 0.78 },
  koramangala: { transactionVolume: 0.78, priceTrend: 0.75 },
  jayanagar: { transactionVolume: 0.7, priceTrend: 0.72 },
  "bannerghatta road": { transactionVolume: 0.72, priceTrend: 0.78 },
  "jp nagar": { transactionVolume: 0.72, priceTrend: 0.75 },
  marathahalli: { transactionVolume: 0.83, priceTrend: 0.82 },
  "kr puram": { transactionVolume: 0.78, priceTrend: 0.82 },
  thanisandra: { transactionVolume: 0.82, priceTrend: 0.9 },
  "hennur road": { transactionVolume: 0.8, priceTrend: 0.88 },
  default: { transactionVolume: 0.65, priceTrend: 0.7 },
};

function getLocalityDemandSignals(locality: string): {
  transactionVolume: number;
  priceTrend: number;
} {
  const key = locality.toLowerCase().trim();
  for (const [k, v] of Object.entries(LOCALITY_DEMAND)) {
    if (key.includes(k)) return v;
  }
  return LOCALITY_DEMAND.default;
}

/**
 * Computes demand factor and score for a given location.
 */
export function getDemandOutput(
  lat: number,
  lng: number,
  locality = "",
): DemandOutput {
  const techProximityScore = getRawTechScore(lat, lng); // 0–1
  const signals = getLocalityDemandSignals(locality);
  const transactionVolumeScore = signals.transactionVolume;
  const priceTrendScore = signals.priceTrend;

  // Weighted demand score 0–1
  const rawDemand =
    techProximityScore * 0.5 +
    transactionVolumeScore * 0.3 +
    priceTrendScore * 0.2;

  // Scale to multiplier range 0.95–1.10
  const demandFactor = 0.95 + rawDemand * 0.15;

  return {
    demandFactor: Math.min(Math.max(demandFactor, 0.95), 1.1),
    demandScore: Math.round(rawDemand * 100),
    techProximityScore: Math.round(techProximityScore * 100),
    transactionVolumeScore: Math.round(transactionVolumeScore * 100),
    priceTrendScore: Math.round(priceTrendScore * 100),
  };
}
