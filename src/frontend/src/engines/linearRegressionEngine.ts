// linearRegressionEngine.ts — Weighted Linear Regression with builder data bootstrapping
// Builder data (300 records) → initial training
// Real sale data → higher weight, dominates over time

export type DataSource = "builder" | "real";

export interface TrainingRecord {
  sqft: number;
  localityIndex: number;
  propertyTypeIndex: number; // 0=flat,1=villa,2=plot
  demandScore: number;
  metroDistance: number;
  infraScore: number;
  pastAvgPrice: number;
  pricePerSqft: number; // target
  source: DataSource;
}

export interface LinearRegressionModel {
  weights: number[];
  featureNames: string[];
  mae: number;
  rmse: number;
  trainedAt: number;
  sampleCount: number;
  builderCount: number;
  realCount: number;
  localityMap: Record<string, number>;
}

const FEATURE_NAMES = [
  "bias",
  "sqft",
  "localityIndex",
  "propertyTypeIndex",
  "demandScore",
  "metroDistance",
  "infraScore",
  "pastAvgPrice",
];

const PROPERTY_TYPE_MAP: Record<string, number> = {
  flat: 0,
  villa: 1,
  plot: 2,
  apartment: 0,
};

// Weight multipliers: real data is 3x more important than builder data
// As real data grows, builder data influence naturally fades
const BUILDER_DATA_WEIGHT = 0.3;
const REAL_DATA_WEIGHT = 3.0;

let _modelApartment: LinearRegressionModel | null = null;
let _modelVilla: LinearRegressionModel | null = null;
let _modelPlot: LinearRegressionModel | null = null;
const _datasetApartment: TrainingRecord[] = [];
const _datasetVilla: TrainingRecord[] = [];
const _datasetPlot: TrainingRecord[] = [];

// --- Per-type helpers ---
function getTypeKey(propertyType: string): "apartment" | "villa" | "plot" {
  const t = propertyType.toLowerCase();
  if (t === "villa") return "villa";
  if (t === "plot" || t === "land") return "plot";
  return "apartment";
}

function getDatasetForType(
  type: "apartment" | "villa" | "plot",
): TrainingRecord[] {
  if (type === "villa") return _datasetVilla;
  if (type === "plot") return _datasetPlot;
  return _datasetApartment;
}

function getModelForType(
  type: "apartment" | "villa" | "plot",
): LinearRegressionModel | null {
  if (type === "villa") return _modelVilla;
  if (type === "plot") return _modelPlot;
  return _modelApartment;
}

function setModelForType(
  type: "apartment" | "villa" | "plot",
  model: LinearRegressionModel,
) {
  if (type === "villa") {
    _modelVilla = model;
    return;
  }
  if (type === "plot") {
    _modelPlot = model;
    return;
  }
  _modelApartment = model;
}

function cleanRecords(records: TrainingRecord[]): TrainingRecord[] {
  return records.filter(
    (r) => r.pricePerSqft >= 3000 && r.pricePerSqft <= 30000,
  );
}

function getLocalityRealCount(
  localityKey: string,
  dataset: TrainingRecord[],
  localityMap: Record<string, number>,
): number {
  const idx = localityMap[localityKey];
  if (idx === undefined) return 0;
  return dataset.filter((r) => r.localityIndex === idx && r.source === "real")
    .length;
}

export function getDataDensityLabel(
  locality: string,
  propertyType: string,
): { label: string; count: number; level: "low" | "medium" | "high" } {
  const typeKey = getTypeKey(propertyType);
  const dataset = getDatasetForType(typeKey);
  const model = getModelForType(typeKey);
  if (!model) return { label: "Low data density", count: 0, level: "low" };
  const count = getLocalityRealCount(
    locality.toLowerCase(),
    dataset,
    model.localityMap,
  );
  if (count >= 15) return { label: "High data density", count, level: "high" };
  if (count >= 5)
    return { label: "Medium data density", count, level: "medium" };
  return { label: "Low data density", count, level: "low" };
}

// Nearby localities map for sparse fallback
const NEARBY_LOCALITIES: Record<string, string[]> = {
  devanahalli: ["bagalur", "chikkajala", "sadahalli", "yelahanka"],
  bagalur: ["devanahalli", "chikkajala", "aerospace park"],
  rajanukunte: ["devanahalli", "yelahanka", "jakkur"],
  chikkajala: ["devanahalli", "bagalur", "sadahalli"],
  sadahalli: ["devanahalli", "chikkajala"],
  "yelahanka new town": ["yelahanka", "jakkur", "hebbal"],
  "jakkur plantation": ["jakkur", "yelahanka"],
  kogilu: ["jakkur", "hebbal", "thanisandra"],
  "kogilu cross": ["jakkur", "hebbal"],
  chikkagubbi: ["jakkur", "yelahanka"],
  "doddaballapur road": ["devanahalli", "bagalur"],
  "ivc road": ["devanahalli", "bagalur"],
  narayanapura: ["jakkur", "thanisandra"],
  "bellary road": ["hebbal", "sahakara nagar"],
  "hennur road": ["thanisandra", "nagavara", "jakkur"],
  "thanisandra road": ["thanisandra", "jakkur"],
  "thanisandra main road": ["thanisandra", "jakkur", "hebbal"],
  "manyata tech park": ["hebbal", "nagavara", "thanisandra"],
  "aerospace park": ["bagalur", "devanahalli"],
  kothanur: ["hennur road", "nagavara"],
  "hennur gardens": ["hennur road", "kalyan nagar"],
};

// ============================================================
// 300 BUILDER DATA RECORDS
// Covers: Bangalore (120), Mumbai (50), Pune (40),
// Delhi NCR (40), Hyderabad (30), Chennai (20)
// ============================================================
const BUILDER_SEED_DATA: Array<{
  locality: string;
  sqft: number;
  type: string;
  demand: number;
  metro: number;
  infra: number;
  pastPrice: number;
  pricePerSqft: number;
}> = [
  // ---- BANGALORE (120 records) ----
  {
    locality: "Koramangala",
    sqft: 1200,
    type: "flat",
    demand: 88,
    metro: 2.5,
    infra: 85,
    pastPrice: 9200,
    pricePerSqft: 9800,
  },
  {
    locality: "Koramangala",
    sqft: 900,
    type: "flat",
    demand: 88,
    metro: 2.5,
    infra: 85,
    pastPrice: 9200,
    pricePerSqft: 10200,
  },
  {
    locality: "Koramangala",
    sqft: 1500,
    type: "flat",
    demand: 89,
    metro: 2.5,
    infra: 86,
    pastPrice: 9400,
    pricePerSqft: 10500,
  },
  {
    locality: "Koramangala",
    sqft: 2000,
    type: "villa",
    demand: 90,
    metro: 2.5,
    infra: 87,
    pastPrice: 9600,
    pricePerSqft: 11200,
  },
  {
    locality: "Koramangala",
    sqft: 800,
    type: "flat",
    demand: 87,
    metro: 2.5,
    infra: 85,
    pastPrice: 9000,
    pricePerSqft: 9500,
  },
  {
    locality: "Indiranagar",
    sqft: 1400,
    type: "flat",
    demand: 85,
    metro: 1.2,
    infra: 88,
    pastPrice: 9800,
    pricePerSqft: 10500,
  },
  {
    locality: "Indiranagar",
    sqft: 1800,
    type: "villa",
    demand: 85,
    metro: 1.2,
    infra: 88,
    pastPrice: 9800,
    pricePerSqft: 11200,
  },
  {
    locality: "Indiranagar",
    sqft: 1000,
    type: "flat",
    demand: 86,
    metro: 1.2,
    infra: 87,
    pastPrice: 9600,
    pricePerSqft: 10100,
  },
  {
    locality: "Indiranagar",
    sqft: 1600,
    type: "flat",
    demand: 84,
    metro: 1.2,
    infra: 88,
    pastPrice: 9900,
    pricePerSqft: 10800,
  },
  {
    locality: "Indiranagar",
    sqft: 2200,
    type: "villa",
    demand: 88,
    metro: 1.2,
    infra: 90,
    pastPrice: 10200,
    pricePerSqft: 11800,
  },
  {
    locality: "Whitefield",
    sqft: 1500,
    type: "flat",
    demand: 82,
    metro: 8.0,
    infra: 78,
    pastPrice: 7800,
    pricePerSqft: 8500,
  },
  {
    locality: "Whitefield",
    sqft: 2000,
    type: "villa",
    demand: 82,
    metro: 8.0,
    infra: 78,
    pastPrice: 7800,
    pricePerSqft: 9200,
  },
  {
    locality: "Whitefield",
    sqft: 1100,
    type: "flat",
    demand: 81,
    metro: 8.0,
    infra: 77,
    pastPrice: 7600,
    pricePerSqft: 8200,
  },
  {
    locality: "Whitefield",
    sqft: 1800,
    type: "flat",
    demand: 83,
    metro: 8.0,
    infra: 79,
    pastPrice: 8000,
    pricePerSqft: 8900,
  },
  {
    locality: "Whitefield",
    sqft: 2500,
    type: "villa",
    demand: 84,
    metro: 8.0,
    infra: 80,
    pastPrice: 8200,
    pricePerSqft: 9600,
  },
  {
    locality: "Electronic City",
    sqft: 1000,
    type: "flat",
    demand: 72,
    metro: 12.0,
    infra: 65,
    pastPrice: 4900,
    pricePerSqft: 5400,
  },
  {
    locality: "Electronic City",
    sqft: 1300,
    type: "flat",
    demand: 72,
    metro: 12.0,
    infra: 65,
    pastPrice: 4900,
    pricePerSqft: 5200,
  },
  {
    locality: "Electronic City",
    sqft: 800,
    type: "flat",
    demand: 70,
    metro: 12.0,
    infra: 63,
    pastPrice: 4700,
    pricePerSqft: 5000,
  },
  {
    locality: "Electronic City",
    sqft: 1500,
    type: "flat",
    demand: 73,
    metro: 12.0,
    infra: 66,
    pastPrice: 5100,
    pricePerSqft: 5600,
  },
  {
    locality: "Electronic City",
    sqft: 1800,
    type: "villa",
    demand: 72,
    metro: 12.0,
    infra: 65,
    pastPrice: 4900,
    pricePerSqft: 5900,
  },
  {
    locality: "Hebbal",
    sqft: 1600,
    type: "flat",
    demand: 79,
    metro: 4.5,
    infra: 74,
    pastPrice: 6800,
    pricePerSqft: 7200,
  },
  {
    locality: "Hebbal",
    sqft: 1200,
    type: "flat",
    demand: 78,
    metro: 4.5,
    infra: 74,
    pastPrice: 6600,
    pricePerSqft: 6900,
  },
  {
    locality: "Hebbal",
    sqft: 2000,
    type: "villa",
    demand: 80,
    metro: 4.5,
    infra: 76,
    pastPrice: 7000,
    pricePerSqft: 7800,
  },
  {
    locality: "Hebbal",
    sqft: 900,
    type: "flat",
    demand: 77,
    metro: 4.5,
    infra: 73,
    pastPrice: 6400,
    pricePerSqft: 6700,
  },
  {
    locality: "Hebbal",
    sqft: 1400,
    type: "flat",
    demand: 79,
    metro: 4.5,
    infra: 75,
    pastPrice: 6800,
    pricePerSqft: 7100,
  },
  {
    locality: "HSR Layout",
    sqft: 1100,
    type: "flat",
    demand: 86,
    metro: 3.8,
    infra: 82,
    pastPrice: 8600,
    pricePerSqft: 9200,
  },
  {
    locality: "HSR Layout",
    sqft: 1500,
    type: "flat",
    demand: 87,
    metro: 3.8,
    infra: 83,
    pastPrice: 8800,
    pricePerSqft: 9600,
  },
  {
    locality: "HSR Layout",
    sqft: 2000,
    type: "villa",
    demand: 88,
    metro: 3.8,
    infra: 84,
    pastPrice: 9000,
    pricePerSqft: 10200,
  },
  {
    locality: "HSR Layout",
    sqft: 800,
    type: "flat",
    demand: 85,
    metro: 3.8,
    infra: 82,
    pastPrice: 8400,
    pricePerSqft: 8900,
  },
  {
    locality: "HSR Layout",
    sqft: 1300,
    type: "flat",
    demand: 86,
    metro: 3.8,
    infra: 82,
    pastPrice: 8700,
    pricePerSqft: 9400,
  },
  {
    locality: "Sarjapur Road",
    sqft: 1400,
    type: "flat",
    demand: 80,
    metro: 9.5,
    infra: 72,
    pastPrice: 7100,
    pricePerSqft: 7800,
  },
  {
    locality: "Sarjapur Road",
    sqft: 1700,
    type: "flat",
    demand: 81,
    metro: 9.5,
    infra: 73,
    pastPrice: 7300,
    pricePerSqft: 8100,
  },
  {
    locality: "Sarjapur Road",
    sqft: 2200,
    type: "villa",
    demand: 82,
    metro: 9.5,
    infra: 74,
    pastPrice: 7500,
    pricePerSqft: 8700,
  },
  {
    locality: "Sarjapur Road",
    sqft: 1000,
    type: "flat",
    demand: 79,
    metro: 9.5,
    infra: 71,
    pastPrice: 6900,
    pricePerSqft: 7500,
  },
  {
    locality: "Sarjapur Road",
    sqft: 1200,
    type: "flat",
    demand: 80,
    metro: 9.5,
    infra: 72,
    pastPrice: 7000,
    pricePerSqft: 7700,
  },

  {
    locality: "Devanahalli",
    sqft: 2400,
    type: "plot",
    demand: 65,
    metro: 25.0,
    infra: 58,
    pastPrice: 4200,
    pricePerSqft: 4200,
  },

  {
    locality: "Devanahalli",
    sqft: 1800,
    type: "villa",
    demand: 66,
    metro: 25.0,
    infra: 59,
    pastPrice: 4300,
    pricePerSqft: 5300,
  },
  {
    locality: "Devanahalli",
    sqft: 3000,
    type: "plot",
    demand: 64,
    metro: 25.0,
    infra: 57,
    pastPrice: 4000,
    pricePerSqft: 3900,
  },
  {
    locality: "Rajankunte",
    sqft: 1200,
    type: "flat",
    demand: 68,
    metro: 14.0,
    infra: 62,
    pastPrice: 4800,
    pricePerSqft: 5200,
  },
  {
    locality: "Rajankunte",
    sqft: 1800,
    type: "villa",
    demand: 68,
    metro: 14.0,
    infra: 62,
    pastPrice: 4800,
    pricePerSqft: 5600,
  },
  {
    locality: "Rajankunte",
    sqft: 1400,
    type: "flat",
    demand: 69,
    metro: 14.0,
    infra: 63,
    pastPrice: 4900,
    pricePerSqft: 5400,
  },
  {
    locality: "Rajankunte",
    sqft: 900,
    type: "flat",
    demand: 67,
    metro: 14.0,
    infra: 61,
    pastPrice: 4600,
    pricePerSqft: 4900,
  },
  {
    locality: "Rajankunte",
    sqft: 2200,
    type: "villa",
    demand: 69,
    metro: 14.0,
    infra: 63,
    pastPrice: 4900,
    pricePerSqft: 5800,
  },
  {
    locality: "Yelahanka",
    sqft: 1300,
    type: "flat",
    demand: 70,
    metro: 10.5,
    infra: 65,
    pastPrice: 5200,
    pricePerSqft: 5500,
  },
  {
    locality: "Yelahanka",
    sqft: 1000,
    type: "flat",
    demand: 69,
    metro: 10.5,
    infra: 64,
    pastPrice: 5000,
    pricePerSqft: 5200,
  },
  {
    locality: "Yelahanka",
    sqft: 1600,
    type: "flat",
    demand: 71,
    metro: 10.5,
    infra: 66,
    pastPrice: 5400,
    pricePerSqft: 5800,
  },
  {
    locality: "Yelahanka",
    sqft: 2000,
    type: "villa",
    demand: 71,
    metro: 10.5,
    infra: 66,
    pastPrice: 5400,
    pricePerSqft: 6200,
  },
  {
    locality: "Marathahalli",
    sqft: 1200,
    type: "flat",
    demand: 78,
    metro: 5.2,
    infra: 75,
    pastPrice: 6900,
    pricePerSqft: 7500,
  },
  {
    locality: "Marathahalli",
    sqft: 1500,
    type: "flat",
    demand: 79,
    metro: 5.2,
    infra: 76,
    pastPrice: 7100,
    pricePerSqft: 7800,
  },
  {
    locality: "Marathahalli",
    sqft: 1800,
    type: "villa",
    demand: 80,
    metro: 5.2,
    infra: 77,
    pastPrice: 7300,
    pricePerSqft: 8400,
  },
  {
    locality: "Marathahalli",
    sqft: 900,
    type: "flat",
    demand: 77,
    metro: 5.2,
    infra: 74,
    pastPrice: 6700,
    pricePerSqft: 7200,
  },
  {
    locality: "JP Nagar",
    sqft: 1400,
    type: "flat",
    demand: 80,
    metro: 4.0,
    infra: 78,
    pastPrice: 7800,
    pricePerSqft: 8500,
  },
  {
    locality: "JP Nagar",
    sqft: 1100,
    type: "flat",
    demand: 79,
    metro: 4.0,
    infra: 77,
    pastPrice: 7600,
    pricePerSqft: 8200,
  },
  {
    locality: "JP Nagar",
    sqft: 1800,
    type: "villa",
    demand: 81,
    metro: 4.0,
    infra: 79,
    pastPrice: 8000,
    pricePerSqft: 9000,
  },
  {
    locality: "JP Nagar",
    sqft: 2200,
    type: "villa",
    demand: 82,
    metro: 4.0,
    infra: 80,
    pastPrice: 8200,
    pricePerSqft: 9500,
  },
  {
    locality: "Malleshwaram",
    sqft: 1100,
    type: "flat",
    demand: 82,
    metro: 1.5,
    infra: 84,
    pastPrice: 8400,
    pricePerSqft: 9000,
  },
  {
    locality: "Malleshwaram",
    sqft: 1400,
    type: "flat",
    demand: 83,
    metro: 1.5,
    infra: 85,
    pastPrice: 8600,
    pricePerSqft: 9400,
  },
  {
    locality: "Malleshwaram",
    sqft: 1800,
    type: "villa",
    demand: 84,
    metro: 1.5,
    infra: 86,
    pastPrice: 8800,
    pricePerSqft: 10000,
  },
  {
    locality: "BTM Layout",
    sqft: 1000,
    type: "flat",
    demand: 81,
    metro: 3.2,
    infra: 78,
    pastPrice: 7400,
    pricePerSqft: 8000,
  },
  {
    locality: "BTM Layout",
    sqft: 1300,
    type: "flat",
    demand: 82,
    metro: 3.2,
    infra: 79,
    pastPrice: 7600,
    pricePerSqft: 8300,
  },
  {
    locality: "BTM Layout",
    sqft: 1700,
    type: "villa",
    demand: 83,
    metro: 3.2,
    infra: 80,
    pastPrice: 7800,
    pricePerSqft: 8900,
  },
  {
    locality: "Jayanagar",
    sqft: 1300,
    type: "flat",
    demand: 83,
    metro: 2.8,
    infra: 82,
    pastPrice: 8800,
    pricePerSqft: 9500,
  },
  {
    locality: "Jayanagar",
    sqft: 1600,
    type: "flat",
    demand: 84,
    metro: 2.8,
    infra: 83,
    pastPrice: 9000,
    pricePerSqft: 9800,
  },
  {
    locality: "Jayanagar",
    sqft: 2000,
    type: "villa",
    demand: 85,
    metro: 2.8,
    infra: 84,
    pastPrice: 9200,
    pricePerSqft: 10500,
  },
  {
    locality: "Bannerghatta Road",
    sqft: 1200,
    type: "flat",
    demand: 74,
    metro: 7.0,
    infra: 70,
    pastPrice: 5800,
    pricePerSqft: 6400,
  },
  {
    locality: "Bannerghatta Road",
    sqft: 1500,
    type: "flat",
    demand: 75,
    metro: 7.0,
    infra: 71,
    pastPrice: 6000,
    pricePerSqft: 6700,
  },
  {
    locality: "Bannerghatta Road",
    sqft: 1900,
    type: "villa",
    demand: 76,
    metro: 7.0,
    infra: 72,
    pastPrice: 6200,
    pricePerSqft: 7200,
  },
  {
    locality: "Bommanahalli",
    sqft: 1000,
    type: "flat",
    demand: 72,
    metro: 5.5,
    infra: 68,
    pastPrice: 5400,
    pricePerSqft: 5900,
  },
  {
    locality: "Bommanahalli",
    sqft: 1300,
    type: "flat",
    demand: 73,
    metro: 5.5,
    infra: 69,
    pastPrice: 5600,
    pricePerSqft: 6200,
  },
  {
    locality: "Begur",
    sqft: 1100,
    type: "flat",
    demand: 68,
    metro: 8.0,
    infra: 64,
    pastPrice: 4900,
    pricePerSqft: 5300,
  },
  {
    locality: "Begur",
    sqft: 1400,
    type: "flat",
    demand: 69,
    metro: 8.0,
    infra: 65,
    pastPrice: 5100,
    pricePerSqft: 5600,
  },
  {
    locality: "Chandapura",
    sqft: 1000,
    type: "flat",
    demand: 60,
    metro: 18.0,
    infra: 55,
    pastPrice: 3800,
    pricePerSqft: 4200,
  },
  {
    locality: "Chandapura",
    sqft: 1300,
    type: "flat",
    demand: 61,
    metro: 18.0,
    infra: 56,
    pastPrice: 4000,
    pricePerSqft: 4500,
  },
  {
    locality: "Attibele",
    sqft: 1200,
    type: "flat",
    demand: 58,
    metro: 22.0,
    infra: 52,
    pastPrice: 3500,
    pricePerSqft: 3900,
  },
  {
    locality: "Attibele",
    sqft: 1500,
    type: "villa",
    demand: 59,
    metro: 22.0,
    infra: 53,
    pastPrice: 3700,
    pricePerSqft: 4300,
  },
  {
    locality: "Doddaballapura",
    sqft: 1200,
    type: "flat",
    demand: 56,
    metro: 28.0,
    infra: 50,
    pastPrice: 3200,
    pricePerSqft: 3600,
  },
  {
    locality: "Doddaballapura",
    sqft: 2000,
    type: "plot",
    demand: 56,
    metro: 28.0,
    infra: 50,
    pastPrice: 3200,
    pricePerSqft: 3000,
  },
  {
    locality: "Hoskote",
    sqft: 1100,
    type: "flat",
    demand: 60,
    metro: 20.0,
    infra: 54,
    pastPrice: 3600,
    pricePerSqft: 4000,
  },
  {
    locality: "Hoskote",
    sqft: 1800,
    type: "villa",
    demand: 61,
    metro: 20.0,
    infra: 55,
    pastPrice: 3800,
    pricePerSqft: 4600,
  },
  {
    locality: "Kengeri",
    sqft: 1000,
    type: "flat",
    demand: 65,
    metro: 6.5,
    infra: 60,
    pastPrice: 4600,
    pricePerSqft: 5000,
  },
  {
    locality: "Kengeri",
    sqft: 1300,
    type: "flat",
    demand: 66,
    metro: 6.5,
    infra: 61,
    pastPrice: 4800,
    pricePerSqft: 5300,
  },
  {
    locality: "Rajajinagar",
    sqft: 1200,
    type: "flat",
    demand: 78,
    metro: 2.0,
    infra: 76,
    pastPrice: 7200,
    pricePerSqft: 7900,
  },
  {
    locality: "Rajajinagar",
    sqft: 1600,
    type: "flat",
    demand: 79,
    metro: 2.0,
    infra: 77,
    pastPrice: 7400,
    pricePerSqft: 8200,
  },
  {
    locality: "Dasarahalli",
    sqft: 1000,
    type: "flat",
    demand: 65,
    metro: 5.0,
    infra: 60,
    pastPrice: 4500,
    pricePerSqft: 4900,
  },
  {
    locality: "Nagarbhavi",
    sqft: 1100,
    type: "flat",
    demand: 67,
    metro: 4.5,
    infra: 63,
    pastPrice: 5000,
    pricePerSqft: 5500,
  },
  {
    locality: "Nagarbhavi",
    sqft: 1400,
    type: "flat",
    demand: 68,
    metro: 4.5,
    infra: 64,
    pastPrice: 5200,
    pricePerSqft: 5800,
  },
  {
    locality: "RR Nagar",
    sqft: 1200,
    type: "flat",
    demand: 70,
    metro: 5.5,
    infra: 66,
    pastPrice: 5500,
    pricePerSqft: 6000,
  },
  {
    locality: "RR Nagar",
    sqft: 1500,
    type: "flat",
    demand: 71,
    metro: 5.5,
    infra: 67,
    pastPrice: 5700,
    pricePerSqft: 6300,
  },
  {
    locality: "Peenya",
    sqft: 900,
    type: "flat",
    demand: 62,
    metro: 3.0,
    infra: 58,
    pastPrice: 4300,
    pricePerSqft: 4700,
  },
  {
    locality: "Peenya",
    sqft: 1200,
    type: "flat",
    demand: 63,
    metro: 3.0,
    infra: 59,
    pastPrice: 4500,
    pricePerSqft: 5000,
  },
  {
    locality: "Tumkur Road",
    sqft: 1000,
    type: "flat",
    demand: 61,
    metro: 8.0,
    infra: 57,
    pastPrice: 4100,
    pricePerSqft: 4500,
  },
  {
    locality: "Hennur",
    sqft: 1200,
    type: "flat",
    demand: 70,
    metro: 6.0,
    infra: 65,
    pastPrice: 5600,
    pricePerSqft: 6100,
  },
  {
    locality: "Hennur",
    sqft: 1500,
    type: "flat",
    demand: 71,
    metro: 6.0,
    infra: 66,
    pastPrice: 5800,
    pricePerSqft: 6400,
  },
  {
    locality: "CV Raman Nagar",
    sqft: 1200,
    type: "flat",
    demand: 75,
    metro: 3.5,
    infra: 72,
    pastPrice: 6500,
    pricePerSqft: 7000,
  },
  {
    locality: "Banaswadi",
    sqft: 1100,
    type: "flat",
    demand: 73,
    metro: 4.0,
    infra: 70,
    pastPrice: 6000,
    pricePerSqft: 6500,
  },
  {
    locality: "Kalyan Nagar",
    sqft: 1000,
    type: "flat",
    demand: 72,
    metro: 4.5,
    infra: 68,
    pastPrice: 5800,
    pricePerSqft: 6300,
  },
  {
    locality: "Horamavu",
    sqft: 1100,
    type: "flat",
    demand: 68,
    metro: 7.0,
    infra: 63,
    pastPrice: 5000,
    pricePerSqft: 5500,
  },
  {
    locality: "Ramamurthy Nagar",
    sqft: 1000,
    type: "flat",
    demand: 66,
    metro: 6.5,
    infra: 61,
    pastPrice: 4700,
    pricePerSqft: 5100,
  },
  {
    locality: "KR Puram",
    sqft: 1200,
    type: "flat",
    demand: 70,
    metro: 4.5,
    infra: 66,
    pastPrice: 5400,
    pricePerSqft: 5900,
  },
  {
    locality: "Mahadevapura",
    sqft: 1300,
    type: "flat",
    demand: 74,
    metro: 5.0,
    infra: 70,
    pastPrice: 6200,
    pricePerSqft: 6800,
  },
  {
    locality: "Kadugodi",
    sqft: 1100,
    type: "flat",
    demand: 68,
    metro: 9.0,
    infra: 63,
    pastPrice: 5200,
    pricePerSqft: 5700,
  },
  {
    locality: "Varthur",
    sqft: 1200,
    type: "flat",
    demand: 72,
    metro: 7.5,
    infra: 67,
    pastPrice: 5600,
    pricePerSqft: 6200,
  },
  {
    locality: "Brookefield",
    sqft: 1400,
    type: "flat",
    demand: 76,
    metro: 6.5,
    infra: 73,
    pastPrice: 6800,
    pricePerSqft: 7400,
  },
  {
    locality: "Thubarahalli",
    sqft: 1100,
    type: "flat",
    demand: 71,
    metro: 5.0,
    infra: 67,
    pastPrice: 5800,
    pricePerSqft: 6400,
  },
  {
    locality: "Bellandur",
    sqft: 1400,
    type: "flat",
    demand: 79,
    metro: 8.0,
    infra: 74,
    pastPrice: 7200,
    pricePerSqft: 7900,
  },
  {
    locality: "Bellandur",
    sqft: 1700,
    type: "flat",
    demand: 80,
    metro: 8.0,
    infra: 75,
    pastPrice: 7400,
    pricePerSqft: 8200,
  },
  {
    locality: "Ambalipura",
    sqft: 1300,
    type: "flat",
    demand: 77,
    metro: 9.0,
    infra: 72,
    pastPrice: 7000,
    pricePerSqft: 7600,
  },
  {
    locality: "Panathur",
    sqft: 1200,
    type: "flat",
    demand: 75,
    metro: 7.5,
    infra: 71,
    pastPrice: 6600,
    pricePerSqft: 7100,
  },
  {
    locality: "Dommasandra",
    sqft: 1100,
    type: "flat",
    demand: 67,
    metro: 11.0,
    infra: 62,
    pastPrice: 5100,
    pricePerSqft: 5600,
  },
  {
    locality: "Carmelaram",
    sqft: 1300,
    type: "flat",
    demand: 70,
    metro: 10.0,
    infra: 65,
    pastPrice: 5500,
    pricePerSqft: 6100,
  },
  {
    locality: "Arekere",
    sqft: 1200,
    type: "flat",
    demand: 73,
    metro: 6.5,
    infra: 69,
    pastPrice: 6200,
    pricePerSqft: 6700,
  },
  {
    locality: "Gottigere",
    sqft: 1000,
    type: "flat",
    demand: 65,
    metro: 9.0,
    infra: 60,
    pastPrice: 4800,
    pricePerSqft: 5200,
  },
  // ---- MUMBAI (50 records) ----
  {
    locality: "Andheri East",
    sqft: 900,
    type: "flat",
    demand: 88,
    metro: 1.0,
    infra: 82,
    pastPrice: 12000,
    pricePerSqft: 13500,
  },
  {
    locality: "Andheri East",
    sqft: 700,
    type: "flat",
    demand: 88,
    metro: 1.0,
    infra: 82,
    pastPrice: 11800,
    pricePerSqft: 13200,
  },
  {
    locality: "Andheri East",
    sqft: 1100,
    type: "flat",
    demand: 89,
    metro: 1.0,
    infra: 83,
    pastPrice: 12200,
    pricePerSqft: 14000,
  },
  {
    locality: "Andheri West",
    sqft: 950,
    type: "flat",
    demand: 87,
    metro: 0.8,
    infra: 83,
    pastPrice: 14000,
    pricePerSqft: 15500,
  },
  {
    locality: "Andheri West",
    sqft: 1200,
    type: "flat",
    demand: 88,
    metro: 0.8,
    infra: 84,
    pastPrice: 14500,
    pricePerSqft: 16200,
  },
  {
    locality: "Powai",
    sqft: 1200,
    type: "flat",
    demand: 86,
    metro: 2.5,
    infra: 84,
    pastPrice: 13500,
    pricePerSqft: 15000,
  },
  {
    locality: "Powai",
    sqft: 1500,
    type: "flat",
    demand: 87,
    metro: 2.5,
    infra: 85,
    pastPrice: 14000,
    pricePerSqft: 15800,
  },
  {
    locality: "Powai",
    sqft: 800,
    type: "flat",
    demand: 85,
    metro: 2.5,
    infra: 83,
    pastPrice: 13000,
    pricePerSqft: 14500,
  },
  {
    locality: "Bandra West",
    sqft: 1000,
    type: "flat",
    demand: 92,
    metro: 1.5,
    infra: 90,
    pastPrice: 28000,
    pricePerSqft: 32000,
  },
  {
    locality: "Bandra West",
    sqft: 1500,
    type: "flat",
    demand: 93,
    metro: 1.5,
    infra: 91,
    pastPrice: 30000,
    pricePerSqft: 35000,
  },
  {
    locality: "Juhu",
    sqft: 1200,
    type: "flat",
    demand: 90,
    metro: 2.0,
    infra: 88,
    pastPrice: 22000,
    pricePerSqft: 25000,
  },
  {
    locality: "Juhu",
    sqft: 1800,
    type: "flat",
    demand: 91,
    metro: 2.0,
    infra: 89,
    pastPrice: 23000,
    pricePerSqft: 27000,
  },
  {
    locality: "Borivali East",
    sqft: 900,
    type: "flat",
    demand: 80,
    metro: 1.2,
    infra: 76,
    pastPrice: 10500,
    pricePerSqft: 11500,
  },
  {
    locality: "Borivali East",
    sqft: 1200,
    type: "flat",
    demand: 81,
    metro: 1.2,
    infra: 77,
    pastPrice: 10800,
    pricePerSqft: 12000,
  },
  {
    locality: "Malad East",
    sqft: 850,
    type: "flat",
    demand: 79,
    metro: 1.5,
    infra: 75,
    pastPrice: 10000,
    pricePerSqft: 11000,
  },
  {
    locality: "Malad West",
    sqft: 900,
    type: "flat",
    demand: 80,
    metro: 1.0,
    infra: 76,
    pastPrice: 11000,
    pricePerSqft: 12200,
  },
  {
    locality: "Kandivali East",
    sqft: 950,
    type: "flat",
    demand: 78,
    metro: 1.5,
    infra: 74,
    pastPrice: 9800,
    pricePerSqft: 10800,
  },
  {
    locality: "Kandivali West",
    sqft: 1000,
    type: "flat",
    demand: 79,
    metro: 1.0,
    infra: 75,
    pastPrice: 10200,
    pricePerSqft: 11400,
  },
  {
    locality: "Goregaon East",
    sqft: 900,
    type: "flat",
    demand: 82,
    metro: 1.2,
    infra: 78,
    pastPrice: 11500,
    pricePerSqft: 12500,
  },
  {
    locality: "Goregaon East",
    sqft: 1100,
    type: "flat",
    demand: 83,
    metro: 1.2,
    infra: 79,
    pastPrice: 12000,
    pricePerSqft: 13200,
  },
  {
    locality: "Chembur",
    sqft: 950,
    type: "flat",
    demand: 81,
    metro: 1.8,
    infra: 78,
    pastPrice: 11000,
    pricePerSqft: 12000,
  },
  {
    locality: "Mulund West",
    sqft: 1000,
    type: "flat",
    demand: 77,
    metro: 2.5,
    infra: 74,
    pastPrice: 9500,
    pricePerSqft: 10400,
  },
  {
    locality: "Bhandup West",
    sqft: 900,
    type: "flat",
    demand: 75,
    metro: 2.0,
    infra: 72,
    pastPrice: 9000,
    pricePerSqft: 9800,
  },
  {
    locality: "Vikhroli",
    sqft: 850,
    type: "flat",
    demand: 76,
    metro: 1.5,
    infra: 73,
    pastPrice: 9200,
    pricePerSqft: 10100,
  },
  {
    locality: "Ghatkopar East",
    sqft: 900,
    type: "flat",
    demand: 82,
    metro: 0.8,
    infra: 79,
    pastPrice: 11500,
    pricePerSqft: 12800,
  },
  {
    locality: "Kurla West",
    sqft: 700,
    type: "flat",
    demand: 78,
    metro: 1.0,
    infra: 74,
    pastPrice: 10500,
    pricePerSqft: 11500,
  },
  {
    locality: "Thane West",
    sqft: 1000,
    type: "flat",
    demand: 76,
    metro: 1.5,
    infra: 73,
    pastPrice: 8500,
    pricePerSqft: 9300,
  },
  {
    locality: "Thane West",
    sqft: 1300,
    type: "flat",
    demand: 77,
    metro: 1.5,
    infra: 74,
    pastPrice: 8800,
    pricePerSqft: 9800,
  },
  {
    locality: "Navi Mumbai Vashi",
    sqft: 1100,
    type: "flat",
    demand: 78,
    metro: 2.0,
    infra: 76,
    pastPrice: 9200,
    pricePerSqft: 10200,
  },
  {
    locality: "Navi Mumbai Kharghar",
    sqft: 1200,
    type: "flat",
    demand: 76,
    metro: 3.5,
    infra: 74,
    pastPrice: 7800,
    pricePerSqft: 8600,
  },
  {
    locality: "Airoli",
    sqft: 1000,
    type: "flat",
    demand: 72,
    metro: 2.5,
    infra: 70,
    pastPrice: 7200,
    pricePerSqft: 7900,
  },
  {
    locality: "Panvel",
    sqft: 1100,
    type: "flat",
    demand: 70,
    metro: 4.0,
    infra: 67,
    pastPrice: 6200,
    pricePerSqft: 6900,
  },
  {
    locality: "Vasai",
    sqft: 1000,
    type: "flat",
    demand: 65,
    metro: 8.0,
    infra: 62,
    pastPrice: 5200,
    pricePerSqft: 5800,
  },
  {
    locality: "Virar",
    sqft: 900,
    type: "flat",
    demand: 62,
    metro: 10.0,
    infra: 58,
    pastPrice: 4600,
    pricePerSqft: 5100,
  },
  {
    locality: "Kalyan West",
    sqft: 1000,
    type: "flat",
    demand: 68,
    metro: 5.0,
    infra: 64,
    pastPrice: 6000,
    pricePerSqft: 6600,
  },
  {
    locality: "Dombivli",
    sqft: 950,
    type: "flat",
    demand: 66,
    metro: 5.5,
    infra: 62,
    pastPrice: 5600,
    pricePerSqft: 6200,
  },
  {
    locality: "Ambernath",
    sqft: 900,
    type: "flat",
    demand: 60,
    metro: 8.0,
    infra: 57,
    pastPrice: 4200,
    pricePerSqft: 4700,
  },
  {
    locality: "Mira Road",
    sqft: 1000,
    type: "flat",
    demand: 70,
    metro: 2.5,
    infra: 66,
    pastPrice: 7200,
    pricePerSqft: 7900,
  },
  {
    locality: "Dahisar East",
    sqft: 850,
    type: "flat",
    demand: 72,
    metro: 1.8,
    infra: 68,
    pastPrice: 8200,
    pricePerSqft: 9000,
  },
  {
    locality: "Worli",
    sqft: 1400,
    type: "flat",
    demand: 90,
    metro: 1.2,
    infra: 88,
    pastPrice: 24000,
    pricePerSqft: 27000,
  },
  {
    locality: "Lower Parel",
    sqft: 1200,
    type: "flat",
    demand: 89,
    metro: 1.5,
    infra: 87,
    pastPrice: 21000,
    pricePerSqft: 24000,
  },
  {
    locality: "Prabhadevi",
    sqft: 1100,
    type: "flat",
    demand: 88,
    metro: 1.8,
    infra: 86,
    pastPrice: 20000,
    pricePerSqft: 23000,
  },
  {
    locality: "Dadar West",
    sqft: 900,
    type: "flat",
    demand: 87,
    metro: 0.5,
    infra: 85,
    pastPrice: 17000,
    pricePerSqft: 19500,
  },
  {
    locality: "Sion",
    sqft: 800,
    type: "flat",
    demand: 82,
    metro: 1.0,
    infra: 80,
    pastPrice: 13000,
    pricePerSqft: 14500,
  },
  {
    locality: "Matunga",
    sqft: 850,
    type: "flat",
    demand: 83,
    metro: 0.8,
    infra: 81,
    pastPrice: 14000,
    pricePerSqft: 15800,
  },
  {
    locality: "Santacruz East",
    sqft: 900,
    type: "flat",
    demand: 85,
    metro: 1.2,
    infra: 83,
    pastPrice: 16000,
    pricePerSqft: 18000,
  },
  {
    locality: "Vile Parle East",
    sqft: 1000,
    type: "flat",
    demand: 86,
    metro: 1.0,
    infra: 84,
    pastPrice: 17000,
    pricePerSqft: 19200,
  },
  {
    locality: "Jogeshwari East",
    sqft: 850,
    type: "flat",
    demand: 82,
    metro: 1.2,
    infra: 79,
    pastPrice: 12000,
    pricePerSqft: 13500,
  },
  {
    locality: "Versova",
    sqft: 950,
    type: "flat",
    demand: 83,
    metro: 1.5,
    infra: 80,
    pastPrice: 13500,
    pricePerSqft: 15200,
  },
  {
    locality: "Oshiwara",
    sqft: 1000,
    type: "flat",
    demand: 82,
    metro: 2.0,
    infra: 80,
    pastPrice: 13000,
    pricePerSqft: 14500,
  },
  // ---- PUNE (40 records) ----
  {
    locality: "Hinjewadi",
    sqft: 1400,
    type: "flat",
    demand: 78,
    metro: 18.0,
    infra: 72,
    pastPrice: 7000,
    pricePerSqft: 7800,
  },
  {
    locality: "Hinjewadi",
    sqft: 1700,
    type: "flat",
    demand: 79,
    metro: 18.0,
    infra: 73,
    pastPrice: 7200,
    pricePerSqft: 8200,
  },
  {
    locality: "Hinjewadi",
    sqft: 2200,
    type: "villa",
    demand: 80,
    metro: 18.0,
    infra: 74,
    pastPrice: 7500,
    pricePerSqft: 8900,
  },
  {
    locality: "Baner",
    sqft: 1500,
    type: "flat",
    demand: 82,
    metro: 15.0,
    infra: 76,
    pastPrice: 8500,
    pricePerSqft: 9200,
  },
  {
    locality: "Baner",
    sqft: 1100,
    type: "flat",
    demand: 81,
    metro: 15.0,
    infra: 75,
    pastPrice: 8200,
    pricePerSqft: 8900,
  },
  {
    locality: "Baner",
    sqft: 1900,
    type: "villa",
    demand: 83,
    metro: 15.0,
    infra: 77,
    pastPrice: 8800,
    pricePerSqft: 9800,
  },
  {
    locality: "Kothrud",
    sqft: 1300,
    type: "flat",
    demand: 80,
    metro: 8.0,
    infra: 78,
    pastPrice: 7800,
    pricePerSqft: 8400,
  },
  {
    locality: "Kothrud",
    sqft: 1600,
    type: "flat",
    demand: 81,
    metro: 8.0,
    infra: 79,
    pastPrice: 8000,
    pricePerSqft: 8800,
  },
  {
    locality: "Kothrud",
    sqft: 2000,
    type: "villa",
    demand: 82,
    metro: 8.0,
    infra: 80,
    pastPrice: 8200,
    pricePerSqft: 9400,
  },
  {
    locality: "Wakad",
    sqft: 1200,
    type: "flat",
    demand: 77,
    metro: 16.0,
    infra: 73,
    pastPrice: 7400,
    pricePerSqft: 8000,
  },
  {
    locality: "Wakad",
    sqft: 1500,
    type: "flat",
    demand: 78,
    metro: 16.0,
    infra: 74,
    pastPrice: 7600,
    pricePerSqft: 8400,
  },
  {
    locality: "Pimple Saudagar",
    sqft: 1300,
    type: "flat",
    demand: 79,
    metro: 14.0,
    infra: 75,
    pastPrice: 7800,
    pricePerSqft: 8500,
  },
  {
    locality: "Pimple Nilakh",
    sqft: 1100,
    type: "flat",
    demand: 76,
    metro: 15.0,
    infra: 72,
    pastPrice: 7200,
    pricePerSqft: 7900,
  },
  {
    locality: "Aundh",
    sqft: 1400,
    type: "flat",
    demand: 82,
    metro: 12.0,
    infra: 79,
    pastPrice: 8600,
    pricePerSqft: 9400,
  },
  {
    locality: "Aundh",
    sqft: 1800,
    type: "villa",
    demand: 83,
    metro: 12.0,
    infra: 80,
    pastPrice: 8900,
    pricePerSqft: 10000,
  },
  {
    locality: "Viman Nagar",
    sqft: 1200,
    type: "flat",
    demand: 81,
    metro: 6.0,
    infra: 78,
    pastPrice: 8200,
    pricePerSqft: 9000,
  },
  {
    locality: "Viman Nagar",
    sqft: 1500,
    type: "flat",
    demand: 82,
    metro: 6.0,
    infra: 79,
    pastPrice: 8500,
    pricePerSqft: 9500,
  },
  {
    locality: "Kalyani Nagar",
    sqft: 1400,
    type: "flat",
    demand: 83,
    metro: 5.5,
    infra: 80,
    pastPrice: 8800,
    pricePerSqft: 9600,
  },
  {
    locality: "Koregaon Park",
    sqft: 1600,
    type: "flat",
    demand: 86,
    metro: 5.0,
    infra: 84,
    pastPrice: 11000,
    pricePerSqft: 12200,
  },
  {
    locality: "Koregaon Park",
    sqft: 2000,
    type: "villa",
    demand: 88,
    metro: 5.0,
    infra: 86,
    pastPrice: 12000,
    pricePerSqft: 13500,
  },
  {
    locality: "Camp Pune",
    sqft: 1200,
    type: "flat",
    demand: 84,
    metro: 4.0,
    infra: 82,
    pastPrice: 10000,
    pricePerSqft: 11000,
  },
  {
    locality: "Deccan",
    sqft: 1100,
    type: "flat",
    demand: 82,
    metro: 4.5,
    infra: 80,
    pastPrice: 9200,
    pricePerSqft: 10200,
  },
  {
    locality: "Shivajinagar",
    sqft: 1300,
    type: "flat",
    demand: 81,
    metro: 3.5,
    infra: 80,
    pastPrice: 9000,
    pricePerSqft: 9900,
  },
  {
    locality: "Bibwewadi",
    sqft: 1000,
    type: "flat",
    demand: 74,
    metro: 7.0,
    infra: 70,
    pastPrice: 6800,
    pricePerSqft: 7500,
  },
  {
    locality: "Hadapsar",
    sqft: 1200,
    type: "flat",
    demand: 76,
    metro: 8.5,
    infra: 72,
    pastPrice: 7200,
    pricePerSqft: 7900,
  },
  {
    locality: "Undri",
    sqft: 1100,
    type: "flat",
    demand: 70,
    metro: 12.0,
    infra: 66,
    pastPrice: 5800,
    pricePerSqft: 6400,
  },
  {
    locality: "Pisoli",
    sqft: 1000,
    type: "flat",
    demand: 66,
    metro: 14.0,
    infra: 62,
    pastPrice: 5200,
    pricePerSqft: 5800,
  },
  {
    locality: "Ambegaon",
    sqft: 1100,
    type: "flat",
    demand: 68,
    metro: 13.0,
    infra: 64,
    pastPrice: 5500,
    pricePerSqft: 6100,
  },
  {
    locality: "Katraj",
    sqft: 1000,
    type: "flat",
    demand: 69,
    metro: 10.0,
    infra: 65,
    pastPrice: 5800,
    pricePerSqft: 6400,
  },
  {
    locality: "Kondhwa",
    sqft: 1200,
    type: "flat",
    demand: 72,
    metro: 9.5,
    infra: 68,
    pastPrice: 6200,
    pricePerSqft: 6900,
  },
  {
    locality: "Wanowrie",
    sqft: 1100,
    type: "flat",
    demand: 73,
    metro: 8.0,
    infra: 70,
    pastPrice: 6500,
    pricePerSqft: 7200,
  },
  {
    locality: "Fatima Nagar",
    sqft: 1000,
    type: "flat",
    demand: 70,
    metro: 7.5,
    infra: 67,
    pastPrice: 6000,
    pricePerSqft: 6600,
  },
  {
    locality: "NIBM Road",
    sqft: 1300,
    type: "flat",
    demand: 75,
    metro: 9.0,
    infra: 72,
    pastPrice: 7000,
    pricePerSqft: 7700,
  },
  {
    locality: "Talegaon",
    sqft: 1200,
    type: "flat",
    demand: 61,
    metro: 22.0,
    infra: 57,
    pastPrice: 4400,
    pricePerSqft: 4900,
  },
  {
    locality: "Lonavala Pune",
    sqft: 1500,
    type: "villa",
    demand: 62,
    metro: 30.0,
    infra: 58,
    pastPrice: 5000,
    pricePerSqft: 6000,
  },
  {
    locality: "Bhosari",
    sqft: 1000,
    type: "flat",
    demand: 64,
    metro: 10.0,
    infra: 60,
    pastPrice: 4800,
    pricePerSqft: 5300,
  },
  {
    locality: "Chakan",
    sqft: 1100,
    type: "flat",
    demand: 60,
    metro: 18.0,
    infra: 56,
    pastPrice: 4000,
    pricePerSqft: 4400,
  },
  {
    locality: "Alandi",
    sqft: 1200,
    type: "flat",
    demand: 58,
    metro: 20.0,
    infra: 54,
    pastPrice: 3600,
    pricePerSqft: 4000,
  },
  {
    locality: "Wagholi",
    sqft: 1100,
    type: "flat",
    demand: 70,
    metro: 12.0,
    infra: 65,
    pastPrice: 5500,
    pricePerSqft: 6100,
  },
  {
    locality: "Kharadi",
    sqft: 1400,
    type: "flat",
    demand: 80,
    metro: 7.0,
    infra: 76,
    pastPrice: 8200,
    pricePerSqft: 9000,
  },
  // ---- DELHI NCR (40 records) ----
  {
    locality: "Gurgaon Sector 56",
    sqft: 1600,
    type: "flat",
    demand: 84,
    metro: 3.5,
    infra: 80,
    pastPrice: 9500,
    pricePerSqft: 10200,
  },
  {
    locality: "Gurgaon Sector 56",
    sqft: 1200,
    type: "flat",
    demand: 83,
    metro: 3.5,
    infra: 79,
    pastPrice: 9200,
    pricePerSqft: 9800,
  },
  {
    locality: "Gurgaon DLF Phase 1",
    sqft: 2000,
    type: "flat",
    demand: 87,
    metro: 4.0,
    infra: 84,
    pastPrice: 12000,
    pricePerSqft: 13200,
  },
  {
    locality: "Gurgaon DLF Phase 2",
    sqft: 2200,
    type: "villa",
    demand: 88,
    metro: 4.5,
    infra: 85,
    pastPrice: 13000,
    pricePerSqft: 14500,
  },
  {
    locality: "Gurgaon DLF Phase 3",
    sqft: 1800,
    type: "flat",
    demand: 86,
    metro: 5.0,
    infra: 83,
    pastPrice: 11500,
    pricePerSqft: 12500,
  },
  {
    locality: "Noida Sector 62",
    sqft: 1300,
    type: "flat",
    demand: 80,
    metro: 2.0,
    infra: 76,
    pastPrice: 7500,
    pricePerSqft: 8200,
  },
  {
    locality: "Noida Sector 18",
    sqft: 1000,
    type: "flat",
    demand: 82,
    metro: 1.5,
    infra: 78,
    pastPrice: 8200,
    pricePerSqft: 9000,
  },
  {
    locality: "Noida Sector 137",
    sqft: 1400,
    type: "flat",
    demand: 78,
    metro: 3.0,
    infra: 74,
    pastPrice: 6800,
    pricePerSqft: 7500,
  },
  {
    locality: "Greater Noida West",
    sqft: 1200,
    type: "flat",
    demand: 72,
    metro: 5.5,
    infra: 68,
    pastPrice: 5200,
    pricePerSqft: 5900,
  },
  {
    locality: "Greater Noida West",
    sqft: 1500,
    type: "flat",
    demand: 73,
    metro: 5.5,
    infra: 69,
    pastPrice: 5400,
    pricePerSqft: 6200,
  },
  {
    locality: "Indirapuram",
    sqft: 1200,
    type: "flat",
    demand: 78,
    metro: 3.0,
    infra: 74,
    pastPrice: 7000,
    pricePerSqft: 7700,
  },
  {
    locality: "Vaishali Ghaziabad",
    sqft: 1100,
    type: "flat",
    demand: 74,
    metro: 2.0,
    infra: 70,
    pastPrice: 6200,
    pricePerSqft: 6900,
  },
  {
    locality: "Crossing Republik",
    sqft: 1300,
    type: "flat",
    demand: 68,
    metro: 7.0,
    infra: 63,
    pastPrice: 4800,
    pricePerSqft: 5400,
  },
  {
    locality: "Faridabad Sector 88",
    sqft: 1200,
    type: "flat",
    demand: 70,
    metro: 3.5,
    infra: 66,
    pastPrice: 5500,
    pricePerSqft: 6100,
  },
  {
    locality: "Faridabad Sector 46",
    sqft: 1000,
    type: "flat",
    demand: 68,
    metro: 4.0,
    infra: 64,
    pastPrice: 5000,
    pricePerSqft: 5600,
  },
  {
    locality: "Dwarka Sector 12",
    sqft: 1200,
    type: "flat",
    demand: 80,
    metro: 1.5,
    infra: 77,
    pastPrice: 8500,
    pricePerSqft: 9400,
  },
  {
    locality: "Dwarka Sector 18",
    sqft: 1400,
    type: "flat",
    demand: 81,
    metro: 1.8,
    infra: 78,
    pastPrice: 9000,
    pricePerSqft: 9900,
  },
  {
    locality: "Rohini Sector 7",
    sqft: 1100,
    type: "flat",
    demand: 76,
    metro: 1.0,
    infra: 73,
    pastPrice: 7400,
    pricePerSqft: 8100,
  },
  {
    locality: "Pitampura",
    sqft: 1000,
    type: "flat",
    demand: 79,
    metro: 1.2,
    infra: 76,
    pastPrice: 8000,
    pricePerSqft: 8800,
  },
  {
    locality: "Janakpuri",
    sqft: 1200,
    type: "flat",
    demand: 77,
    metro: 1.5,
    infra: 75,
    pastPrice: 7800,
    pricePerSqft: 8600,
  },
  {
    locality: "Karol Bagh",
    sqft: 900,
    type: "flat",
    demand: 82,
    metro: 0.8,
    infra: 79,
    pastPrice: 10500,
    pricePerSqft: 11800,
  },
  {
    locality: "Lajpat Nagar",
    sqft: 1000,
    type: "flat",
    demand: 83,
    metro: 1.0,
    infra: 80,
    pastPrice: 11000,
    pricePerSqft: 12400,
  },
  {
    locality: "South Extension",
    sqft: 1200,
    type: "flat",
    demand: 84,
    metro: 1.5,
    infra: 82,
    pastPrice: 12000,
    pricePerSqft: 13500,
  },
  {
    locality: "Greater Kailash",
    sqft: 1500,
    type: "flat",
    demand: 86,
    metro: 1.8,
    infra: 84,
    pastPrice: 14000,
    pricePerSqft: 15500,
  },
  {
    locality: "Vasant Kunj",
    sqft: 1400,
    type: "flat",
    demand: 82,
    metro: 3.5,
    infra: 80,
    pastPrice: 11500,
    pricePerSqft: 12800,
  },
  {
    locality: "Saket",
    sqft: 1300,
    type: "flat",
    demand: 83,
    metro: 2.0,
    infra: 81,
    pastPrice: 12000,
    pricePerSqft: 13300,
  },
  {
    locality: "Hauz Khas",
    sqft: 1200,
    type: "flat",
    demand: 85,
    metro: 1.5,
    infra: 83,
    pastPrice: 13500,
    pricePerSqft: 15000,
  },
  {
    locality: "Malviya Nagar",
    sqft: 1100,
    type: "flat",
    demand: 82,
    metro: 2.5,
    infra: 80,
    pastPrice: 11000,
    pricePerSqft: 12200,
  },
  {
    locality: "Paschim Vihar",
    sqft: 1000,
    type: "flat",
    demand: 74,
    metro: 1.2,
    infra: 71,
    pastPrice: 7200,
    pricePerSqft: 8000,
  },
  {
    locality: "Uttam Nagar",
    sqft: 900,
    type: "flat",
    demand: 70,
    metro: 1.5,
    infra: 67,
    pastPrice: 6000,
    pricePerSqft: 6700,
  },
  {
    locality: "Ghaziabad Raj Nagar",
    sqft: 1000,
    type: "flat",
    demand: 65,
    metro: 6.0,
    infra: 61,
    pastPrice: 4500,
    pricePerSqft: 5000,
  },
  {
    locality: "Meerut Road Ghaziabad",
    sqft: 1100,
    type: "flat",
    demand: 62,
    metro: 8.0,
    infra: 58,
    pastPrice: 4000,
    pricePerSqft: 4500,
  },
  {
    locality: "Gurgaon Sohna Road",
    sqft: 1500,
    type: "flat",
    demand: 79,
    metro: 6.0,
    infra: 75,
    pastPrice: 8200,
    pricePerSqft: 8900,
  },
  {
    locality: "Manesar",
    sqft: 1200,
    type: "flat",
    demand: 65,
    metro: 12.0,
    infra: 60,
    pastPrice: 4800,
    pricePerSqft: 5400,
  },
  {
    locality: "Noida Extension",
    sqft: 1300,
    type: "flat",
    demand: 70,
    metro: 6.5,
    infra: 65,
    pastPrice: 4900,
    pricePerSqft: 5500,
  },
  {
    locality: "Raj Nagar Extension",
    sqft: 1100,
    type: "flat",
    demand: 63,
    metro: 8.0,
    infra: 59,
    pastPrice: 4000,
    pricePerSqft: 4500,
  },
  {
    locality: "Gurgaon Sector 83",
    sqft: 1400,
    type: "flat",
    demand: 76,
    metro: 7.5,
    infra: 72,
    pastPrice: 7000,
    pricePerSqft: 7700,
  },
  {
    locality: "Gurgaon Sector 89",
    sqft: 1300,
    type: "flat",
    demand: 74,
    metro: 8.5,
    infra: 70,
    pastPrice: 6500,
    pricePerSqft: 7200,
  },
  {
    locality: "Rewari",
    sqft: 1200,
    type: "flat",
    demand: 58,
    metro: 20.0,
    infra: 54,
    pastPrice: 3500,
    pricePerSqft: 3900,
  },
  {
    locality: "Dharuhera",
    sqft: 1100,
    type: "flat",
    demand: 60,
    metro: 18.0,
    infra: 55,
    pastPrice: 3800,
    pricePerSqft: 4200,
  },
  // ---- HYDERABAD (30 records) ----
  {
    locality: "Banjara Hills",
    sqft: 1800,
    type: "villa",
    demand: 87,
    metro: 4.0,
    infra: 85,
    pastPrice: 9200,
    pricePerSqft: 10000,
  },
  {
    locality: "Banjara Hills",
    sqft: 1400,
    type: "flat",
    demand: 86,
    metro: 4.0,
    infra: 84,
    pastPrice: 8800,
    pricePerSqft: 9600,
  },
  {
    locality: "Madhapur",
    sqft: 1400,
    type: "flat",
    demand: 85,
    metro: 3.5,
    infra: 83,
    pastPrice: 8500,
    pricePerSqft: 9200,
  },
  {
    locality: "Madhapur",
    sqft: 1700,
    type: "flat",
    demand: 86,
    metro: 3.5,
    infra: 84,
    pastPrice: 8800,
    pricePerSqft: 9600,
  },
  {
    locality: "Gachibowli",
    sqft: 1500,
    type: "flat",
    demand: 84,
    metro: 4.5,
    infra: 82,
    pastPrice: 8200,
    pricePerSqft: 8900,
  },
  {
    locality: "Gachibowli",
    sqft: 1900,
    type: "villa",
    demand: 85,
    metro: 4.5,
    infra: 83,
    pastPrice: 8500,
    pricePerSqft: 9500,
  },
  {
    locality: "Kondapur",
    sqft: 1300,
    type: "flat",
    demand: 82,
    metro: 5.0,
    infra: 80,
    pastPrice: 7600,
    pricePerSqft: 8400,
  },
  {
    locality: "Kondapur",
    sqft: 1600,
    type: "flat",
    demand: 83,
    metro: 5.0,
    infra: 81,
    pastPrice: 7900,
    pricePerSqft: 8700,
  },
  {
    locality: "Kukatpally",
    sqft: 1200,
    type: "flat",
    demand: 80,
    metro: 3.0,
    infra: 76,
    pastPrice: 6800,
    pricePerSqft: 7500,
  },
  {
    locality: "Kukatpally",
    sqft: 1500,
    type: "flat",
    demand: 81,
    metro: 3.0,
    infra: 77,
    pastPrice: 7100,
    pricePerSqft: 7800,
  },
  {
    locality: "Miyapur",
    sqft: 1100,
    type: "flat",
    demand: 76,
    metro: 2.5,
    infra: 72,
    pastPrice: 6000,
    pricePerSqft: 6600,
  },
  {
    locality: "KPHB Colony",
    sqft: 1000,
    type: "flat",
    demand: 74,
    metro: 2.0,
    infra: 70,
    pastPrice: 5500,
    pricePerSqft: 6100,
  },
  {
    locality: "Bachupally",
    sqft: 1200,
    type: "flat",
    demand: 72,
    metro: 6.0,
    infra: 68,
    pastPrice: 5600,
    pricePerSqft: 6200,
  },
  {
    locality: "Nizampet",
    sqft: 1100,
    type: "flat",
    demand: 70,
    metro: 5.5,
    infra: 66,
    pastPrice: 5200,
    pricePerSqft: 5800,
  },
  {
    locality: "Kompally",
    sqft: 1300,
    type: "flat",
    demand: 71,
    metro: 8.0,
    infra: 67,
    pastPrice: 5400,
    pricePerSqft: 6000,
  },
  {
    locality: "Pragathi Nagar",
    sqft: 1000,
    type: "flat",
    demand: 68,
    metro: 7.0,
    infra: 64,
    pastPrice: 4900,
    pricePerSqft: 5400,
  },
  {
    locality: "Kokapet",
    sqft: 1600,
    type: "flat",
    demand: 79,
    metro: 6.0,
    infra: 76,
    pastPrice: 7200,
    pricePerSqft: 7900,
  },
  {
    locality: "Narsingi",
    sqft: 1400,
    type: "flat",
    demand: 76,
    metro: 7.0,
    infra: 73,
    pastPrice: 6500,
    pricePerSqft: 7200,
  },
  {
    locality: "Manikonda",
    sqft: 1200,
    type: "flat",
    demand: 74,
    metro: 6.5,
    infra: 70,
    pastPrice: 6000,
    pricePerSqft: 6700,
  },
  {
    locality: "Puppalaguda",
    sqft: 1100,
    type: "flat",
    demand: 72,
    metro: 7.5,
    infra: 68,
    pastPrice: 5700,
    pricePerSqft: 6300,
  },
  {
    locality: "Rajendra Nagar Hyderabad",
    sqft: 1000,
    type: "flat",
    demand: 70,
    metro: 8.0,
    infra: 66,
    pastPrice: 5200,
    pricePerSqft: 5800,
  },
  {
    locality: "LB Nagar",
    sqft: 1000,
    type: "flat",
    demand: 68,
    metro: 1.5,
    infra: 65,
    pastPrice: 5000,
    pricePerSqft: 5500,
  },
  {
    locality: "Dilsukhnagar",
    sqft: 900,
    type: "flat",
    demand: 70,
    metro: 1.8,
    infra: 67,
    pastPrice: 5400,
    pricePerSqft: 6000,
  },
  {
    locality: "Nacharam",
    sqft: 1100,
    type: "flat",
    demand: 68,
    metro: 5.0,
    infra: 64,
    pastPrice: 5100,
    pricePerSqft: 5600,
  },
  {
    locality: "Uppal",
    sqft: 1000,
    type: "flat",
    demand: 70,
    metro: 2.0,
    infra: 66,
    pastPrice: 5300,
    pricePerSqft: 5900,
  },
  {
    locality: "Malkajgiri",
    sqft: 950,
    type: "flat",
    demand: 67,
    metro: 3.5,
    infra: 63,
    pastPrice: 4800,
    pricePerSqft: 5300,
  },
  {
    locality: "Alwal",
    sqft: 1000,
    type: "flat",
    demand: 64,
    metro: 6.0,
    infra: 60,
    pastPrice: 4400,
    pricePerSqft: 4900,
  },
  {
    locality: "Bowenpally",
    sqft: 900,
    type: "flat",
    demand: 66,
    metro: 4.0,
    infra: 62,
    pastPrice: 4600,
    pricePerSqft: 5100,
  },
  {
    locality: "Secunderabad",
    sqft: 1100,
    type: "flat",
    demand: 73,
    metro: 1.0,
    infra: 70,
    pastPrice: 6200,
    pricePerSqft: 6900,
  },
  {
    locality: "Tarnaka",
    sqft: 1000,
    type: "flat",
    demand: 70,
    metro: 2.5,
    infra: 67,
    pastPrice: 5600,
    pricePerSqft: 6200,
  },
  // ---- CHENNAI (20 records) ----
  {
    locality: "Velachery",
    sqft: 1100,
    type: "flat",
    demand: 80,
    metro: 1.5,
    infra: 78,
    pastPrice: 7500,
    pricePerSqft: 8200,
  },
  {
    locality: "Velachery",
    sqft: 1400,
    type: "flat",
    demand: 81,
    metro: 1.5,
    infra: 79,
    pastPrice: 7800,
    pricePerSqft: 8600,
  },
  {
    locality: "Anna Nagar",
    sqft: 1300,
    type: "flat",
    demand: 84,
    metro: 2.0,
    infra: 82,
    pastPrice: 9500,
    pricePerSqft: 10500,
  },
  {
    locality: "Anna Nagar",
    sqft: 1700,
    type: "flat",
    demand: 85,
    metro: 2.0,
    infra: 83,
    pastPrice: 9800,
    pricePerSqft: 11000,
  },
  {
    locality: "T Nagar",
    sqft: 1000,
    type: "flat",
    demand: 86,
    metro: 1.5,
    infra: 84,
    pastPrice: 11000,
    pricePerSqft: 12200,
  },
  {
    locality: "Adyar",
    sqft: 1200,
    type: "flat",
    demand: 85,
    metro: 2.5,
    infra: 83,
    pastPrice: 10500,
    pricePerSqft: 11500,
  },
  {
    locality: "Mylapore",
    sqft: 1000,
    type: "flat",
    demand: 84,
    metro: 2.0,
    infra: 82,
    pastPrice: 10000,
    pricePerSqft: 11200,
  },
  {
    locality: "Nungambakkam",
    sqft: 1100,
    type: "flat",
    demand: 85,
    metro: 1.8,
    infra: 83,
    pastPrice: 11500,
    pricePerSqft: 12800,
  },
  {
    locality: "Porur",
    sqft: 1300,
    type: "flat",
    demand: 74,
    metro: 8.0,
    infra: 71,
    pastPrice: 6200,
    pricePerSqft: 6900,
  },
  {
    locality: "Perambur",
    sqft: 1000,
    type: "flat",
    demand: 72,
    metro: 2.5,
    infra: 69,
    pastPrice: 5800,
    pricePerSqft: 6500,
  },
  {
    locality: "Ambattur",
    sqft: 1100,
    type: "flat",
    demand: 70,
    metro: 5.0,
    infra: 67,
    pastPrice: 5400,
    pricePerSqft: 6000,
  },
  {
    locality: "Avadi",
    sqft: 1000,
    type: "flat",
    demand: 65,
    metro: 8.0,
    infra: 62,
    pastPrice: 4600,
    pricePerSqft: 5100,
  },
  {
    locality: "Tambaram",
    sqft: 1100,
    type: "flat",
    demand: 68,
    metro: 6.0,
    infra: 65,
    pastPrice: 5100,
    pricePerSqft: 5600,
  },
  {
    locality: "Pallavaram",
    sqft: 1000,
    type: "flat",
    demand: 66,
    metro: 5.5,
    infra: 63,
    pastPrice: 4800,
    pricePerSqft: 5300,
  },
  {
    locality: "Chrompet",
    sqft: 1000,
    type: "flat",
    demand: 67,
    metro: 5.0,
    infra: 64,
    pastPrice: 5000,
    pricePerSqft: 5500,
  },
  {
    locality: "Sholinganallur",
    sqft: 1300,
    type: "flat",
    demand: 76,
    metro: 7.0,
    infra: 73,
    pastPrice: 6800,
    pricePerSqft: 7500,
  },
  {
    locality: "Perungudi",
    sqft: 1200,
    type: "flat",
    demand: 74,
    metro: 6.5,
    infra: 71,
    pastPrice: 6400,
    pricePerSqft: 7100,
  },
  {
    locality: "Thoraipakkam",
    sqft: 1300,
    type: "flat",
    demand: 75,
    metro: 7.0,
    infra: 72,
    pastPrice: 6600,
    pricePerSqft: 7300,
  },
  {
    locality: "Medavakkam",
    sqft: 1100,
    type: "flat",
    demand: 70,
    metro: 8.5,
    infra: 67,
    pastPrice: 5500,
    pricePerSqft: 6100,
  },
  {
    locality: "Guduvanchery",
    sqft: 1000,
    type: "flat",
    demand: 62,
    metro: 14.0,
    infra: 58,
    pastPrice: 4200,
    pricePerSqft: 4700,
  },
];

function recordToFeatures(r: TrainingRecord): number[] {
  return [
    1,
    r.sqft,
    r.localityIndex,
    r.propertyTypeIndex,
    r.demandScore,
    r.metroDistance,
    r.infraScore,
    r.pastAvgPrice,
  ];
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

/**
 * Weighted gradient descent — real data records are given REAL_DATA_WEIGHT,
 * builder data records are given BUILDER_DATA_WEIGHT.
 * As real data accumulates, the model naturally reduces dependence on builder data.
 */
function trainWeightedLinearRegression(records: TrainingRecord[]): {
  weights: number[];
  mae: number;
  rmse: number;
} {
  if (records.length < 3)
    return {
      weights: new Array(FEATURE_NAMES.length).fill(0),
      mae: 9999,
      rmse: 9999,
    };

  const n = records.length;
  const numFeatures = FEATURE_NAMES.length;
  const X = records.map(recordToFeatures);
  const y = records.map((r) => r.pricePerSqft);
  const sampleWeights = records.map((r) =>
    r.source === "real" ? REAL_DATA_WEIGHT : BUILDER_DATA_WEIGHT,
  );

  // Weighted feature normalization
  const featureMeans = new Array(numFeatures).fill(0);
  const featureStds = new Array(numFeatures).fill(1);
  const totalWeight = sampleWeights.reduce((s, w) => s + w, 0);
  for (let j = 1; j < numFeatures; j++) {
    featureMeans[j] =
      X.reduce((s, row, i) => s + row[j] * sampleWeights[i], 0) / totalWeight;
    const variance =
      X.reduce(
        (s, row, i) => s + sampleWeights[i] * (row[j] - featureMeans[j]) ** 2,
        0,
      ) / totalWeight;
    featureStds[j] = Math.sqrt(variance) || 1;
  }
  const Xn = X.map((row) =>
    row.map((v, j) => (j === 0 ? 1 : (v - featureMeans[j]) / featureStds[j])),
  );

  // Weighted gradient descent
  let weights = new Array(numFeatures).fill(0);
  const lr = 0.01;
  const epochs = 1200;
  for (let e = 0; e < epochs; e++) {
    const grad = new Array(numFeatures).fill(0);
    for (let i = 0; i < n; i++) {
      const pred = dotProduct(Xn[i], weights);
      const err = (pred - y[i]) * sampleWeights[i];
      for (let j = 0; j < numFeatures; j++) grad[j] += err * Xn[i][j];
    }
    for (let j = 0; j < numFeatures; j++)
      weights[j] -= (lr / totalWeight) * grad[j];
  }

  // Denormalize
  const realWeights = new Array(numFeatures).fill(0);
  let biasCorrection = 0;
  for (let j = 1; j < numFeatures; j++) {
    realWeights[j] = weights[j] / featureStds[j];
    biasCorrection += realWeights[j] * featureMeans[j];
  }
  realWeights[0] = weights[0] - biasCorrection;

  // Compute weighted errors
  const preds = records.map((r) =>
    dotProduct(recordToFeatures(r), realWeights),
  );
  const wErrors = preds.map((p, i) => sampleWeights[i] * Math.abs(p - y[i]));
  const mae = wErrors.reduce((s, v) => s + v, 0) / totalWeight;
  const rmse = Math.sqrt(
    preds.reduce((s, p, i) => s + sampleWeights[i] * (p - y[i]) ** 2, 0) /
      totalWeight,
  );

  return { weights: realWeights, mae, rmse };
}

// ============================================================
// REAL SALE SEED DATA — North Bangalore 2024-2026
// 150+ verified transactions. Weight = 3x builder data.
// Source: actual sale registrations + premium project data.
// ============================================================
interface RealSaleRecord {
  locality: string;
  type: string;
  sqft: number;
  soldPrice: number;
  dataType: "real" | "estimated";
}

const REAL_SALE_SEED_DATA: RealSaleRecord[] = [
  // Hebbal Apartments
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 1320,
    soldPrice: 15200000,
    dataType: "real",
  },
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 1855,
    soldPrice: 22800000,
    dataType: "real",
  },
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 2400,
    soldPrice: 38500000,
    dataType: "estimated",
  },
  // Thanisandra Apartments
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1150,
    soldPrice: 10400000,
    dataType: "real",
  },
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1570,
    soldPrice: 14900000,
    dataType: "real",
  },
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1262,
    soldPrice: 11500000,
    dataType: "real",
  },
  // Yelahanka Apartments
  {
    locality: "Yelahanka",
    type: "apartment",
    sqft: 1100,
    soldPrice: 9100000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "apartment",
    sqft: 1450,
    soldPrice: 13800000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "apartment",
    sqft: 1750,
    soldPrice: 17200000,
    dataType: "estimated",
  },
  // Jakkur Apartments
  {
    locality: "Jakkur",
    type: "apartment",
    sqft: 1380,
    soldPrice: 13100000,
    dataType: "real",
  },
  {
    locality: "Jakkur",
    type: "apartment",
    sqft: 1650,
    soldPrice: 16800000,
    dataType: "real",
  },
  // Sahakara Nagar Apartments
  {
    locality: "Sahakara Nagar",
    type: "apartment",
    sqft: 1755,
    soldPrice: 25000000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "apartment",
    sqft: 1200,
    soldPrice: 12000000,
    dataType: "estimated",
  },
  // Hennur Road Apartments
  {
    locality: "Hennur Road",
    type: "apartment",
    sqft: 1240,
    soldPrice: 8900000,
    dataType: "real",
  },
  {
    locality: "Hennur Road",
    type: "apartment",
    sqft: 1550,
    soldPrice: 12100000,
    dataType: "real",
  },
  // Devanahalli Plots
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1200,
    soldPrice: 7200000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1500,
    soldPrice: 9300000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 2400,
    soldPrice: 15600000,
    dataType: "estimated",
  },
  // Devanahalli Villa
  {
    locality: "Devanahalli",
    type: "villa",
    sqft: 2100,
    soldPrice: 23500000,
    dataType: "real",
  },
  // Yelahanka Villa & Plot
  {
    locality: "Yelahanka",
    type: "villa",
    sqft: 3500,
    soldPrice: 58500000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "plot",
    sqft: 1200,
    soldPrice: 10800000,
    dataType: "real",
  },
  // Rajanukunte
  {
    locality: "Rajanukunte",
    type: "villa",
    sqft: 3200,
    soldPrice: 31000000,
    dataType: "estimated",
  },
  {
    locality: "Rajanukunte",
    type: "plot",
    sqft: 2400,
    soldPrice: 16800000,
    dataType: "real",
  },
  // Bagalur Plots
  {
    locality: "Bagalur",
    type: "plot",
    sqft: 1200,
    soldPrice: 4800000,
    dataType: "real",
  },
  {
    locality: "Bagalur",
    type: "plot",
    sqft: 1500,
    soldPrice: 6300000,
    dataType: "real",
  },
  // Jakkur Villa & Plot
  {
    locality: "Jakkur",
    type: "villa",
    sqft: 2800,
    soldPrice: 39500000,
    dataType: "real",
  },
  {
    locality: "Jakkur",
    type: "plot",
    sqft: 1200,
    soldPrice: 13200000,
    dataType: "real",
  },
  // Doddaballapur Road
  {
    locality: "Doddaballapur Road",
    type: "plot",
    sqft: 2400,
    soldPrice: 10800000,
    dataType: "estimated",
  },
  // Sadahalli & Chikkajala
  {
    locality: "Sadahalli",
    type: "plot",
    sqft: 1500,
    soldPrice: 12700000,
    dataType: "real",
  },
  {
    locality: "Chikkajala",
    type: "plot",
    sqft: 1200,
    soldPrice: 9600000,
    dataType: "real",
  },
  // Hebbal project-specific
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 1320,
    soldPrice: 15800000,
    dataType: "real",
  },
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 3500,
    soldPrice: 62500000,
    dataType: "real",
  },
  // Manyata Tech Park
  {
    locality: "Manyata Tech Park",
    type: "apartment",
    sqft: 1450,
    soldPrice: 16800000,
    dataType: "estimated",
  },
  // Thanisandra project-specific
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1262,
    soldPrice: 12000000,
    dataType: "real",
  },
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1570,
    soldPrice: 17400000,
    dataType: "real",
  },
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1830,
    soldPrice: 20500000,
    dataType: "real",
  },
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1100,
    soldPrice: 10400000,
    dataType: "real",
  },
  // Yelahanka project-specific
  {
    locality: "Yelahanka",
    type: "apartment",
    sqft: 1325,
    soldPrice: 11500000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "villa",
    sqft: 4100,
    soldPrice: 135000000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "apartment",
    sqft: 1150,
    soldPrice: 9200000,
    dataType: "estimated",
  },
  // Jakkur project-specific
  {
    locality: "Jakkur",
    type: "apartment",
    sqft: 1810,
    soldPrice: 26500000,
    dataType: "real",
  },
  {
    locality: "Jakkur",
    type: "villa",
    sqft: 3320,
    soldPrice: 48500000,
    dataType: "real",
  },
  {
    locality: "Jakkur",
    type: "plot",
    sqft: 1200,
    soldPrice: 13500000,
    dataType: "real",
  },
  // Devanahalli project-specific
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1080,
    soldPrice: 7800000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1200,
    soldPrice: 7400000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 2400,
    soldPrice: 21500000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1500,
    soldPrice: 11200000,
    dataType: "real",
  },
  // Bagalur project-specific
  {
    locality: "Bagalur",
    type: "apartment",
    sqft: 925,
    soldPrice: 6800000,
    dataType: "real",
  },
  {
    locality: "Bagalur",
    type: "apartment",
    sqft: 1243,
    soldPrice: 12300000,
    dataType: "estimated",
  },
  // IVC Road
  {
    locality: "IVC Road",
    type: "plot",
    sqft: 1500,
    soldPrice: 9800000,
    dataType: "real",
  },
  // Sahakara Nagar project-specific
  {
    locality: "Sahakara Nagar",
    type: "apartment",
    sqft: 1254,
    soldPrice: 10800000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "apartment",
    sqft: 1450,
    soldPrice: 23700000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "apartment",
    sqft: 1350,
    soldPrice: 14580000,
    dataType: "estimated",
  },
  {
    locality: "Sahakara Nagar",
    type: "apartment",
    sqft: 1590,
    soldPrice: 17500000,
    dataType: "real",
  },
  // Hebbal more
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 1134,
    soldPrice: 15000000,
    dataType: "real",
  },
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 2215,
    soldPrice: 31000000,
    dataType: "real",
  },
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 2900,
    soldPrice: 42000000,
    dataType: "real",
  },
  // Hennur Road project-specific
  {
    locality: "Hennur Road",
    type: "apartment",
    sqft: 1100,
    soldPrice: 10500000,
    dataType: "real",
  },
  {
    locality: "Hennur Road",
    type: "apartment",
    sqft: 1431,
    soldPrice: 28000000,
    dataType: "real",
  },
  {
    locality: "Hennur Road",
    type: "apartment",
    sqft: 1150,
    soldPrice: 13300000,
    dataType: "real",
  },
  {
    locality: "Hennur Road",
    type: "apartment",
    sqft: 1419,
    soldPrice: 19700000,
    dataType: "estimated",
  },
  // Nagavara
  {
    locality: "Nagavara",
    type: "apartment",
    sqft: 1860,
    soldPrice: 26100000,
    dataType: "real",
  },
  {
    locality: "Nagavara",
    type: "apartment",
    sqft: 1350,
    soldPrice: 15000000,
    dataType: "real",
  },
  {
    locality: "Nagavara",
    type: "plot",
    sqft: 1200,
    soldPrice: 24000000,
    dataType: "real",
  },
  // Bagalur more
  {
    locality: "Bagalur",
    type: "apartment",
    sqft: 1229,
    soldPrice: 8900000,
    dataType: "real",
  },
  {
    locality: "Bagalur",
    type: "apartment",
    sqft: 1224,
    soldPrice: 9500000,
    dataType: "real",
  },
  {
    locality: "Bagalur",
    type: "apartment",
    sqft: 925,
    soldPrice: 6800000,
    dataType: "estimated",
  },
  {
    locality: "Bagalur",
    type: "apartment",
    sqft: 795,
    soldPrice: 7270000,
    dataType: "real",
  },
  {
    locality: "Bagalur",
    type: "apartment",
    sqft: 1150,
    soldPrice: 8600000,
    dataType: "real",
  },
  // Aerospace Park
  {
    locality: "Aerospace Park",
    type: "apartment",
    sqft: 1000,
    soldPrice: 11100000,
    dataType: "real",
  },
  // Bagalur Villa & Plot
  {
    locality: "Bagalur",
    type: "villa",
    sqft: 3119,
    soldPrice: 35600000,
    dataType: "real",
  },
  {
    locality: "Bagalur",
    type: "plot",
    sqft: 1200,
    soldPrice: 5900000,
    dataType: "real",
  },
  // Yelahanka more
  {
    locality: "Yelahanka",
    type: "apartment",
    sqft: 1500,
    soldPrice: 28800000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "villa",
    sqft: 3500,
    soldPrice: 58500000,
    dataType: "real",
  },
  // Thanisandra Main Road
  {
    locality: "Thanisandra Main Road",
    type: "apartment",
    sqft: 1104,
    soldPrice: 11600000,
    dataType: "real",
  },
  {
    locality: "Thanisandra Main Road",
    type: "apartment",
    sqft: 1686,
    soldPrice: 17700000,
    dataType: "real",
  },
  {
    locality: "Thanisandra Main Road",
    type: "apartment",
    sqft: 1058,
    soldPrice: 13500000,
    dataType: "real",
  },
  {
    locality: "Thanisandra",
    type: "apartment",
    sqft: 1250,
    soldPrice: 14400000,
    dataType: "estimated",
  },
  // Hebbal Century Ethos
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 2850,
    soldPrice: 34500000,
    dataType: "real",
  },
  {
    locality: "Hebbal",
    type: "apartment",
    sqft: 2475,
    soldPrice: 47500000,
    dataType: "real",
  },
  // Jakkur more
  {
    locality: "Jakkur",
    type: "apartment",
    sqft: 1133,
    soldPrice: 12800000,
    dataType: "real",
  },
  {
    locality: "Jakkur",
    type: "apartment",
    sqft: 1626,
    soldPrice: 18400000,
    dataType: "real",
  },
  {
    locality: "Jakkur",
    type: "apartment",
    sqft: 1386,
    soldPrice: 15200000,
    dataType: "estimated",
  },
  // Kogilu Cross
  {
    locality: "Kogilu Cross",
    type: "apartment",
    sqft: 1100,
    soldPrice: 9800000,
    dataType: "real",
  },
  // Jakkur & Yelahanka villas
  {
    locality: "Jakkur",
    type: "villa",
    sqft: 3100,
    soldPrice: 46500000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "villa",
    sqft: 4500,
    soldPrice: 85000000,
    dataType: "real",
  },
  {
    locality: "Doddaballapur Road",
    type: "villa",
    sqft: 2800,
    soldPrice: 32000000,
    dataType: "estimated",
  },
  {
    locality: "Thanisandra Road",
    type: "villa",
    sqft: 4200,
    soldPrice: 75200000,
    dataType: "real",
  },
  {
    locality: "Bellary Road",
    type: "villa",
    sqft: 3800,
    soldPrice: 61000000,
    dataType: "real",
  },
  // High-value plots
  {
    locality: "Jakkur",
    type: "plot",
    sqft: 1200,
    soldPrice: 14400000,
    dataType: "real",
  },
  {
    locality: "Thanisandra",
    type: "plot",
    sqft: 2400,
    soldPrice: 36000000,
    dataType: "real",
  },
  {
    locality: "Jakkur Plantation",
    type: "plot",
    sqft: 1500,
    soldPrice: 18000000,
    dataType: "real",
  },
  {
    locality: "Kogilu",
    type: "plot",
    sqft: 1200,
    soldPrice: 10200000,
    dataType: "estimated",
  },
  {
    locality: "Bellary Road",
    type: "plot",
    sqft: 2400,
    soldPrice: 55000000,
    dataType: "real",
  },
  // Yelahanka New Town
  {
    locality: "Yelahanka New Town",
    type: "apartment",
    sqft: 1200,
    soldPrice: 10800000,
    dataType: "real",
  },
  {
    locality: "Yelahanka New Town",
    type: "plot",
    sqft: 1500,
    soldPrice: 15000000,
    dataType: "real",
  },
  {
    locality: "Yelahanka New Town",
    type: "plot",
    sqft: 1280,
    soldPrice: 15000000,
    dataType: "real",
  },
  {
    locality: "Yelahanka New Town",
    type: "plot",
    sqft: 1500,
    soldPrice: 23600000,
    dataType: "real",
  },
  {
    locality: "Yelahanka New Town",
    type: "villa",
    sqft: 3693,
    soldPrice: 90000000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "apartment",
    sqft: 2145,
    soldPrice: 31900000,
    dataType: "real",
  },
  {
    locality: "Yelahanka New Town",
    type: "villa",
    sqft: 2800,
    soldPrice: 23700000,
    dataType: "estimated",
  },
  {
    locality: "Yelahanka New Town",
    type: "apartment",
    sqft: 1085,
    soldPrice: 9060000,
    dataType: "real",
  },
  // Devanahalli more
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1511,
    soldPrice: 14000000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "villa",
    sqft: 4900,
    soldPrice: 45600000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1154,
    soldPrice: 9800000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 950,
    soldPrice: 8200000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 3041,
    soldPrice: 42300000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1202,
    soldPrice: 7500000,
    dataType: "estimated",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1200,
    soldPrice: 11400000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1200,
    soldPrice: 10800000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 2400,
    soldPrice: 42000000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1200,
    soldPrice: 9800000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "villa",
    sqft: 3441,
    soldPrice: 51000000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "villa",
    sqft: 1900,
    soldPrice: 23000000,
    dataType: "real",
  },
  // Yelahanka luxury villas (repeat explicit)
  {
    locality: "Yelahanka",
    type: "villa",
    sqft: 4100,
    soldPrice: 135000000,
    dataType: "real",
  },
  {
    locality: "Yelahanka",
    type: "villa",
    sqft: 4500,
    soldPrice: 85000000,
    dataType: "real",
  },
  // Rajanukunte villas
  {
    locality: "Rajanukunte",
    type: "villa",
    sqft: 2833,
    soldPrice: 45000000,
    dataType: "real",
  },
  {
    locality: "Rajanukunte",
    type: "villa",
    sqft: 3200,
    soldPrice: 31000000,
    dataType: "estimated",
  },
  {
    locality: "Doddaballapur Road",
    type: "villa",
    sqft: 2800,
    soldPrice: 32000000,
    dataType: "estimated",
  },
  // Plot batch
  {
    locality: "Nagavara",
    type: "plot",
    sqft: 1200,
    soldPrice: 24000000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 1200,
    soldPrice: 7400000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "plot",
    sqft: 2400,
    soldPrice: 21500000,
    dataType: "real",
  },
  {
    locality: "Bagalur Main Road",
    type: "plot",
    sqft: 1800,
    soldPrice: 25000000,
    dataType: "real",
  },
  {
    locality: "Sadahalli",
    type: "plot",
    sqft: 1500,
    soldPrice: 12700000,
    dataType: "real",
  },
  {
    locality: "Chikkajala",
    type: "plot",
    sqft: 1200,
    soldPrice: 9600000,
    dataType: "real",
  },
  // Sahakara Nagar plots & villas
  {
    locality: "Sahakara Nagar",
    type: "plot",
    sqft: 2800,
    soldPrice: 84000000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "plot",
    sqft: 2400,
    soldPrice: 62400000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "plot",
    sqft: 1200,
    soldPrice: 27500000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "plot",
    sqft: 1200,
    soldPrice: 32400000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "plot",
    sqft: 1750,
    soldPrice: 35000000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "plot",
    sqft: 1200,
    soldPrice: 28200000,
    dataType: "estimated",
  },
  {
    locality: "Sahakara Nagar",
    type: "villa",
    sqft: 2400,
    soldPrice: 28000000,
    dataType: "real",
  },
  {
    locality: "Sahakara Nagar",
    type: "villa",
    sqft: 3100,
    soldPrice: 42000000,
    dataType: "real",
  },
  // Hennur Road plots & villas
  {
    locality: "Hennur Road",
    type: "plot",
    sqft: 2400,
    soldPrice: 33600000,
    dataType: "real",
  },
  {
    locality: "Hennur Road",
    type: "plot",
    sqft: 1968,
    soldPrice: 33600000,
    dataType: "real",
  },
  {
    locality: "Hennur Road",
    type: "villa",
    sqft: 3172,
    soldPrice: 41000000,
    dataType: "real",
  },
  {
    locality: "Hennur Road",
    type: "villa",
    sqft: 2800,
    soldPrice: 49000000,
    dataType: "real",
  },
  // Chikkagubbi & Narayanapura villas
  {
    locality: "Chikkagubbi",
    type: "villa",
    sqft: 2940,
    soldPrice: 34000000,
    dataType: "real",
  },
  {
    locality: "Chikkagubbi",
    type: "villa",
    sqft: 3800,
    soldPrice: 40000000,
    dataType: "real",
  },
  {
    locality: "Narayanapura",
    type: "villa",
    sqft: 5700,
    soldPrice: 62500000,
    dataType: "real",
  },
  // Kothanur & Kalyan Nagar
  {
    locality: "Kothanur",
    type: "plot",
    sqft: 2400,
    soldPrice: 20000000,
    dataType: "estimated",
  },
  {
    locality: "Kalyan Nagar",
    type: "plot",
    sqft: 1000,
    soldPrice: 12500000,
    dataType: "real",
  },
  // HBR Layout villas
  {
    locality: "HBR Layout",
    type: "villa",
    sqft: 1200,
    soldPrice: 40000000,
    dataType: "real",
  },
  {
    locality: "HBR Layout",
    type: "villa",
    sqft: 4000,
    soldPrice: 80000000,
    dataType: "real",
  },
  {
    locality: "HBR Layout",
    type: "villa",
    sqft: 1450,
    soldPrice: 50000000,
    dataType: "real",
  },
  {
    locality: "Kalyan Nagar",
    type: "villa",
    sqft: 6000,
    soldPrice: 90000000,
    dataType: "real",
  },
  {
    locality: "Kalyan Nagar",
    type: "villa",
    sqft: 2800,
    soldPrice: 11000000,
    dataType: "estimated",
  },
  {
    locality: "HRBR Layout",
    type: "villa",
    sqft: 2160,
    soldPrice: 33500000,
    dataType: "real",
  },
  // HBR Layout plots
  {
    locality: "HBR Layout",
    type: "plot",
    sqft: 1200,
    soldPrice: 26000000,
    dataType: "real",
  },
  {
    locality: "HBR Layout",
    type: "plot",
    sqft: 1200,
    soldPrice: 36000000,
    dataType: "real",
  },
  {
    locality: "HBR Layout",
    type: "plot",
    sqft: 1200,
    soldPrice: 15600000,
    dataType: "real",
  },
  {
    locality: "Kalyan Nagar",
    type: "plot",
    sqft: 2400,
    soldPrice: 70000000,
    dataType: "real",
  },
  {
    locality: "Kalyan Nagar",
    type: "plot",
    sqft: 6500,
    soldPrice: 270000000,
    dataType: "real",
  },
  {
    locality: "Kalyan Nagar",
    type: "plot",
    sqft: 600,
    soldPrice: 9300000,
    dataType: "estimated",
  },
  {
    locality: "HRBR Layout",
    type: "plot",
    sqft: 4000,
    soldPrice: 127500000,
    dataType: "real",
  },
  {
    locality: "Hennur Gardens",
    type: "plot",
    sqft: 2400,
    soldPrice: 27800000,
    dataType: "real",
  },
  // Devanahalli Apartments (real submitted records 2026)
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1080,
    soldPrice: 9720000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1760,
    soldPrice: 15800000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1110,
    soldPrice: 7800000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1153,
    soldPrice: 12000000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1457,
    soldPrice: 10500000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 997,
    soldPrice: 8500000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1550,
    soldPrice: 16200000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1188,
    soldPrice: 12000000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1461,
    soldPrice: 11500000,
    dataType: "real",
  },
  {
    locality: "Devanahalli",
    type: "apartment",
    sqft: 1389,
    soldPrice: 17500000,
    dataType: "estimated",
  },
];

export function initAIModel(): LinearRegressionModel {
  // Load any user-submitted records from localStorage before training
  let userSalesRecords: RealSaleRecord[] = [];
  try {
    const stored = localStorage.getItem("valubrix_user_sales");
    if (stored) {
      const parsed: Array<{
        locality: string;
        sqft: number;
        propertyType: string;
        soldPrice: number;
        timestamp: number;
      }> = JSON.parse(stored);
      userSalesRecords = parsed.map((r) => ({
        locality: r.locality,
        type: r.propertyType,
        sqft: r.sqft,
        soldPrice: r.soldPrice,
        dataType: "real" as const,
      }));
    }
  } catch (_e) {
    // localStorage unavailable — skip
  }

  // Step 1: Build locality map from both builder and real sale data
  const allLocalities = [
    ...BUILDER_SEED_DATA.map((d) => ({ locality: d.locality })),
    ...REAL_SALE_SEED_DATA.map((d) => ({ locality: d.locality })),
  ];
  const localityMap: Record<string, number> = {};
  let idx = 0;
  for (const { locality } of allLocalities) {
    const key = locality.toLowerCase();
    if (!(key in localityMap)) localityMap[key] = idx++;
  }

  // Step 2: Builder records (weight = 1x)
  const builderRecords: TrainingRecord[] = BUILDER_SEED_DATA.map((d) => ({
    sqft: d.sqft,
    localityIndex: localityMap[d.locality.toLowerCase()] ?? 0,
    propertyTypeIndex: PROPERTY_TYPE_MAP[d.type] ?? 0,
    demandScore: d.demand,
    metroDistance: d.metro,
    infraScore: d.infra,
    pastAvgPrice: d.pastPrice,
    pricePerSqft: d.pricePerSqft,
    source: "builder" as DataSource,
  }));

  // Step 3: Real sale records (weight = 3x) — derived from actual sold prices
  // demandScore/metro/infra use locality-aware defaults; pastAvgPrice = pricePerSqft * 0.9
  const allRealSaleData = [...REAL_SALE_SEED_DATA, ...userSalesRecords];
  const realRecords: TrainingRecord[] = allRealSaleData.map((d) => {
    const pps = Math.round(d.soldPrice / d.sqft);
    const locKey = d.locality.toLowerCase();
    const locIdx = localityMap[locKey] ?? 0;
    // Locality-based demand score: high-demand areas get higher score
    const demandMap: Record<string, number> = {
      hebbal: 85,
      thanisandra: 78,
      yelahanka: 72,
      jakkur: 75,
      "sahakara nagar": 80,
      "hennur road": 70,
      devanahalli: 65,
      bagalur: 60,
      nagavara: 82,
      "kalyan nagar": 78,
      "hbr layout": 76,
      "hrbr layout": 76,
      "yelahanka new town": 70,
      "bellary road": 75,
      "thanisandra road": 77,
      "jakkur plantation": 72,
      "manyata tech park": 85,
      rajanukunte: 60,
      "ivc road": 58,
      chikkajala: 55,
      sadahalli: 55,
      "doddaballapur road": 55,
      "aerospace park": 62,
      "bagalur main road": 58,
      chikkagubbi: 65,
      narayanapura: 68,
      kothanur: 65,
      "hennur gardens": 72,
      kogilu: 65,
      "kogilu cross": 66,
    };
    const demand = demandMap[locKey] ?? 65;
    return {
      sqft: d.sqft,
      localityIndex: locIdx,
      propertyTypeIndex: PROPERTY_TYPE_MAP[d.type] ?? 0,
      demandScore: demand,
      metroDistance: 8, // conservative default for North Bangalore
      infraScore: 70,
      pastAvgPrice: Math.round(pps * 0.9),
      pricePerSqft: pps,
      source: "real" as DataSource,
    };
  });

  // Step 4: Split by property type and train separate models
  const allRecords = [...builderRecords, ...realRecords];

  const splitAndTrain = (
    typeKeys: string[],
  ): {
    weights: number[];
    mae: number;
    rmse: number;
    records: TrainingRecord[];
  } => {
    const typeIndices = typeKeys.map((k) => PROPERTY_TYPE_MAP[k] ?? 0);
    const filtered = cleanRecords(
      allRecords.filter((r) => typeIndices.includes(r.propertyTypeIndex)),
    );
    if (filtered.length < 3) {
      return {
        weights: new Array(8).fill(0),
        mae: 9999,
        rmse: 9999,
        records: [],
      };
    }
    const { weights, mae, rmse } = trainWeightedLinearRegression(filtered);
    return { weights, mae, rmse, records: filtered };
  };

  const aptResult = splitAndTrain(["flat", "apartment"]);
  const villaResult = splitAndTrain(["villa"]);
  const plotResult = splitAndTrain(["plot"]);

  _datasetApartment.push(...aptResult.records);
  _datasetVilla.push(...villaResult.records);
  _datasetPlot.push(...plotResult.records);

  const builderAptCount = aptResult.records.filter(
    (r) => r.source === "builder",
  ).length;
  const realAptCount = aptResult.records.filter(
    (r) => r.source === "real",
  ).length;
  _modelApartment = {
    weights: aptResult.weights,
    featureNames: FEATURE_NAMES,
    mae: aptResult.mae,
    rmse: aptResult.rmse,
    trainedAt: Date.now(),
    sampleCount: aptResult.records.length,
    builderCount: builderAptCount,
    realCount: realAptCount,
    localityMap,
  };

  const builderVillaCount = villaResult.records.filter(
    (r) => r.source === "builder",
  ).length;
  const realVillaCount = villaResult.records.filter(
    (r) => r.source === "real",
  ).length;
  _modelVilla = {
    weights: villaResult.weights,
    featureNames: FEATURE_NAMES,
    mae: villaResult.mae,
    rmse: villaResult.rmse,
    trainedAt: Date.now(),
    sampleCount: villaResult.records.length,
    builderCount: builderVillaCount,
    realCount: realVillaCount,
    localityMap,
  };

  const builderPlotCount = plotResult.records.filter(
    (r) => r.source === "builder",
  ).length;
  const realPlotCount = plotResult.records.filter(
    (r) => r.source === "real",
  ).length;
  _modelPlot = {
    weights: plotResult.weights,
    featureNames: FEATURE_NAMES,
    mae: plotResult.mae,
    rmse: plotResult.rmse,
    trainedAt: Date.now(),
    sampleCount: plotResult.records.length,
    builderCount: builderPlotCount,
    realCount: realPlotCount,
    localityMap,
  };

  return _modelApartment!;
}

export function getModel(): LinearRegressionModel {
  if (!_modelApartment) initAIModel();
  return _modelApartment!;
}

function ensureInitialized() {
  if (!_modelApartment) initAIModel();
}

export interface PredictionInput {
  locality: string;
  sqft: number;
  propertyType: string;
  demandScore: number;
  metroDistance: number;
  infraScore: number;
  pastAvgPrice: number;
}

export interface PredictionResult {
  pricePerSqft: number;
  confidence: "high" | "medium" | "low";
  usedAI: boolean;
  aiError: number;
  explanation: string[];
  modelInfo: {
    builderRecords: number;
    realRecords: number;
    realDataDominance: number; // 0-100% — how much real data influences model
  };
  dataDensity: {
    label: string;
    count: number;
    level: "low" | "medium" | "high";
  };
}

export function predictPricePerSqft(
  input: PredictionInput,
  fallbackPrice: number,
): PredictionResult {
  ensureInitialized();
  const typeKey = getTypeKey(input.propertyType);
  const model = getModelForType(typeKey);
  const dataset = getDatasetForType(typeKey);

  if (!model) {
    return {
      pricePerSqft: fallbackPrice,
      confidence: "low",
      usedAI: false,
      aiError: 9999,
      explanation: ["Model not yet trained for this property type"],
      modelInfo: { builderRecords: 0, realRecords: 0, realDataDominance: 0 },
      dataDensity: { label: "Low data density", count: 0, level: "low" },
    };
  }

  const localityKey = input.locality.toLowerCase();
  const localityIndex = model.localityMap[localityKey];

  // Count real records for this specific type + locality
  const realCount =
    localityIndex !== undefined
      ? dataset.filter(
          (r) => r.localityIndex === localityIndex && r.source === "real",
        ).length
      : 0;

  // Data density based on per-type, per-locality real record count
  const densityLevel =
    realCount >= 15 ? "high" : realCount >= 5 ? "medium" : "low";
  const densityLabel =
    realCount >= 15
      ? "High data density"
      : realCount >= 5
        ? "Medium data density"
        : "Low data density";
  const dataDensity = {
    label: densityLabel,
    count: realCount,
    level: densityLevel as "low" | "medium" | "high",
  };

  const totalW =
    model.builderCount * BUILDER_DATA_WEIGHT +
    model.realCount * REAL_DATA_WEIGHT;
  const realDominance =
    totalW > 0
      ? Math.round((model.realCount * REAL_DATA_WEIGHT * 100) / totalW)
      : 0;

  // If sparse (<5 real records for this type in this locality), use nearby locality blend
  if (realCount < 5) {
    const nearbyLocalities = NEARBY_LOCALITIES[localityKey] || [];
    const nearbyPrices: number[] = [];
    for (const nearby of nearbyLocalities) {
      const nearbyIdx = model.localityMap[nearby];
      if (nearbyIdx === undefined) continue;
      const nearbyRecords = dataset.filter(
        (r) => r.localityIndex === nearbyIdx && r.source === "real",
      );
      if (nearbyRecords.length > 0) {
        const avg =
          nearbyRecords.reduce((s, r) => s + r.pricePerSqft, 0) /
          nearbyRecords.length;
        nearbyPrices.push(avg);
      }
    }

    if (nearbyPrices.length > 0) {
      const nearbyAvg =
        nearbyPrices.reduce((s, p) => s + p, 0) / nearbyPrices.length;
      // Blend: 40% comparables fallback, 60% nearby average
      const blendedPrice = Math.round(fallbackPrice * 0.4 + nearbyAvg * 0.6);
      return {
        pricePerSqft: blendedPrice,
        confidence: "low",
        usedAI: false,
        aiError: model.mae,
        explanation: [
          `Low data density for ${typeKey}s in ${input.locality} (${realCount} real records)`,
          `Using nearby locality data blend (${nearbyLocalities.slice(0, 2).join(", ")})`,
          "Submit sold prices to improve accuracy",
        ],
        modelInfo: {
          builderRecords: model.builderCount,
          realRecords: model.realCount,
          realDataDominance: realDominance,
        },
        dataDensity,
      };
    }

    // Pure fallback
    return {
      pricePerSqft: fallbackPrice,
      confidence: "low",
      usedAI: false,
      aiError: model.mae,
      explanation: [
        `Insufficient ${typeKey} data for ${input.locality} (${realCount} real records)`,
        "Using comparables engine",
      ],
      modelInfo: {
        builderRecords: model.builderCount,
        realRecords: model.realCount,
        realDataDominance: realDominance,
      },
      dataDensity,
    };
  }

  // Sufficient data — use AI model
  const features: TrainingRecord = {
    sqft: input.sqft,
    localityIndex: localityIndex ?? 0,
    propertyTypeIndex: PROPERTY_TYPE_MAP[input.propertyType.toLowerCase()] ?? 0,
    demandScore: input.demandScore,
    metroDistance: input.metroDistance,
    infraScore: input.infraScore,
    pastAvgPrice: input.pastAvgPrice,
    pricePerSqft: 0,
    source: "builder",
  };
  const rawPred = dotProduct(recordToFeatures(features), model.weights);
  const pred = Math.max(rawPred, 3000);

  const errorPct = model.mae / (pred || 1);
  const aiConfidence =
    errorPct < 0.08 ? "high" : errorPct < 0.15 ? "medium" : "low";
  // Use data density as primary confidence signal
  const confidence = (
    densityLevel === "high"
      ? aiConfidence === "low"
        ? "medium"
        : aiConfidence
      : densityLevel
  ) as "high" | "medium" | "low";

  const explanation: string[] = [
    `Based on ${realCount} real ${typeKey} transactions in ${input.locality}`,
  ];
  if (input.demandScore > 80) explanation.push("High demand boosting price");
  if (input.metroDistance < 3)
    explanation.push("Metro proximity adding premium");
  if (input.infraScore > 80) explanation.push("Strong infrastructure score");
  if (model.realCount > 0)
    explanation.push(`${realDominance}% real-data influence on model`);

  return {
    pricePerSqft: Math.round(pred),
    confidence,
    usedAI: true,
    aiError: Math.round(model.mae),
    explanation,
    modelInfo: {
      builderRecords: model.builderCount,
      realRecords: model.realCount,
      realDataDominance: realDominance,
    },
    dataDensity,
  };
}

/**
 * Called when a real sale closes.
 * Real data is weighted 3x vs builder data — it dominates model over time.
 */
export function addSaleFeedbackAndRetrain(
  locality: string,
  sqft: number,
  propertyType: string,
  soldPrice: number,
): void {
  ensureInitialized();
  const typeKey = getTypeKey(propertyType);
  const model = getModelForType(typeKey);
  if (!model) return;

  const pps = Math.round(soldPrice / sqft);
  if (pps < 3000 || pps > 30000) return; // data cleaning

  const localityKey = locality.toLowerCase();
  const localityIndex =
    model.localityMap[localityKey] ?? Object.keys(model.localityMap).length;

  const record: TrainingRecord = {
    sqft,
    localityIndex,
    propertyTypeIndex: PROPERTY_TYPE_MAP[propertyType.toLowerCase()] ?? 0,
    demandScore: 70,
    metroDistance: 8,
    infraScore: 70,
    pastAvgPrice: Math.round(pps * 0.9),
    pricePerSqft: pps,
    source: "real",
  };

  const dataset = getDatasetForType(typeKey);
  dataset.push(record);

  const cleaned = cleanRecords(dataset);
  const { weights, mae, rmse } = trainWeightedLinearRegression(cleaned);
  const newModel: LinearRegressionModel = {
    ...model,
    weights,
    mae,
    rmse,
    trainedAt: Date.now(),
    sampleCount: cleaned.length,
    builderCount: cleaned.filter((r) => r.source === "builder").length,
    realCount: cleaned.filter((r) => r.source === "real").length,
  };
  setModelForType(typeKey, newModel);

  // Persist to localStorage so submissions survive page reloads
  try {
    const stored = localStorage.getItem("valubrix_user_sales");
    const existing: Array<{
      locality: string;
      sqft: number;
      propertyType: string;
      soldPrice: number;
      timestamp: number;
    }> = stored ? JSON.parse(stored) : [];
    existing.push({
      locality,
      sqft,
      propertyType,
      soldPrice,
      timestamp: Date.now(),
    });
    localStorage.setItem("valubrix_user_sales", JSON.stringify(existing));
  } catch (_e) {
    // localStorage unavailable (SSR/private mode) — skip silently
  }
}

export function getModelConfidenceLabel(mae: number, avgPrice: number): string {
  const errorPct = mae / (avgPrice || 1);
  if (errorPct < 0.08) return "High (AI model reliable)";
  if (errorPct < 0.15) return "Medium (AI model learning)";
  return "Low (using comparables fallback)";
}

export function getModelStats(): {
  sampleCount: number;
  builderCount: number;
  realCount: number;
  realDataDominance: number;
  mae: number;
  rmse: number;
  trainedAt: number;
  aptStats: {
    builderCount: number;
    realCount: number;
    sampleCount: number;
    mae: number;
  };
  villaStats: {
    builderCount: number;
    realCount: number;
    sampleCount: number;
    mae: number;
  };
  plotStats: {
    builderCount: number;
    realCount: number;
    sampleCount: number;
    mae: number;
  };
} | null {
  if (!_modelApartment) return null;
  const m = _modelApartment;
  const totalW =
    m.builderCount * BUILDER_DATA_WEIGHT + m.realCount * REAL_DATA_WEIGHT;
  const realDominance =
    totalW > 0
      ? Math.round((m.realCount * REAL_DATA_WEIGHT * 100) / totalW)
      : 0;
  const toStats = (mdl: LinearRegressionModel | null) =>
    mdl
      ? {
          builderCount: mdl.builderCount,
          realCount: mdl.realCount,
          sampleCount: mdl.sampleCount,
          mae: mdl.mae,
        }
      : { builderCount: 0, realCount: 0, sampleCount: 0, mae: 9999 };
  return {
    sampleCount: m.sampleCount,
    builderCount: m.builderCount,
    realCount: m.realCount,
    realDataDominance: realDominance,
    mae: m.mae,
    rmse: m.rmse,
    trainedAt: m.trainedAt,
    aptStats: toStats(_modelApartment),
    villaStats: toStats(_modelVilla),
    plotStats: toStats(_modelPlot),
  };
}

export function getRealDataConfidenceLabel(realDataDominancePct: number): {
  label: string;
  level: "low" | "medium" | "high";
} {
  if (realDataDominancePct < 30)
    return { label: "Low confidence", level: "low" };
  if (realDataDominancePct <= 60)
    return { label: "Medium confidence", level: "medium" };
  return { label: "High confidence", level: "high" };
}

// 24-hour batch retrain — keeps model fresh even without new sales
if (typeof window !== "undefined") {
  setInterval(
    () => {
      const retrainType = (type: "apartment" | "villa" | "plot") => {
        const dataset = getDatasetForType(type);
        const model = getModelForType(type);
        if (dataset.length > 0 && model) {
          const cleaned = cleanRecords(dataset);
          const { weights, mae, rmse } = trainWeightedLinearRegression(cleaned);
          setModelForType(type, {
            ...model,
            weights,
            mae,
            rmse,
            trainedAt: Date.now(),
          });
        }
      };
      retrainType("apartment");
      retrainType("villa");
      retrainType("plot");
    },
    24 * 60 * 60 * 1000,
  );
}

export interface LocalityStats {
  locality: string;
  recordCount: number;
  avgPricePerSqft: number;
  minPricePerSqft: number;
  maxPricePerSqft: number;
  propertyTypes: string[];
}

export function getLocalityDistribution(): LocalityStats[] {
  const map: Record<string, { prices: number[]; types: Set<string> }> = {};
  for (const r of REAL_SALE_SEED_DATA) {
    const ppsf = r.soldPrice / r.sqft;
    if (!map[r.locality]) map[r.locality] = { prices: [], types: new Set() };
    map[r.locality].prices.push(ppsf);
    map[r.locality].types.add(r.type);
  }
  return Object.entries(map)
    .map(([locality, { prices, types }]) => ({
      locality,
      recordCount: prices.length,
      avgPricePerSqft: Math.round(
        prices.reduce((a, b) => a + b, 0) / prices.length,
      ),
      minPricePerSqft: Math.round(Math.min(...prices)),
      maxPricePerSqft: Math.round(Math.max(...prices)),
      propertyTypes: Array.from(types),
    }))
    .sort((a, b) => b.recordCount - a.recordCount);
}
