import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  MapPin,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AILearningIndicator from "../components/AILearningIndicator";
import SubmitSoldPriceModal from "../components/SubmitSoldPriceModal";
import {
  getModelStats,
  getRealDataConfidenceLabel,
} from "../engines/linearRegressionEngine";
import {
  type ValuationResult as ValuationResultV2,
  getComparables,
  valuate,
  valuateV2,
} from "../valuationEngine";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationData {
  city: string;
  locality: string;
  subLocality: string;
  marketTag: string;
  baselinePriceMin: number;
  baselinePriceMax: number;
  growthRate: string;
  amenityScore: "High" | "Medium" | "Low";
  metroNearby: boolean;
  monthlyIndex?: number;
  infrastructure?: string[];
  futurePotential?: "High" | "Medium" | "Low";
  transactionDensity?: "High" | "Medium" | "Low";
  growthCorridor?: string;
}

type PropertyType = "flat" | "villa" | "plot" | null;
type BHK = "1" | "2" | "3" | "4+" | null;
type BuildingAge = "0-3" | "3-7" | "7-10" | "10+" | null;
type Furnishing = "Unfurnished" | "Semi Furnished" | "Fully Furnished" | null;
type LandUse =
  | "Agricultural"
  | "Residential Layout"
  | "NA Plot"
  | "Commercial"
  | "Industrial"
  | null;
type LegalStatus = "A Khata" | "NA Converted" | "Other" | null;

// ─── Locality Image Map ───────────────────────────────────────────────────────
const LOCALITY_IMAGES: Record<string, string> = {
  indiranagar: "/assets/generated/locality-indiranagar.dim_800x500.jpg",
  koramangala: "/assets/generated/locality-koramangala.dim_800x500.jpg",
  whitefield: "/assets/generated/locality-whitefield.dim_800x500.jpg",
  sarjapur: "/assets/generated/locality-sarjapur.dim_800x500.jpg",
  hebbal: "/assets/generated/locality-hebbal.dim_800x500.jpg",
  yelahanka: "/assets/generated/locality-yelahanka.dim_800x500.jpg",
  jalahalli: "/assets/generated/locality-jalahalli.dim_800x500.jpg",
  devanahalli: "/assets/generated/locality-devanahalli.dim_800x500.jpg",
  "electronic city": "/assets/generated/locality-whitefield.dim_800x500.jpg",
  rajankunte: "/assets/generated/locality-yelahanka.dim_800x500.jpg",
  "koregaon park": "/assets/generated/locality-koregaon-park.dim_800x500.jpg",
  baner: "/assets/generated/locality-baner.dim_800x500.jpg",
  hinjewadi: "/assets/generated/locality-hinjewadi.dim_800x500.jpg",
  dwarka: "/assets/generated/locality-dwarka.dim_800x500.jpg",
  "south delhi": "/assets/generated/locality-south-delhi.dim_800x500.jpg",
};

function getLocalityImage(locality: string): string {
  const key = locality.toLowerCase().trim();
  return (
    LOCALITY_IMAGES[key] ??
    "/assets/generated/valuation-ai-analysis.dim_800x500.jpg"
  );
}

// ─── Baselines ────────────────────────────────────────────────────────────────
const BASELINES: Record<
  string,
  {
    min: number;
    max: number;
    tag: string;
    circleRate: number;
    zone: "prime" | "growth" | "periphery";
  }
> = {
  indiranagar: {
    min: 30000,
    max: 45000,
    tag: "Prime Zone",
    circleRate: 12000,
    zone: "prime",
  },
  koramangala: {
    min: 25000,
    max: 38000,
    tag: "Prime Zone",
    circleRate: 10000,
    zone: "prime",
  },
  whitefield: {
    min: 12000,
    max: 20000,
    tag: "IT Corridor",
    circleRate: 5000,
    zone: "growth",
  },
  sarjapur: {
    min: 10000,
    max: 18000,
    tag: "Growth Zone",
    circleRate: 4500,
    zone: "growth",
  },
  hebbal: {
    min: 14000,
    max: 24000,
    tag: "Growth Zone",
    circleRate: 6000,
    zone: "growth",
  },
  yelahanka: {
    min: 8000,
    max: 14000,
    tag: "Growth Corridor",
    circleRate: 3500,
    zone: "growth",
  },
  jalahalli: {
    min: 11000,
    max: 16000,
    tag: "Growth Zone",
    circleRate: 4000,
    zone: "growth",
  },
  devanahalli: {
    min: 7000,
    max: 12000,
    tag: "Airport Zone",
    circleRate: 3000,
    zone: "periphery",
  },
  rajankunte: {
    min: 8000,
    max: 13000,
    tag: "North Growth",
    circleRate: 3200,
    zone: "growth",
  },
  "electronic city": {
    min: 9000,
    max: 15000,
    tag: "IT Corridor",
    circleRate: 3800,
    zone: "growth",
  },
  "koregaon park": {
    min: 28000,
    max: 40000,
    tag: "Prime Zone",
    circleRate: 11000,
    zone: "prime",
  },
  baner: {
    min: 14000,
    max: 22000,
    tag: "IT Corridor",
    circleRate: 6000,
    zone: "growth",
  },
  hinjewadi: {
    min: 10000,
    max: 18000,
    tag: "IT Hub",
    circleRate: 4500,
    zone: "growth",
  },
  dwarka: {
    min: 15000,
    max: 21000,
    tag: "Growth Zone",
    circleRate: 6500,
    zone: "growth",
  },
  "south delhi": {
    min: 30000,
    max: 50000,
    tag: "Prime Zone",
    circleRate: 14000,
    zone: "prime",
  },
};

function getBaseline(locality: string) {
  return (
    BASELINES[locality.toLowerCase().trim()] ?? {
      min: 10000,
      max: 18000,
      tag: "Standard Zone",
      circleRate: 4000,
      zone: "growth" as const,
    }
  );
}

// ─── Valuation Engine ─────────────────────────────────────────────────────────
interface FlatFormData {
  bhk: BHK;
  carpetArea: string;
  superBuiltUp: string;
  floor: number;
  totalFloors: number;
  age: BuildingAge;
  furnishing: Furnishing;
  builder: string;
  projectName: string;
  rera: string;
  khata: "A Khata" | "B Khata" | null;
  mahareraRegistered: boolean;
  extract712: boolean;
  tenure: "Freehold" | "Leasehold" | null;
  mcdCategory: string;
  clubhouse: boolean;
  infinityPool: boolean;
}

interface VillaFormData {
  plotArea: string;
  builtUpArea: string;
  bedrooms: number;
  yearOfConstruction: string;
  hasOC: boolean | null;
}

interface PlotFormData {
  plotArea: string;
  plotUnit: "sqft" | "sqyards" | "acres" | "guntas";
  landUse: LandUse;
  legalStatus: LegalStatus;
  roadFrontage: boolean | null;
}

interface ValuationResult {
  fmvMin: number;
  fmvMax: number;
  fmvMid: number;
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Estimate";
  zone: "prime" | "growth" | "periphery";
  adjustments: { label: string; positive: boolean }[];
  assetScore: number;
  liquidityLabel: string;
  liquidityColor: string;
  growthRate: number;
  priceHistory: { year: number; price: number }[];
  comparables: {
    type: string;
    area: number;
    price: number;
    months: number;
    bhk?: string;
  }[];
  microMarket: string;
  amenities: { name: string; distance: string }[];
}

function computeValuation(
  propertyType: PropertyType,
  flat: FlatFormData,
  villa: VillaFormData,
  plot: PlotFormData,
  location: LocationData,
): ValuationResult {
  const localityKey = location.locality.toLowerCase().trim();
  const baseline = getBaseline(localityKey);
  const northBangaloreZones = [
    "rajankunte",
    "yelahanka",
    "hebbal",
    "devanahalli",
    "jalahalli",
  ];
  const growthRate = northBangaloreZones.includes(localityKey)
    ? 0.105
    : baseline.zone === "prime"
      ? 0.08
      : 0.05;

  const adjustments: { label: string; positive: boolean }[] = [];
  let fmvMid = 0;

  if (propertyType === "flat") {
    const marketAvg = (baseline.min + baseline.max) / 2;
    let fmvBase = baseline.circleRate * 0.3 + marketAvg * 0.7;

    const premiumBuilders = [
      "Prestige",
      "Sobha",
      "Brigade",
      "Godrej",
      "Panchshil",
    ];
    const midBuilders = ["Puravankara", "DS-MAX"];
    if (premiumBuilders.includes(flat.builder)) {
      fmvBase *= 1.15;
      adjustments.push({ label: "+Premium builder", positive: true });
    } else if (midBuilders.includes(flat.builder)) {
      fmvBase *= 1.1;
      adjustments.push({ label: "+Reputed builder", positive: true });
    }

    if (flat.floor > 5) {
      fmvBase += 100 * (flat.floor - 5);
      adjustments.push({ label: "+Floor premium", positive: true });
    }

    if (flat.furnishing === "Fully Furnished") {
      fmvBase *= 1.08;
      adjustments.push({ label: "+Fully furnished", positive: true });
    } else if (flat.furnishing === "Semi Furnished") {
      fmvBase *= 1.04;
      adjustments.push({ label: "+Semi furnished", positive: true });
    }

    if (flat.age === "10+") {
      fmvBase *= 0.85;
      adjustments.push({ label: "-Age depreciation", positive: false });
    } else if (flat.age === "7-10") {
      fmvBase *= 0.9;
      adjustments.push({ label: "-Age depreciation", positive: false });
    } else if (flat.age === "3-7") {
      fmvBase *= 0.95;
    }

    if (flat.clubhouse && flat.infinityPool) {
      fmvBase *= 1.15;
      adjustments.push({ label: "+Luxury amenities", positive: true });
    } else if (flat.clubhouse || flat.infinityPool) {
      fmvBase *= 1.075;
      adjustments.push({ label: "+Premium amenity", positive: true });
    }

    if (location.city === "Bangalore") {
      if (flat.khata === "A Khata") {
        fmvBase *= 1.12;
        adjustments.push({ label: "+A Khata", positive: true });
      }
      if (location.metroNearby) {
        fmvBase *= 1.1;
        adjustments.push({ label: "+Metro proximity", positive: true });
      }
    }
    if (location.city === "Pune" && flat.mahareraRegistered) {
      fmvBase *= 1.1;
      adjustments.push({ label: "+MAHARERA registered", positive: true });
    }
    if (location.city === "Delhi" && flat.tenure === "Leasehold") {
      fmvBase *= 0.8;
      adjustments.push({ label: "-Leasehold penalty", positive: false });
    }

    const carpet = Number.parseFloat(flat.carpetArea) || 800;
    fmvMid = fmvBase * carpet;
  } else if (propertyType === "villa") {
    const landRate = baseline.min * 0.45;
    const constructionCost = 3500;
    const ageYears = 2026 - (Number.parseInt(villa.yearOfConstruction) || 2010);
    const depreciation = Math.min(ageYears * 0.02, 0.5);
    const plotA = Number.parseFloat(villa.plotArea) || 2000;
    const builtUp = Number.parseFloat(villa.builtUpArea) || 1500;
    let villaVal =
      plotA * landRate + builtUp * constructionCost * (1 - depreciation);
    if (villa.hasOC === false) {
      villaVal *= 0.88;
      adjustments.push({ label: "-No OC penalty", positive: false });
    }
    if (ageYears > 7)
      adjustments.push({ label: "-Age depreciation", positive: false });
    if (location.metroNearby)
      adjustments.push({ label: "+Metro proximity", positive: true });
    fmvMid = villaVal;
  } else {
    // plot
    let plotAreaSqft = Number.parseFloat(plot.plotArea) || 1000;
    if (plot.plotUnit === "sqyards") plotAreaSqft *= 9;
    if (plot.plotUnit === "acres") plotAreaSqft *= 43560;
    if (plot.plotUnit === "guntas") plotAreaSqft *= 1089;

    let plotRate = baseline.min * 0.45;
    if (plot.landUse === "Commercial") {
      plotRate *= 2.5;
      adjustments.push({ label: "+Commercial use", positive: true });
    }
    if (plot.landUse === "Agricultural") {
      plotRate *= 0.3;
      adjustments.push({ label: "-Agricultural land", positive: false });
    }
    const legalMult =
      plot.legalStatus === "A Khata" || plot.legalStatus === "NA Converted"
        ? 1.175
        : 1.0;
    if (legalMult > 1)
      adjustments.push({ label: "+Legal premium", positive: true });
    if (plot.roadFrontage) {
      plotRate *= 1.5;
      adjustments.push({ label: "+Road frontage", positive: true });
    }
    fmvMid = plotAreaSqft * plotRate * legalMult;
  }

  const fmvMin = fmvMid * 0.92;
  const fmvMax = fmvMid * 1.08;

  // Confidence
  let confidence = 75;
  let confidenceLabel: "High" | "Medium" | "Estimate" = "Medium";
  if (baseline.zone === "prime") confidence += 15;
  if (baseline.zone === "periphery") confidence -= 15;
  if (
    propertyType === "flat" &&
    ["Prestige", "Sobha", "Brigade", "Godrej", "Panchshil"].includes(
      flat.builder,
    )
  )
    confidence += 10;
  if (
    propertyType === "flat" &&
    flat.khata === "A Khata" &&
    location.city === "Bangalore"
  )
    confidence += 5;
  confidence = Math.min(95, Math.max(50, confidence));
  if (confidence >= 85) confidenceLabel = "High";
  else if (confidence >= 70) confidenceLabel = "Medium";
  else confidenceLabel = "Estimate";

  // Asset quality score (0-100)
  let assetScore = 50;
  if (propertyType === "flat") {
    if (
      ["Prestige", "Sobha", "Brigade", "Godrej", "Panchshil"].includes(
        flat.builder,
      )
    )
      assetScore += 20;
    else if (["Puravankara", "DS-MAX"].includes(flat.builder)) assetScore += 12;
    if (flat.age === "0-3") assetScore += 15;
    else if (flat.age === "3-7") assetScore += 8;
    else if (flat.age === "10+") assetScore -= 10;
    if (flat.clubhouse || flat.infinityPool) assetScore += 10;
    if (baseline.zone === "prime") assetScore += 10;
  }
  assetScore = Math.min(100, Math.max(30, assetScore));

  // Liquidity
  let liquidityLabel = "Medium Liquidity";
  let liquidityColor = "text-yellow-400";
  if (baseline.zone === "prime") {
    liquidityLabel = "High Liquidity";
    liquidityColor = "text-green-400";
  }
  if (baseline.zone === "periphery") {
    liquidityLabel = "Low Liquidity";
    liquidityColor = "text-red-400";
  }

  // Price history 2022-2026
  const priceHistory = [2022, 2023, 2024, 2025, 2026].map((year, i) => ({
    year,
    price: Math.round(baseline.min * (1 + growthRate) ** i),
  }));

  // Comparables
  const bhkStr = propertyType === "flat" ? `${flat.bhk ?? "2"} BHK` : "";
  const baseArea =
    propertyType === "flat" ? Number.parseFloat(flat.carpetArea) || 800 : 1800;
  const comparables = [
    {
      type:
        propertyType === "plot"
          ? "Plot"
          : propertyType === "villa"
            ? "Villa"
            : "Apartment",
      area: Math.round(baseArea * 0.95),
      price: Math.round(fmvMid * 0.97),
      months: 2,
      bhk: bhkStr,
    },
    {
      type:
        propertyType === "plot"
          ? "Plot"
          : propertyType === "villa"
            ? "Villa"
            : "Apartment",
      area: Math.round(baseArea * 1.05),
      price: Math.round(fmvMid * 1.03),
      months: 4,
      bhk: bhkStr,
    },
    {
      type:
        propertyType === "plot"
          ? "Plot"
          : propertyType === "villa"
            ? "Villa"
            : "Apartment",
      area: Math.round(baseArea * 1.0),
      price: Math.round(fmvMid * 0.98),
      months: 3,
      bhk: bhkStr,
    },
    {
      type:
        propertyType === "plot"
          ? "Plot"
          : propertyType === "villa"
            ? "Villa"
            : "Apartment",
      area: Math.round(baseArea * 0.9),
      price: Math.round(fmvMid * 0.95),
      months: 6,
      bhk: bhkStr,
    },
  ];

  // Area amenities
  const amenitiesMap: Record<string, { name: string; distance: string }[]> = {
    Bangalore: [
      {
        name: "Metro Station",
        distance: location.metroNearby ? "650m" : "1.8km",
      },
      { name: "Manipal Hospital", distance: "1.2km" },
      { name: "National Public School", distance: "800m" },
    ],
    Pune: [
      { name: "Pune Airport", distance: "8km" },
      { name: "Ruby Hall Clinic", distance: "2km" },
      { name: "Symbiosis School", distance: "1.5km" },
    ],
    Delhi: [
      { name: "Delhi Metro", distance: "500m" },
      { name: "Max Hospital", distance: "1.5km" },
      { name: "DPS School", distance: "900m" },
    ],
  };

  return {
    fmvMin,
    fmvMax,
    fmvMid,
    confidence,
    confidenceLabel,
    zone: baseline.zone,
    adjustments,
    assetScore,
    liquidityLabel,
    liquidityColor,
    growthRate,
    priceHistory,
    comparables,
    microMarket: `${location.locality} ${location.subLocality} Micro Market`,
    amenities: amenitiesMap[location.city] ?? amenitiesMap.Bangalore,
  };
}

function formatCr(value: number): string {
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS = [
  "Location",
  "Property Type",
  "Details",
  "AI Analysis",
  "Transaction",
  "Wealth Report",
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div data-ocid="valuation.step_indicator" className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10" />
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600"
          initial={{ width: "0%" }}
          animate={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center z-10">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i + 1 < current
                  ? "bg-yellow-400 border-yellow-400 text-black"
                  : i + 1 === current
                    ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                    : "bg-white/5 border-white/20 text-white/40"
              }`}
              animate={{ scale: i + 1 === current ? 1.15 : 1 }}
            >
              {i + 1 < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </motion.div>
            <span
              className={`mt-2 text-xs hidden sm:block ${
                i + 1 === current
                  ? "text-yellow-400 font-semibold"
                  : "text-white/40"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Price Chart ─────────────────────────────────────────────────────
function PriceChart({ data }: { data: { year: number; price: number }[] }) {
  const [progress, setProgress] = useState(0);
  const svgW = 500;
  const svgH = 160;
  const pad = { left: 50, right: 20, top: 20, bottom: 30 };

  useEffect(() => {
    const timeout = setTimeout(() => setProgress(1), 100);
    return () => clearTimeout(timeout);
  }, []);

  const minP = Math.min(...data.map((d) => d.price));
  const maxP = Math.max(...data.map((d) => d.price));
  const range = maxP - minP || 1;

  const points = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * (svgW - pad.left - pad.right),
    y: pad.top + (1 - (d.price - minP) / range) * (svgH - pad.top - pad.bottom),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-lg mx-auto"
        style={{ minWidth: 300 }}
        role="img"
        aria-label="Price trend 2022-2026"
      >
        <title>Price Trend 2022-2026</title>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0" />
          </linearGradient>
          <clipPath id="chartClip">
            <motion.rect
              x={pad.left}
              y={0}
              height={svgH}
              initial={{ width: 0 }}
              animate={{ width: (svgW - pad.left - pad.right) * progress }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </clipPath>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={pad.left}
            x2={svgW - pad.right}
            y1={pad.top + t * (svgH - pad.top - pad.bottom)}
            y2={pad.top + t * (svgH - pad.top - pad.bottom)}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        ))}
        {/* Area fill */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${svgH - pad.bottom} L ${points[0].x} ${svgH - pad.bottom} Z`}
          fill="url(#chartGrad)"
          clipPath="url(#chartClip)"
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#d4a017"
          strokeWidth="2.5"
          clipPath="url(#chartClip)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points */}
        {points.map((p, i) => (
          <motion.circle
            key={data[i].year}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#d4a017"
            stroke="#0a0f1e"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          />
        ))}
        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={d.year}
            x={points[i].x}
            y={svgH - 5}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.5)"
          >
            {d.year}
          </text>
        ))}
        {/* Y label */}
        <text
          x={pad.left - 5}
          y={pad.top}
          textAnchor="end"
          fontSize="9"
          fill="rgba(255,255,255,0.4)"
        >
          ₹{Math.round(maxP / 1000)}K
        </text>
        <text
          x={pad.left - 5}
          y={svgH - pad.bottom}
          textAnchor="end"
          fontSize="9"
          fill="rgba(255,255,255,0.4)"
        >
          ₹{Math.round(minP / 1000)}K
        </text>
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ValuationEnginePage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { locationData?: string };

  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [manualCity, setManualCity] = useState("Bangalore");
  const [manualLocality, setManualLocality] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>(null);

  // Flat form
  const [flat, setFlat] = useState<FlatFormData>({
    bhk: null,
    carpetArea: "",
    superBuiltUp: "",
    floor: 1,
    totalFloors: 5,
    age: null,
    furnishing: null,
    builder: "",
    projectName: "",
    rera: "",
    khata: null,
    mahareraRegistered: false,
    extract712: false,
    tenure: null,
    mcdCategory: "",
    clubhouse: false,
    infinityPool: false,
  });
  // Villa form
  const [villa, setVilla] = useState<VillaFormData>({
    plotArea: "",
    builtUpArea: "",
    bedrooms: 3,
    yearOfConstruction: "2010",
    hasOC: null,
  });
  // Plot form
  const [plotForm, setPlotForm] = useState<PlotFormData>({
    plotArea: "",
    plotUnit: "sqft",
    landUse: null,
    legalStatus: null,
    roadFrontage: null,
  });

  const [sbaError, setSbaError] = useState("");
  const [analysisMsg, setAnalysisMsg] = useState(0);
  const [result, setResult] = useState<ValuationResult | null>(null);

  const [engineResultV2, setEngineResultV2] =
    useState<ValuationResultV2 | null>(null);
  const [comparables, setComparables] = useState<
    ReturnType<typeof getComparables>
  >([]);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const analysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ANALYSIS_MESSAGES = [
    "Analyzing locality transactions...",
    "Checking builder reputation...",
    "Applying hedonic adjustments...",
    "Calculating fair market value...",
    "Generating wealth report...",
  ];

  // Parse location from URL
  useEffect(() => {
    if (search.locationData) {
      try {
        const parsed = JSON.parse(
          decodeURIComponent(search.locationData as string),
        );
        setLocation(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, [search.locationData]);

  // AI analysis animation
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional step-only trigger
  useEffect(() => {
    if (step === 4) {
      setAnalysisMsg(0);
      const computed = computeValuation(
        propertyType,
        flat,
        villa,
        plotForm,
        location ?? {
          city: manualCity,
          locality: manualLocality || "whitefield",
          subLocality: "",
          marketTag: "Standard",
          baselinePriceMin: 10000,
          baselinePriceMax: 18000,
          growthRate: "5%",
          amenityScore: "Medium",
          metroNearby: false,
        },
      );
      setResult(computed);

      // Run deterministic engine for score breakdown
      try {
        const localityStr =
          location?.locality || manualLocality || "Whitefield";
        const cityStr = location?.city || manualCity || "Bangalore";
        // V1 valuate call removed - V2 engine used below
        // V2 engine call
        try {
          const engV2 = valuateV2({
            locality: localityStr,
            builder: propertyType === "flat" ? flat.builder || "" : "",
            city: cityStr,
            area:
              propertyType === "flat"
                ? Number.parseFloat(flat.carpetArea) || 1000
                : propertyType === "villa"
                  ? Number.parseFloat(villa.builtUpArea) || 1500
                  : Number.parseFloat(plotForm.plotArea) || 1200,
            floor: propertyType === "flat" ? flat.floor || 0 : 0,
            propertyType: propertyType ?? "flat",
            bhk: propertyType === "flat" ? Number(flat.bhk) || 2 : 2,
          });
          setEngineResultV2(engV2);
          setComparables(
            getComparables(
              localityStr,
              cityStr,
              propertyType ?? "flat",
              propertyType === "flat" ? Number(flat.bhk) || 2 : 2,
            ),
          );
        } catch {
          /* V2 fallback */
        }
      } catch {
        // Engine gracefully falls back
      }

      analysisTimerRef.current = setInterval(() => {
        setAnalysisMsg((prev) => prev + 1);
      }, 500);

      const mainTimer = setTimeout(() => {
        if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
        setStep(5);
      }, 2500);

      return () => {
        clearTimeout(mainTimer);
        if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
      };
    }
  }, [step]);

  const currentLocation = location ?? {
    city: manualCity,
    locality: manualLocality || "whitefield",
    subLocality: "",
    marketTag: "Standard",
    baselinePriceMin: 10000,
    baselinePriceMax: 18000,
    growthRate: "5%",
    amenityScore: "Medium" as const,
    metroNearby: false,
  };
  const localityImage = getLocalityImage(currentLocation.locality);

  function validateFlat(): boolean {
    const carpet = Number.parseFloat(flat.carpetArea);
    const sba = Number.parseFloat(flat.superBuiltUp);
    if (flat.superBuiltUp && carpet && sba <= carpet) {
      setSbaError("Super Built-up must be greater than Carpet Area");
      return false;
    }
    setSbaError("");
    return true;
  }

  function handleStep3Next() {
    if (propertyType === "flat" && !validateFlat()) return;
    setStep(4);
  }

  // ─── Render Steps ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#0a0f1e" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2"
        >
          <img
            src="/assets/uploads/5EB5878E-7937-4598-9486-6156F9B2EB9F-3-1.png"
            alt="ValuBrix"
            className="h-8"
          />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-yellow-400/80 text-sm font-medium">
            AI Valuation Engine
          </span>
          <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/30">
            MODULE 3
          </Badge>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Location ─────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              {/* Hero image */}
              <div className="relative rounded-2xl overflow-hidden mb-6 h-48">
                <img
                  src={localityImage}
                  alt={currentLocation.locality}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <p className="text-white/60 text-xs uppercase tracking-widest">
                    Location Intelligence
                  </p>
                  <h2 className="text-white text-2xl font-bold capitalize">
                    {currentLocation.locality}
                  </h2>
                </div>
              </div>

              {location ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="text-green-400 w-5 h-5" />
                    <span className="text-green-400 font-semibold">
                      Location Confirmed from Module 2
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "City", value: location.city },
                      { label: "Locality", value: location.locality },
                      {
                        label: "Sub-Locality",
                        value: location.subLocality || "—",
                      },
                      { label: "Market Tag", value: location.marketTag },
                      {
                        label: "Price Range",
                        value: `₹${location.baselinePriceMin.toLocaleString()}–₹${location.baselinePriceMax.toLocaleString()}/sqft`,
                      },
                      { label: "Growth Rate", value: location.growthRate },
                      { label: "Amenity Score", value: location.amenityScore },
                      {
                        label: "Metro Nearby",
                        value: location.metroNearby ? "Yes" : "No",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-white/40 text-xs">{item.label}</p>
                        <p className="text-white font-medium capitalize">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
                  <p className="text-yellow-400/80 text-sm mb-4">
                    No location data from Module 2. Enter manually:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/60 text-sm mb-2 block">
                        City
                      </Label>
                      <select
                        value={manualCity}
                        onChange={(e) => setManualCity(e.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm"
                      >
                        <option value="Bangalore">Bangalore</option>
                        <option value="Pune">Pune</option>
                        <option value="Delhi">Delhi</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-white/60 text-sm mb-2 block">
                        Locality
                      </Label>
                      <Input
                        value={manualLocality}
                        onChange={(e) => setManualLocality(e.target.value)}
                        placeholder="e.g. Indiranagar"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                </div>
              )}

              <motion.div whileHover={{ scale: 1.02 }} className="mt-6">
                <Button
                  onClick={() => setStep(2)}
                  className="w-full py-4 text-base font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 rounded-xl"
                >
                  Next: Property Type <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ── STEP 2: Property Type ────────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Select Property Type
              </h2>
              <p className="text-white/50 mb-6">
                Choose the type of property you want to value
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {(
                  [
                    {
                      type: "flat" as const,
                      icon: Building2,
                      label: "Flat / Apartment",
                      desc: "Apartments, BHK units, high-rise",
                    },
                    {
                      type: "villa" as const,
                      icon: Home,
                      label: "Villa",
                      desc: "Independent houses, row houses",
                    },
                    {
                      type: "plot" as const,
                      icon: MapPin,
                      label: "Plot / Land",
                      desc: "Residential, commercial, farm",
                    },
                  ] as const
                ).map(({ type, icon: Icon, label, desc }) => (
                  <motion.button
                    key={type}
                    data-ocid={`valuation.property_type.${type}_button`}
                    onClick={() => setPropertyType(type)}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    animate={
                      propertyType === type ? { scale: 1.05 } : { scale: 1 }
                    }
                    className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                      propertyType === type
                        ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_24px_rgba(212,160,23,0.25)]"
                        : "border-white/15 bg-white/5 hover:border-yellow-400/50"
                    }`}
                  >
                    <Icon
                      className={`w-10 h-10 ${propertyType === type ? "text-yellow-400" : "text-white/60"}`}
                    />
                    <div className="text-center">
                      <p
                        className={`font-bold ${propertyType === type ? "text-yellow-400" : "text-white"}`}
                      >
                        {label}
                      </p>
                      <p className="text-white/50 text-sm mt-1">{desc}</p>
                    </div>
                    {propertyType === type && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/70 hover:bg-white/5"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                {propertyType && (
                  <motion.div
                    className="flex-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Button
                      onClick={() => setStep(3)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold hover:from-yellow-400"
                    >
                      Next: Property Details{" "}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Property Details ──────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Property Details
              </h2>
              <p className="text-white/50 mb-6 capitalize">
                {propertyType} details for accurate valuation
              </p>

              {propertyType === "flat" && (
                <div className="space-y-6">
                  {/* BHK */}
                  <div>
                    <Label className="text-white/70 mb-3 block font-medium">
                      BHK Type
                    </Label>
                    <div
                      data-ocid="valuation.flat_form.bhk_select"
                      className="flex flex-wrap gap-2"
                    >
                      {(["1", "2", "3", "4+"] as BHK[]).map((b) => (
                        <motion.button
                          key={b}
                          whileTap={{ scale: 0.9 }}
                          animate={
                            flat.bhk === b ? { scale: 1.08 } : { scale: 1 }
                          }
                          onClick={() =>
                            setFlat((prev) => ({ ...prev, bhk: b }))
                          }
                          className={`px-5 py-2 rounded-full font-semibold text-sm border transition-all ${
                            flat.bhk === b
                              ? "bg-yellow-400 text-black border-yellow-400"
                              : "border-white/20 text-white/70 hover:border-yellow-400/50"
                          }`}
                        >
                          {b} BHK
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Areas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Carpet Area (sqft) *
                      </Label>
                      <Input
                        data-ocid="valuation.flat_form.carpet_input"
                        type="number"
                        value={flat.carpetArea}
                        onChange={(e) =>
                          setFlat((prev) => ({
                            ...prev,
                            carpetArea: e.target.value,
                          }))
                        }
                        placeholder="e.g. 850"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Super Built-up Area (sqft) *
                      </Label>
                      <Input
                        data-ocid="valuation.flat_form.sba_input"
                        type="number"
                        value={flat.superBuiltUp}
                        onChange={(e) => {
                          setFlat((prev) => ({
                            ...prev,
                            superBuiltUp: e.target.value,
                          }));
                          setSbaError("");
                        }}
                        placeholder="e.g. 1100"
                        className={`bg-white/10 border-white/20 text-white placeholder:text-white/30 ${sbaError ? "border-red-400" : ""}`}
                      />
                      {sbaError && (
                        <p className="text-red-400 text-xs mt-1">{sbaError}</p>
                      )}
                    </div>
                  </div>

                  {/* Floor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Floor Number
                      </Label>
                      <div
                        data-ocid="valuation.flat_form.floor_input"
                        className="flex items-center gap-3"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setFlat((prev) => ({
                              ...prev,
                              floor: Math.max(1, prev.floor - 1),
                            }))
                          }
                          className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-8 text-center">
                          {flat.floor}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFlat((prev) => ({
                              ...prev,
                              floor: prev.floor + 1,
                            }))
                          }
                          className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Total Floors
                      </Label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFlat((prev) => ({
                              ...prev,
                              totalFloors: Math.max(1, prev.totalFloors - 1),
                            }))
                          }
                          className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-8 text-center">
                          {flat.totalFloors}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFlat((prev) => ({
                              ...prev,
                              totalFloors: prev.totalFloors + 1,
                            }))
                          }
                          className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Building age */}
                  <div>
                    <Label className="text-white/70 mb-3 block">
                      Building Age
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(["0-3", "3-7", "7-10", "10+"] as BuildingAge[]).map(
                        (a) => (
                          <button
                            type="button"
                            key={a}
                            onClick={() =>
                              setFlat((prev) => ({ ...prev, age: a }))
                            }
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                              flat.age === a
                                ? "bg-yellow-400 text-black border-yellow-400"
                                : "border-white/20 text-white/70 hover:border-yellow-400/50"
                            }`}
                          >
                            {a} Years
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Furnishing */}
                  <div>
                    <Label className="text-white/70 mb-3 block">
                      Furnishing Status
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          "Unfurnished",
                          "Semi Furnished",
                          "Fully Furnished",
                        ] as Furnishing[]
                      ).map((f) => (
                        <button
                          type="button"
                          key={f}
                          onClick={() =>
                            setFlat((prev) => ({ ...prev, furnishing: f }))
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                            flat.furnishing === f
                              ? "bg-yellow-400 text-black border-yellow-400"
                              : "border-white/20 text-white/70 hover:border-yellow-400/50"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Builder */}
                  <div>
                    <Label className="text-white/70 mb-2 block">
                      Builder Name
                    </Label>
                    <select
                      data-ocid="valuation.flat_form.builder_select"
                      value={flat.builder}
                      onChange={(e) =>
                        setFlat((prev) => ({
                          ...prev,
                          builder: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm"
                    >
                      <option value="">Select builder</option>
                      {[
                        "Prestige",
                        "Sobha",
                        "Brigade",
                        "Godrej",
                        "Panchshil",
                        "Puravankara",
                        "DS-MAX",
                        "Others",
                      ].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Project Name (optional)
                      </Label>
                      <Input
                        value={flat.projectName}
                        onChange={(e) =>
                          setFlat((prev) => ({
                            ...prev,
                            projectName: e.target.value,
                          }))
                        }
                        placeholder="e.g. Prestige Lake Ridge"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        RERA Number (optional)
                      </Label>
                      <Input
                        value={flat.rera}
                        onChange={(e) =>
                          setFlat((prev) => ({ ...prev, rera: e.target.value }))
                        }
                        placeholder="PRM/KA/RERA/..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  {/* City-specific legal */}
                  {currentLocation.city === "Bangalore" && (
                    <div>
                      <Label className="text-white/70 mb-3 block">
                        Legal Status (Karnataka)
                      </Label>
                      <div className="flex gap-3">
                        {(["A Khata", "B Khata"] as const).map((k) => (
                          <button
                            type="button"
                            key={k}
                            onClick={() =>
                              setFlat((prev) => ({ ...prev, khata: k }))
                            }
                            className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                              flat.khata === k
                                ? "bg-yellow-400 text-black border-yellow-400"
                                : "border-white/20 text-white/70 hover:border-yellow-400/50"
                            }`}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentLocation.city === "Pune" && (
                    <div className="space-y-2">
                      <Label className="text-white/70 mb-3 block">
                        Legal Status (Maharashtra)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="maharera"
                          checked={flat.mahareraRegistered}
                          onCheckedChange={(v) =>
                            setFlat((prev) => ({
                              ...prev,
                              mahareraRegistered: !!v,
                            }))
                          }
                        />
                        <label
                          htmlFor="maharera"
                          className="text-white/70 text-sm"
                        >
                          MAHARERA Registered
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="712"
                          checked={flat.extract712}
                          onCheckedChange={(v) =>
                            setFlat((prev) => ({ ...prev, extract712: !!v }))
                          }
                        />
                        <label htmlFor="712" className="text-white/70 text-sm">
                          7/12 Extract Available
                        </label>
                      </div>
                    </div>
                  )}
                  {currentLocation.city === "Delhi" && (
                    <div className="space-y-3">
                      <Label className="text-white/70 mb-3 block">
                        Legal Status (Delhi)
                      </Label>
                      <div className="flex gap-3">
                        {(["Freehold", "Leasehold"] as const).map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() =>
                              setFlat((prev) => ({ ...prev, tenure: t }))
                            }
                            className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                              flat.tenure === t
                                ? "bg-yellow-400 text-black border-yellow-400"
                                : "border-white/20 text-white/70 hover:border-yellow-400/50"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div>
                        <Label className="text-white/70 mb-2 block">
                          MCD Category
                        </Label>
                        <select
                          value={flat.mcdCategory}
                          onChange={(e) =>
                            setFlat((prev) => ({
                              ...prev,
                              mcdCategory: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm w-40"
                        >
                          <option value="">Select</option>
                          {["A", "B", "C", "D", "E", "F", "G", "H"].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  <div>
                    <Label className="text-white/70 mb-3 block">
                      Luxury Amenities (+15% if both selected)
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="clubhouse"
                          checked={flat.clubhouse}
                          onCheckedChange={(v) =>
                            setFlat((prev) => ({ ...prev, clubhouse: !!v }))
                          }
                        />
                        <label
                          htmlFor="clubhouse"
                          className="text-white/70 text-sm"
                        >
                          Clubhouse (+7.5%)
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="pool"
                          checked={flat.infinityPool}
                          onCheckedChange={(v) =>
                            setFlat((prev) => ({ ...prev, infinityPool: !!v }))
                          }
                        />
                        <label htmlFor="pool" className="text-white/70 text-sm">
                          Infinity Pool (+7.5%)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {propertyType === "villa" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Plot Area (sqft) *
                      </Label>
                      <Input
                        type="number"
                        value={villa.plotArea}
                        onChange={(e) =>
                          setVilla((prev) => ({
                            ...prev,
                            plotArea: e.target.value,
                          }))
                        }
                        placeholder="e.g. 2400"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Built Up Area (sqft) *
                      </Label>
                      <Input
                        type="number"
                        value={villa.builtUpArea}
                        onChange={(e) =>
                          setVilla((prev) => ({
                            ...prev,
                            builtUpArea: e.target.value,
                          }))
                        }
                        placeholder="e.g. 1800"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Bedrooms
                      </Label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setVilla((prev) => ({
                              ...prev,
                              bedrooms: Math.max(1, prev.bedrooms - 1),
                            }))
                          }
                          className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-8 text-center">
                          {villa.bedrooms}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setVilla((prev) => ({
                              ...prev,
                              bedrooms: prev.bedrooms + 1,
                            }))
                          }
                          className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Year of Construction
                      </Label>
                      <Input
                        type="number"
                        value={villa.yearOfConstruction}
                        onChange={(e) =>
                          setVilla((prev) => ({
                            ...prev,
                            yearOfConstruction: e.target.value,
                          }))
                        }
                        min="1970"
                        max="2026"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/70 mb-3 block">
                      Occupancy Certificate (OC)
                    </Label>
                    <div
                      data-ocid="valuation.villa_form.oc_toggle"
                      className="flex gap-3"
                    >
                      {([true, false] as const).map((v) => (
                        <button
                          type="button"
                          key={String(v)}
                          onClick={() =>
                            setVilla((prev) => ({ ...prev, hasOC: v }))
                          }
                          className={`px-6 py-2 rounded-full text-sm font-medium border transition-all ${
                            villa.hasOC === v
                              ? v
                                ? "bg-green-400/20 border-green-400 text-green-400"
                                : "bg-red-400/20 border-red-400 text-red-400"
                              : "border-white/20 text-white/70"
                          }`}
                        >
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                    {villa.hasOC === false && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-red-400 text-sm flex items-center gap-1"
                      >
                        <AlertTriangle className="w-4 h-4" /> −12% penalty
                        applied for missing OC
                      </motion.p>
                    )}
                  </div>
                </div>
              )}

              {propertyType === "plot" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white/70 mb-2 block">
                      Plot Area *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={plotForm.plotArea}
                        onChange={(e) =>
                          setPlotForm((prev) => ({
                            ...prev,
                            plotArea: e.target.value,
                          }))
                        }
                        placeholder="e.g. 1200"
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                      <select
                        value={plotForm.plotUnit}
                        onChange={(e) =>
                          setPlotForm((prev) => ({
                            ...prev,
                            plotUnit: e.target
                              .value as PlotFormData["plotUnit"],
                          }))
                        }
                        className="rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm w-32"
                      >
                        <option value="sqft">sq ft</option>
                        <option value="sqyards">sq yards</option>
                        <option value="acres">acres</option>
                        <option value="guntas">guntas</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/70 mb-3 block">
                      Land Use Type
                    </Label>
                    <div
                      data-ocid="valuation.plot_form.land_use_select"
                      className="flex flex-wrap gap-2"
                    >
                      {(
                        [
                          "Agricultural",
                          "Residential Layout",
                          "NA Plot",
                          "Commercial",
                          "Industrial",
                        ] as LandUse[]
                      ).map((u) => (
                        <button
                          type="button"
                          key={u}
                          onClick={() =>
                            setPlotForm((prev) => ({ ...prev, landUse: u }))
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                            plotForm.landUse === u
                              ? "bg-yellow-400 text-black border-yellow-400"
                              : "border-white/20 text-white/70 hover:border-yellow-400/50"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/70 mb-3 block">
                      Legal Status
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        ["A Khata", "NA Converted", "Other"] as LegalStatus[]
                      ).map((l) => (
                        <button
                          type="button"
                          key={l}
                          onClick={() =>
                            setPlotForm((prev) => ({ ...prev, legalStatus: l }))
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                            plotForm.legalStatus === l
                              ? "bg-yellow-400 text-black border-yellow-400"
                              : "border-white/20 text-white/70 hover:border-yellow-400/50"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/70 mb-3 block">
                      Road Frontage
                    </Label>
                    <div
                      data-ocid="valuation.plot_form.road_frontage_toggle"
                      className="flex gap-3"
                    >
                      {([true, false] as const).map((v) => (
                        <button
                          type="button"
                          key={String(v)}
                          onClick={() =>
                            setPlotForm((prev) => ({
                              ...prev,
                              roadFrontage: v,
                            }))
                          }
                          className={`px-6 py-2 rounded-full text-sm font-medium border transition-all ${
                            plotForm.roadFrontage === v
                              ? "bg-yellow-400 text-black border-yellow-400"
                              : "border-white/20 text-white/70"
                          }`}
                        >
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                    {plotForm.roadFrontage === true && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-green-400 text-sm"
                      >
                        +50% road frontage premium applied
                      </motion.p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/70 hover:bg-white/5"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleStep3Next}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold"
                >
                  Analyze Property <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: AI Analysis ───────────────────────────────────────── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-ocid="valuation.ai_analysis.loading_state"
              className="relative rounded-2xl overflow-hidden min-h-96 flex items-center justify-center"
            >
              <img
                src={localityImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
              />
              <div className="absolute inset-0 bg-black/80" />

              <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center">
                {/* Radar rings */}
                <div className="relative w-28 h-28">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-yellow-400/40"
                      animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />
                  ))}
                  <motion.div
                    className="w-28 h-28 rounded-full bg-yellow-400/10 border-2 border-yellow-400 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Zap className="w-12 h-12 text-yellow-400" />
                  </motion.div>
                </div>

                <div>
                  <h3 className="text-yellow-400 text-2xl font-bold mb-1">
                    Analyzing Property Intelligence
                  </h3>
                  <p className="text-white/50 text-sm">
                    AI-powered valuation engine processing...
                  </p>
                </div>

                {/* Data bars */}
                <div className="w-64 space-y-2">
                  {[
                    "Locality Data",
                    "Transaction Records",
                    "Market Index",
                    "Builder Score",
                  ].map((label, i) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-white/50 text-xs w-28 text-right">
                        {label}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ delay: i * 0.3, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={analysisMsg}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-white/70 text-sm"
                  >
                    {
                      ANALYSIS_MESSAGES[
                        Math.min(analysisMsg, ANALYSIS_MESSAGES.length - 1)
                      ]
                    }
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Transaction Intelligence ─────────────────────────── */}
          {step === 5 && result && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-1">
                Transaction Intelligence Analysis
              </h2>
              <p className="text-white/50 mb-6">
                {result.microMarket} • Valuation adjusted for March 2026 market
                growth
              </p>

              {/* Liquidity + Market labels */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span
                  className={`text-sm font-semibold px-4 py-1.5 rounded-full border border-current ${result.liquidityColor}`}
                >
                  {result.liquidityLabel}
                </span>
                <span className="text-yellow-400/80 text-sm px-4 py-1.5 rounded-full border border-yellow-400/30">
                  {currentLocation.marketTag ||
                    getBaseline(currentLocation.locality).tag}
                </span>
              </div>

              {/* Comparables */}
              <div
                data-ocid="valuation.transaction.comparable_cards"
                className="mb-6"
              >
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-yellow-400" /> Comparable
                  Sales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.comparables.map((c, i) => (
                    <motion.div
                      key={`comp-${c.area}-${c.months}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {c.bhk ? `${c.bhk} · ` : ""}
                            {c.type}
                          </p>
                          <p className="text-white/50 text-xs">
                            {c.area.toLocaleString()} sqft
                          </p>
                        </div>
                        <span className="text-white/40 text-xs">
                          {c.months}mo ago
                        </span>
                      </div>
                      <p className="text-yellow-400 font-bold">
                        {formatCr(c.price)}
                      </p>
                      <p className="text-white/40 text-xs">
                        ₹{Math.round(c.price / c.area).toLocaleString()}/sqft
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Price trend chart */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" /> Price Trend
                  2022–2026
                </h3>
                <PriceChart data={result.priceHistory} />
                <p className="text-white/40 text-xs mt-2 text-center">
                  ₹/sqft baseline price (2022–2026)
                </p>
              </div>

              {/* Anomaly detection */}
              {propertyType === "plot" &&
                Math.abs(result.fmvMid - result.fmvMid * 1.2) / result.fmvMid <
                  0.05 && (
                  <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 p-4 mb-6 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-orange-300 text-sm">
                      Valuation anomaly detected. Plot price cannot equal villa
                      price in same project.
                    </p>
                  </div>
                )}

              <Button
                onClick={() => setStep(6)}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-base rounded-xl"
              >
                Next: View Wealth Report{" "}
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── STEP 6: Wealth Report ─────────────────────────────────────── */}
          {step === 6 && result && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Report header */}
              <div className="relative rounded-2xl overflow-hidden mb-6 h-40">
                <img
                  src={localityImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
                <div className="absolute inset-0 flex items-center px-6 gap-4">
                  <img
                    src="/assets/uploads/5EB5878E-7937-4598-9486-6156F9B2EB9F-3-1.png"
                    alt="ValuBrix"
                    className="h-8 opacity-90"
                  />
                  <div>
                    <p className="text-yellow-400/80 text-xs uppercase tracking-widest">
                      Wealth Intelligence Report
                    </p>
                    <p className="text-white font-bold text-lg">
                      Fair Market Valuation
                    </p>
                    <p className="text-white/50 text-xs">
                      March 2026 • {currentLocation.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* FMV Card */}
              <motion.div
                data-ocid="valuation.wealth_report.price_range_card"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-6 mb-6 text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent" />
                <p className="text-white/60 text-sm mb-1">Fair Market Value</p>
                <p className="text-yellow-400 text-4xl font-bold mb-1">
                  {formatCr(result.fmvMin)} – {formatCr(result.fmvMax)}
                </p>
                <p className="text-white/40 text-xs mb-3">
                  90% Confidence Interval
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
                    result.confidence >= 85
                      ? "bg-green-400/20 text-green-400 border border-green-400/40"
                      : result.confidence >= 70
                        ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"
                        : "bg-orange-400/20 text-orange-400 border border-orange-400/40"
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  {result.confidenceLabel} Confidence — {result.confidence}%
                </div>
              </motion.div>

              {/* Asset Quality Score */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" /> Asset Quality
                  Score
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-bold text-yellow-400">
                    {result.assetScore}
                  </span>
                  <div className="flex-1">
                    <Progress value={result.assetScore} className="h-3" />
                    <p className="text-white/40 text-xs mt-1">out of 100</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      label: "Builder Reputation",
                      pts:
                        propertyType === "flat" &&
                        [
                          "Prestige",
                          "Sobha",
                          "Brigade",
                          "Godrej",
                          "Panchshil",
                        ].includes(flat.builder)
                          ? 28
                          : 15,
                    },
                    {
                      label: "Building Age",
                      pts:
                        propertyType === "flat" && flat.age === "0-3" ? 24 : 14,
                    },
                    {
                      label: "Amenities",
                      pts:
                        propertyType === "flat" &&
                        (flat.clubhouse || flat.infinityPool)
                          ? 20
                          : 10,
                    },
                    {
                      label: "Location Premium",
                      pts:
                        getBaseline(currentLocation.locality).zone === "prime"
                          ? 18
                          : 10,
                    },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      <span className="text-white/50 text-xs w-36">
                        {f.label}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(f.pts / 30) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-yellow-400 text-xs w-6 text-right">
                        {f.pts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hedonic chips */}
              {result.adjustments.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-4">
                  <h3 className="text-white font-semibold mb-3">
                    Hedonic Adjustments
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.adjustments.map((adj, i) => (
                      <motion.span
                        key={`adj-${adj.label}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          adj.positive
                            ? "bg-green-400/15 text-green-400 border border-green-400/30"
                            : "bg-red-400/15 text-red-400 border border-red-400/30"
                        }`}
                      >
                        {adj.label}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Area amenities */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-yellow-400" /> Area Amenities
                </h3>
                <div className="space-y-2">
                  {result.amenities.map((a) => (
                    <div key={a.name} className="flex justify-between">
                      <span className="text-white/70 text-sm">{a.name}</span>
                      <span className="text-yellow-400/80 text-sm">
                        {a.distance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* V2 AI Engine Score Breakdown */}
              {engineResultV2 && (
                <div className="space-y-4 mb-4">
                  {/* Score Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Tech Score",
                        value: engineResultV2.scores.tech,
                        color: "#60a5fa",
                        icon: "🏢",
                      },
                      {
                        label: "Amenity Score",
                        value: engineResultV2.scores.amenity,
                        color: "#a78bfa",
                        icon: "🏥",
                      },
                      {
                        label: "Builder Score",
                        value: engineResultV2.scores.builder,
                        color: "#D4AF37",
                        icon: "🏗️",
                      },
                      {
                        label: "Location Score",
                        value: engineResultV2.scores.location,
                        color: "#34d399",
                        icon: "📍",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
                      >
                        <div className="text-xl mb-1">{s.icon}</div>
                        <div
                          className="text-2xl font-bold font-mono"
                          style={{ color: s.color }}
                        >
                          {s.value}
                        </div>
                        <div className="text-white/40 text-xs mt-1">
                          {s.label}
                        </div>
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${s.value}%`,
                              backgroundColor: s.color,
                              opacity: 0.7,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Confidence Meter */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm font-medium">
                        Confidence Score
                      </span>
                      <span className="text-[#D4AF37] font-bold font-mono">
                        {engineResultV2.confidence}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37] transition-all duration-700"
                        style={{ width: `${engineResultV2.confidence}%` }}
                      />
                    </div>
                    <p className="text-white/30 text-xs mt-2">
                      {engineResultV2.confidence >= 80
                        ? "High confidence — strong data coverage"
                        : engineResultV2.confidence >= 65
                          ? "Moderate confidence — good data coverage"
                          : "Developing area — limited comparable data"}
                    </p>
                    {/* Real data confidence label */}
                    {(() => {
                      const stats = getModelStats();
                      if (!stats) return null;
                      const { label, level } = getRealDataConfidenceLabel(
                        stats.realDataDominance,
                      );
                      const cls =
                        level === "high"
                          ? "text-emerald-400"
                          : level === "medium"
                            ? "text-blue-400"
                            : "text-amber-400";
                      return (
                        <p className={`text-xs mt-1 ${cls}`}>
                          {label} — {stats.realDataDominance}% real transaction
                          data
                        </p>
                      );
                    })()}
                  </div>

                  {/* Factor Breakdown Table */}
                  <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#D4AF37]" /> Valuation
                      Factor Breakdown
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Base Price/sqft",
                          value: `₹${engineResultV2.breakdown.basePrice.toLocaleString("en-IN")}`,
                          multiplier: "",
                          bar:
                            (engineResultV2.breakdown.basePrice / 12000) * 100,
                        },
                        {
                          label: "Location Factor",
                          value: `×${engineResultV2.breakdown.locationFactor.toFixed(3)}`,
                          multiplier: `Micro ${engineResultV2.breakdown.microWeight.toFixed(2)} × Metro ${engineResultV2.breakdown.metroFactor}`,
                          bar: engineResultV2.breakdown.locationFactor * 80,
                        },
                        {
                          label: "Builder Factor",
                          value: `×${engineResultV2.breakdown.builderFactor.toFixed(2)}`,
                          multiplier:
                            engineResultV2.breakdown.builderFactor >= 1.08
                              ? "Tier A"
                              : engineResultV2.breakdown.builderFactor >= 1.05
                                ? "Tier B"
                                : "Tier C/Local",
                          bar:
                            ((engineResultV2.breakdown.builderFactor - 0.9) /
                              0.2) *
                            100,
                        },
                        {
                          label: "Demand Factor",
                          value: `×${engineResultV2.breakdown.demandFactor.toFixed(3)}`,
                          multiplier: "Tech proximity boost",
                          bar:
                            ((engineResultV2.breakdown.demandFactor - 1) /
                              0.15) *
                            100,
                        },
                        {
                          label: "Livability Factor",
                          value: `×${engineResultV2.breakdown.livabilityFactor.toFixed(3)}`,
                          multiplier: "Amenity proximity boost",
                          bar:
                            ((engineResultV2.breakdown.livabilityFactor - 1) /
                              0.1) *
                            100,
                        },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex items-center gap-3">
                            <div className="w-36 text-white/50 text-xs shrink-0">
                              {row.label}
                            </div>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#D4AF37]/50 to-[#D4AF37] rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(0, row.bar))}%`,
                                }}
                              />
                            </div>
                            <div className="w-24 text-right text-[#D4AF37] text-xs font-mono shrink-0">
                              {row.value}
                            </div>
                          </div>
                          {row.multiplier && (
                            <div className="text-white/25 text-xs ml-36 mt-0.5">
                              {row.multiplier}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs text-white/40 mt-3">
                      <div>
                        📍 Metro: {engineResultV2.breakdown.metroName} (
                        {engineResultV2.breakdown.metroDistance} km)
                      </div>
                      <div>
                        🏢 Tech: {engineResultV2.breakdown.nearestTechPark}
                      </div>
                      <div>
                        🏥 Amenities within 5km:{" "}
                        {engineResultV2.breakdown.amenitiesCount}
                      </div>
                      <div>
                        📊 Price/sqft: ₹
                        {engineResultV2.pricePerSqft.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Comparable Sales */}
                  {comparables.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#D4AF37]" />{" "}
                        Comparable Recent Sales
                      </h3>
                      <div className="space-y-3">
                        {comparables.map((c, i) => (
                          <div
                            key={c.id}
                            data-ocid={`valuation.comparable.item.${i + 1}`}
                            className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white/90 text-xs font-medium truncate">
                                  {c.project}
                                </span>
                                <span className="text-white/30 text-xs">
                                  {c.locality}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-white/40 text-xs">
                                <span>{c.bhk}BHK</span>
                                <span>·</span>
                                <span>
                                  {c.area.toLocaleString("en-IN")} sqft
                                </span>
                                <span>·</span>
                                <span>{c.distance}</span>
                                <span>·</span>
                                <span>{c.saleDate}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[#D4AF37] font-bold text-sm font-mono">
                                {c.salePrice >= 10000000
                                  ? `₹${(c.salePrice / 10000000).toFixed(2)}Cr`
                                  : `₹${(c.salePrice / 100000).toFixed(1)}L`}
                              </div>
                              <div className="text-white/30 text-xs">
                                ₹{c.pricePerSqft.toLocaleString("en-IN")}/sqft
                              </div>
                              <div className="text-green-400/70 text-xs mt-0.5">
                                {c.similarityScore}% match
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Negotiation insight */}
              <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 mb-4">
                <p className="text-blue-300 text-sm">
                  💡 Recent transactions suggest sellers accept{" "}
                  <strong>4–6% negotiation below listing price</strong> in{" "}
                  {currentLocation.locality}.
                </p>
              </div>

              {/* Source data */}
              <div
                data-ocid="valuation.source_data.panel"
                className="rounded-2xl border border-white/10 bg-white/5 mb-6"
              >
                <button
                  type="button"
                  onClick={() => setSourceOpen(!sourceOpen)}
                  className="w-full flex items-center justify-between p-5 text-white/70 hover:text-white transition-colors"
                >
                  <span className="font-medium text-sm">
                    Source Data & References
                  </span>
                  {sourceOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <AnimatePresence>
                  {sourceOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-2">
                        {[
                          "RERA Filing Nov 2024",
                          "MagicBricks Listing Mar 2026",
                          "Registration Data Feb 2026",
                          "Circle Rate Data (Govt. 2025)",
                          "99acres Listings Mar 2026",
                        ].map((src) => (
                          <div key={src} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            <span className="text-white/60 text-sm">{src}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CTAs */}
              <div className="flex gap-3">
                <Button
                  data-ocid="valuation.wealth_report.list_property_button"
                  onClick={() =>
                    toast.success(
                      "Module 4 — Seller Listing Engine coming soon!",
                    )
                  }
                  className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-base rounded-xl"
                >
                  List This Property
                </Button>
                <Button
                  data-ocid="valuation.wealth_report.new_valuation_button"
                  onClick={() => {
                    setStep(1);
                    setPropertyType(null);
                    setResult(null);
                    setFlat({
                      bhk: null,
                      carpetArea: "",
                      superBuiltUp: "",
                      floor: 1,
                      totalFloors: 5,
                      age: null,
                      furnishing: null,
                      builder: "",
                      projectName: "",
                      rera: "",
                      khata: null,
                      mahareraRegistered: false,
                      extract712: false,
                      tenure: null,
                      mcdCategory: "",
                      clubhouse: false,
                      infinityPool: false,
                    });
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/70 hover:bg-white/5 py-4 text-base rounded-xl"
                >
                  <X className="mr-2 w-4 h-4" /> New Valuation
                </Button>
              </div>

              {/* AI Learning Panel */}
              <div className="mt-6">
                <AILearningIndicator />
              </div>

              {/* Submit Sold Price */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-blue-300/30 bg-blue-400/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-blue-300">
                    Help improve AI accuracy
                  </p>
                  <p className="text-xs text-blue-400/60">
                    Submit your actual sold price to improve predictions
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoldModalOpen(true)}
                  data-ocid="valuation.submit_sold_price.button"
                  className="border-blue-400/30 text-blue-300 hover:bg-blue-400/10"
                >
                  Submit Sold Price
                </Button>
              </div>

              <SubmitSoldPriceModal
                open={soldModalOpen}
                onClose={() => setSoldModalOpen(false)}
              />
              {/* Footer */}
              <p className="text-center text-white/30 text-xs mt-8">
                © {new Date().getFullYear()}. Built with love using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-yellow-400/60 hover:text-yellow-400"
                >
                  caffeine.ai
                </a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
