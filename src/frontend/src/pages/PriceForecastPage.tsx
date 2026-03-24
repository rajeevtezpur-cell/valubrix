import { useEffect, useRef, useState } from "react";
import BuyerLayout from "../components/BuyerLayout";
import SmartLocationSearch from "../components/SmartLocationSearch";
import type { LocationRecord } from "../data/locationData";

const LOCALITIES = [
  {
    name: "Whitefield",
    city: "Bangalore",
    current: 7800,
    y1: 6,
    y3: 18,
    y5: 32,
  },
  {
    name: "Sarjapur Road",
    city: "Bangalore",
    current: 7200,
    y1: 7,
    y3: 21,
    y5: 36,
  },
  {
    name: "Indiranagar",
    city: "Bangalore",
    current: 14500,
    y1: 5,
    y3: 16,
    y5: 28,
  },
  {
    name: "Koramangala",
    city: "Bangalore",
    current: 13200,
    y1: 5,
    y3: 15,
    y5: 27,
  },
  {
    name: "Devanahalli",
    city: "Bangalore",
    current: 5800,
    y1: 9,
    y3: 28,
    y5: 48,
  },
  {
    name: "Electronic City",
    city: "Bangalore",
    current: 5400,
    y1: 6,
    y3: 19,
    y5: 33,
  },
  { name: "Hebbal", city: "Bangalore", current: 7200, y1: 8, y3: 23, y5: 39 },
  {
    name: "Thanisandra",
    city: "Bangalore",
    current: 6400,
    y1: 7,
    y3: 22,
    y5: 37,
  },
  {
    name: "Yelahanka",
    city: "Bangalore",
    current: 5600,
    y1: 8,
    y3: 25,
    y5: 42,
  },
  {
    name: "Marathahalli",
    city: "Bangalore",
    current: 8200,
    y1: 6,
    y3: 18,
    y5: 30,
  },
  { name: "Baner", city: "Pune", current: 9200, y1: 7, y3: 22, y5: 38 },
  { name: "Wakad", city: "Pune", current: 8600, y1: 6, y3: 19, y5: 34 },
  { name: "Hinjewadi", city: "Pune", current: 7800, y1: 8, y3: 24, y5: 41 },
  {
    name: "Koregaon Park",
    city: "Pune",
    current: 12800,
    y1: 4,
    y3: 13,
    y5: 22,
  },
  {
    name: "Gurgaon Sector 45",
    city: "Delhi NCR",
    current: 11500,
    y1: 6,
    y3: 18,
    y5: 30,
  },
  { name: "Dwarka", city: "Delhi NCR", current: 7200, y1: 5, y3: 15, y5: 26 },
];

type Horizon = "y1" | "y3" | "y5";
const HORIZON_LABELS: Record<Horizon, string> = {
  y1: "1 Year",
  y3: "3 Years",
  y5: "5 Years",
};
const PROP_MULTIPLIERS: Record<string, number> = {
  Flat: 1.0,
  Villa: 1.15,
  Plot: 1.3,
};

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 200);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(...data);
  const w = 200;
  const h = 60;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h * 0.9}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" aria-hidden="true">
      <defs>
        <linearGradient
          id={`grad${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={drawn ? 2 : 0}
        strokeLinejoin="round"
        style={{ transition: "stroke-width 0.5s" }}
      />
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#grad${color.replace("#", "")})`}
        style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.6s" }}
      />
    </svg>
  );
}

function buildTrendData(
  current: number,
  growthPct: number,
  points: number,
): number[] {
  const result: number[] = [];
  for (let i = 0; i <= points; i++) {
    result.push(Math.round(current * (1 + (growthPct / 100) * (i / points))));
  }
  return result;
}

export default function PriceForecastPage() {
  const [horizon, setHorizon] = useState<Horizon>("y3");
  const [propType, setPropType] = useState<"Flat" | "Villa" | "Plot">("Flat");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedLoc, setSelectedLoc] = useState<(typeof LOCALITIES)[0] | null>(
    null,
  );
  const [searchKey, setSearchKey] = useState("");

  const cities = ["All", ...Array.from(new Set(LOCALITIES.map((l) => l.city)))];
  const multiplier = PROP_MULTIPLIERS[propType];

  const filtered = LOCALITIES.filter((l) => {
    if (selectedCity !== "All" && l.city !== selectedCity) return false;
    if (searchKey && !l.name.toLowerCase().includes(searchKey.toLowerCase()))
      return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => b[horizon] - a[horizon]);

  const handleSearchSelect = (loc: LocationRecord) => {
    const match =
      LOCALITIES.find((l) => l.name.toLowerCase() === loc.name.toLowerCase()) ??
      null;
    if (match) {
      setSelectedLoc(match);
      setSelectedCity("All");
      setSearchKey("");
    } else {
      setSearchKey(loc.name);
    }
  };

  const focusedLoc = selectedLoc ?? sorted[0] ?? null;

  return (
    <BuyerLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Price Forecast</h1>
          <p className="text-white/50">
            AI-powered property price growth predictions by locality.
          </p>
        </div>

        {/* Smart Search */}
        <div className="mb-6">
          <SmartLocationSearch
            placeholder="Search any locality for price forecast..."
            onSelect={handleSearchSelect}
            data-ocid="forecast.search_input"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex gap-2">
            {(["Flat", "Villa", "Plot"] as const).map((t) => (
              <button
                key={t}
                type="button"
                data-ocid="forecast.tab"
                onClick={() => setPropType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${propType === t ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-2">
            {(["y1", "y3", "y5"] as Horizon[]).map((h) => (
              <button
                key={h}
                type="button"
                data-ocid={`forecast.horizon.${h}.button`}
                onClick={() => setHorizon(h)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${horizon === h ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
              >
                {HORIZON_LABELS[h]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${selectedCity === city ? "bg-blue-500/30 text-blue-300 border border-blue-500/50" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Analysis for selected locality */}
        {focusedLoc && (
          <div className="bg-gradient-to-r from-[#D4AF37]/10 to-white/5 border border-[#D4AF37]/30 rounded-2xl p-6 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[#D4AF37] text-xs uppercase tracking-widest mb-1">
                  Detailed Analysis
                </p>
                <h2 className="text-white text-xl font-bold">
                  {focusedLoc.name}
                </h2>
                <p className="text-white/40 text-sm">{focusedLoc.city}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(["y1", "y3", "y5"] as Horizon[]).map((h) => {
                  const growth = Math.round(focusedLoc[h] * multiplier);
                  const forecast = Math.round(
                    focusedLoc.current * multiplier * (1 + growth / 100),
                  );
                  return (
                    <div
                      key={h}
                      className={`text-center p-3 rounded-xl border ${horizon === h ? "border-[#D4AF37]/50 bg-[#D4AF37]/10" : "border-white/10 bg-white/5"}`}
                    >
                      <p className="text-white/40 text-xs">
                        {HORIZON_LABELS[h]}
                      </p>
                      <p className="text-[#D4AF37] font-bold text-lg">
                        +{growth}%
                      </p>
                      <p className="text-white/60 text-xs">
                        ₹{Math.round(forecast / 1000)}K/sqft
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4">
              <MiniChart
                data={buildTrendData(
                  focusedLoc.current * multiplier,
                  focusedLoc[horizon] * multiplier,
                  8,
                )}
                color="#D4AF37"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>
                  Now ₹{Math.round((focusedLoc.current * multiplier) / 1000)}K
                </span>
                <span>
                  Forecast ₹
                  {Math.round(
                    (focusedLoc.current *
                      multiplier *
                      (1 + (focusedLoc[horizon] * multiplier) / 100)) /
                      1000,
                  )}
                  K / sqft
                </span>
              </div>

              {/* Scenario Cards */}
              <div className="mt-5">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>AI Scenario Projections</span>
                  <span className="text-[#D4AF37]/60">
                    ({HORIZON_LABELS[horizon]})
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Conservative",
                      multiplierFactor: 0.6,
                      color: "#60a5fa",
                      desc: "Low growth environment",
                    },
                    {
                      label: "Realistic",
                      multiplierFactor: 1.0,
                      color: "#D4AF37",
                      desc: "Historical trend continues",
                    },
                    {
                      label: "Aggressive",
                      multiplierFactor: 1.6,
                      color: "#22c55e",
                      desc: "Infra + demand surge",
                    },
                  ].map((scenario) => {
                    const scenarioGrowth = Math.round(
                      focusedLoc[horizon] *
                        multiplier *
                        scenario.multiplierFactor,
                    );
                    const scenarioPrice = Math.round(
                      focusedLoc.current *
                        multiplier *
                        (1 + scenarioGrowth / 100),
                    );
                    return (
                      <div
                        key={scenario.label}
                        className="p-3 rounded-xl border border-white/10 bg-white/3"
                      >
                        <div
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: scenario.color }}
                        >
                          {scenario.label}
                        </div>
                        <div
                          className="text-lg font-bold font-mono"
                          style={{ color: scenario.color }}
                        >
                          +{scenarioGrowth}%
                        </div>
                        <div className="text-white/60 text-xs mt-0.5">
                          ₹{Math.round(scenarioPrice / 1000)}K/sqft
                        </div>
                        <div className="text-white/25 text-[9px] mt-1">
                          {scenario.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-white/20 text-[10px] mt-3 italic">
                  AI-based projection, not financial advice. Market conditions
                  may vary.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((loc) => {
            const growth = Math.round(loc[horizon] * multiplier);
            const forecast = Math.round(
              loc.current * multiplier * (1 + growth / 100),
            );
            const isFocused = selectedLoc?.name === loc.name;
            return (
              <button
                type="button"
                key={loc.name}
                data-ocid="forecast.card"
                onClick={() => setSelectedLoc(isFocused ? null : loc)}
                className={`text-left bg-white/5 border rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${
                  isFocused
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/8"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-semibold">{loc.name}</p>
                    <p className="text-white/40 text-xs">{loc.city}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      growth >= 30
                        ? "bg-green-500/20 text-green-300"
                        : growth >= 15
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    +{growth}%
                  </span>
                </div>
                <MiniChart
                  data={buildTrendData(loc.current * multiplier, growth, 6)}
                  color={
                    growth >= 30
                      ? "#10b981"
                      : growth >= 15
                        ? "#D4AF37"
                        : "#60a5fa"
                  }
                />
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-white/40">
                    Current: ₹{Math.round((loc.current * multiplier) / 1000)}
                    K/sqft
                  </span>
                  <span className="text-[#D4AF37] font-semibold">
                    ₹{Math.round(forecast / 1000)}K
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <p>No localities match your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchKey("");
                setSelectedCity("All");
              }}
              className="mt-3 text-[#D4AF37] underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
