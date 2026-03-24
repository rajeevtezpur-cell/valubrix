import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import AILearningIndicator from "../components/AILearningIndicator";
import AuditPanel from "../components/AuditPanel";
import BuyerLayout from "../components/BuyerLayout";
import GeoIntelligenceMap from "../components/GeoIntelligenceMap";
import ScoreDrillDownModal from "../components/ScoreDrillDownModal";
import type { DrillDownItem } from "../components/ScoreDrillDownModal";
import SmartLocationSearch from "../components/SmartLocationSearch";
import SubmitSoldPriceModal from "../components/SubmitSoldPriceModal";
import type { LocationRecord } from "../data/locationData";
import {
  type ValuationOutput,
  getDealScore,
  valuate,
} from "../engines/valuationEngine";
import { reverseGeocode } from "../utils/reverseGeocode";

function formatPrice(p: number) {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(1)} L`;
  return `₹${p.toLocaleString("en-IN")}`;
}

function ScoreRing({
  value,
  color,
  size = 80,
}: { value: number; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Score ring"
    >
      <title>Score ring</title>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={size * 0.075}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.075}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (value / 100) * circ }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function BuyerValuationPage() {
  const [form, setForm] = useState({
    city: "Bangalore",
    locality: "",
    project: "",
    builder: "",
    type: "flat" as "flat" | "villa" | "plot",
    area: "",
    bhk: 2,
    floor: 3,
    listingPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [showValuationMap, setShowValuationMap] = useState(false);
  const [result, setResult] = useState<ValuationOutput | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [infraOpen, setInfraOpen] = useState<string | null>(null);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    scoreType: "tech" | "amenity" | "location" | "demand" | "deal";
    title: string;
    items: DrillDownItem[];
    score: number;
  }>({
    open: false,
    scoreType: "tech",
    title: "",
    items: [],
    score: 0,
  });

  const handleValuate = () => {
    if (!form.area || !form.locality) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const output = valuate({
        locality: form.locality,
        builder: form.builder,
        city: form.city,
        area: Number(form.area),
        floor: form.floor,
        propertyType: form.type,
        bhk: form.bhk,
        listingPrice: form.listingPrice
          ? Number(form.listingPrice) * 100000
          : undefined,
      });
      setResult(output);
      setLoading(false);
    }, 1500);
  };

  const openModal = (
    scoreType: "tech" | "amenity" | "location" | "demand" | "deal",
    title: string,
    items: DrillDownItem[],
    score: number,
  ) => {
    setModalState({ open: true, scoreType, title, items, score });
  };

  const chip = (
    label: string | number,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      type="button"
      key={label}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active
          ? "bg-[#D4AF37] text-black border-[#D4AF37]"
          : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
      }`}
    >
      {label}
    </button>
  );

  const getDealColor = (classification: string) => {
    if (classification === "Strong Buy")
      return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
    if (classification === "Good Deal")
      return "text-green-400 bg-green-500/15 border-green-500/30";
    if (classification === "Fair Price")
      return "text-yellow-400 bg-yellow-500/15 border-yellow-500/30";
    return "text-red-400 bg-red-500/15 border-red-500/30";
  };

  const getPredClassColor = (cls: string) =>
    cls === "High Growth"
      ? "text-emerald-400"
      : cls === "Emerging"
        ? "text-yellow-400"
        : "text-orange-400";

  return (
    <BuyerLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center">
            <TrendingUp size={22} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              AI Property Valuation
            </h1>
            <p className="text-white/50 text-sm">
              Get instant fair market value + investment intelligence
            </p>
          </div>
        </div>

        {/* Form */}
        <div
          className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5"
          data-ocid="buyer.valuation.form"
        >
          {/* City */}
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
              City
            </p>
            <select
              data-ocid="buyer.valuation.city.select"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="Bangalore">Bangalore</option>
              <option value="Pune">Pune</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          {/* Locality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide">
                Locality{" "}
                {pinnedLocation && (
                  <span className="ml-2 text-[#D4AF37] normal-case">
                    📍 Map pin active
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowValuationMap((v) => !v)}
                className="text-xs px-3 py-1 rounded-lg border transition-all"
                style={{
                  borderColor: showValuationMap
                    ? "#D4AF37"
                    : "rgba(255,255,255,0.2)",
                  color: showValuationMap ? "#D4AF37" : "rgba(255,255,255,0.5)",
                  background: showValuationMap
                    ? "rgba(212,175,55,0.1)"
                    : "transparent",
                }}
              >
                📍 Pin on Map
              </button>
            </div>
            <SmartLocationSearch
              placeholder="e.g. Whitefield, Koramangala"
              onSelect={(loc: LocationRecord) => {
                setForm((f) => ({ ...f, locality: loc.name, city: loc.city }));
                setPinnedLocation(null);
              }}
              className="w-full"
            />
            {showValuationMap && (
              <div className="mt-3 rounded-xl overflow-hidden border border-[#D4AF37]/20">
                <GeoIntelligenceMap
                  lat={pinnedLocation?.lat ?? 12.9352}
                  lng={pinnedLocation?.lng ?? 77.6245}
                  name={pinnedLocation?.label ?? "Bangalore"}
                  city={form.city}
                  height={260}
                  onLocationChange={(lat, lng, name) => {
                    setPinnedLocation({ lat, lng, label: name });
                    setForm((f) => ({ ...f, locality: name }));
                  }}
                />
                {pinnedLocation && (
                  <div className="bg-white/5 border-t border-[#D4AF37]/20 px-4 py-2.5 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="text-white font-semibold text-sm truncate flex-1">
                      {pinnedLocation.label}
                    </span>
                    <span className="font-mono text-[11px] text-white/40 shrink-0">
                      {pinnedLocation.lat.toFixed(4)}°N,{" "}
                      {pinnedLocation.lng.toFixed(4)}°E
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Project + Builder */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
                Project Name <span className="text-white/30">(optional)</span>
              </p>
              <input
                type="text"
                placeholder="e.g. Prestige Lakeside"
                value={form.project}
                onChange={(e) =>
                  setForm((f) => ({ ...f, project: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
                Builder <span className="text-white/30">(optional)</span>
              </p>
              <input
                type="text"
                placeholder="e.g. Sobha, Brigade"
                value={form.builder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, builder: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Property Type */}
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
              Property Type
            </p>
            <div className="flex gap-2">
              {(["flat", "villa", "plot"] as const).map((t) =>
                chip(
                  t.charAt(0).toUpperCase() + t.slice(1),
                  form.type === t,
                  () => setForm((f) => ({ ...f, type: t })),
                ),
              )}
            </div>
          </div>

          {/* Area */}
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
              Area (sq ft)
            </p>
            <input
              data-ocid="buyer.valuation.area.input"
              type="number"
              placeholder="e.g. 1200"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {form.type !== "plot" && (
            <>
              {/* BHK */}
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
                  BHK
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((b) =>
                    chip(`${b}${b === 4 ? "+" : ""} BHK`, form.bhk === b, () =>
                      setForm((f) => ({ ...f, bhk: b })),
                    ),
                  )}
                </div>
              </div>

              {/* Floor */}
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
                  Floor
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        floor: Math.max(0, f.floor - 1),
                      }))
                    }
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white hover:border-[#D4AF37] transition-all"
                  >
                    −
                  </button>
                  <span className="text-white font-mono w-8 text-center">
                    {form.floor}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, floor: f.floor + 1 }))
                    }
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white hover:border-[#D4AF37] transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Listing Price (optional) */}
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
              Listing Price in Lakhs{" "}
              <span className="text-white/30">(optional — for Deal Score)</span>
            </p>
            <input
              data-ocid="buyer.valuation.listing_price.input"
              type="number"
              placeholder="e.g. 130 for ₹1.30 Cr"
              value={form.listingPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, listingPrice: e.target.value }))
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button
            type="button"
            data-ocid="buyer.valuation.submit_button"
            onClick={handleValuate}
            disabled={loading || !form.area || !form.locality}
            className="w-full bg-[#D4AF37] hover:bg-[#B8960C] disabled:opacity-60 text-black font-bold py-3.5 rounded-xl transition-all hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] text-sm"
          >
            {loading ? "Analyzing Property..." : "Run AI Valuation"}
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded-2xl animate-pulse"
              />
            ))}
            <div
              data-ocid="buyer.valuation.loading_state"
              className="text-center text-white/30 text-sm py-2"
            >
              <Loader2 className="inline animate-spin mr-2" size={14} />
              Running AI engines…
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <motion.div
            data-ocid="buyer.valuation.results.panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <h2 className="text-white font-bold text-xl">Valuation Results</h2>
            <p className="text-white/40 text-sm">
              {form.locality}, {form.city} · {form.type} · {form.area} sq ft
            </p>

            {/* FMV Card */}
            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-6 text-center">
              <p className="text-white/50 text-sm mb-1">Fair Market Value</p>
              <p className="text-4xl font-bold text-[#D4AF37] font-mono">
                {formatPrice(result.fMV)}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-white/40 text-sm">
                  {formatPrice(result.range[0])}
                </span>
                <div className="flex-1 max-w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37]/40 to-[#D4AF37] rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
                <span className="text-white/40 text-sm">
                  {formatPrice(result.range[1])}
                </span>
              </div>
              <p className="text-white/30 text-xs mt-2">
                ₹{result.pricePerSqft.toLocaleString("en-IN")}/sq ft ·{" "}
                {result.confidence}% confidence
              </p>
              {result.nearestMetroName && (
                <p className="text-white/25 text-xs mt-1">
                  <MapPin size={10} className="inline mr-1" />
                  {result.nearestMetroName} — {result.metroDistance?.toFixed(1)}{" "}
                  km
                </p>
              )}
            </div>

            {/* Clickable Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Tech Score",
                  value: result.scores.tech,
                  color: "#60a5fa",
                  scoreType: "tech" as const,
                  items: result.infra.topTechParks.map((p) => ({
                    name: p.name,
                    distance: p.travelTimeMin,
                    weight: p.weight,
                    contribution: `${p.travelTimeMin}min·${p.roadKm}km`,
                  })),
                },
                {
                  label: "Amenity Score",
                  value: result.scores.amenity,
                  color: "#a78bfa",
                  scoreType: "amenity" as const,
                  items: [
                    ...result.infra.topHospitals,
                    ...result.infra.topSchools,
                  ].map((a) => ({
                    name: a.name,
                    distance: a.travelTimeMin,
                    rating: a.rating,
                    contribution: `${a.travelTimeMin}min`,
                  })),
                },
                {
                  label: "Builder Score",
                  value: result.scores.builder,
                  color: "#D4AF37",
                  scoreType: "demand" as const,
                  items: [
                    {
                      name: form.builder || "Local/Unknown",
                      contribution: `×${result.factors.builderFactor.toFixed(2)}`,
                    },
                  ],
                },
                {
                  label: "Location Score",
                  value: result.scores.location,
                  color: "#34d399",
                  scoreType: "location" as const,
                  items: result.infra.nearestMetros.map((m) => ({
                    name: m.name,
                    distance: m.travelTimeMin,
                    line: m.line,
                    contribution: `${m.travelTimeMin}min·${m.roadKm}km`,
                  })),
                },
              ].map((s) => (
                <button
                  type="button"
                  key={s.label}
                  data-ocid={`buyer.valuation.score.${s.scoreType}.card`}
                  onClick={() =>
                    openModal(s.scoreType, s.label, s.items, s.value)
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-all hover:border-[#D4AF37]/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] cursor-pointer group"
                >
                  <div className="flex justify-center mb-1">
                    <ScoreRing value={s.value} color={s.color} size={52} />
                    <div className="absolute" style={{ marginTop: 14 }}>
                      <span
                        className="font-bold text-sm"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </span>
                    </div>
                  </div>
                  <div className="relative -mt-8">
                    <div
                      className="text-xl font-bold font-mono"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div className="text-white/40 text-[10px] mt-0.5">
                      {s.label}
                    </div>
                  </div>
                  <div className="mt-1 text-white/25 text-[9px] group-hover:text-[#D4AF37]/60 transition-colors">
                    Click to explore ›
                  </div>
                </button>
              ))}
            </div>

            {/* Confidence Bar */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60 text-xs font-medium">
                  Confidence Score
                </span>
                <span
                  className={`font-bold text-xs font-mono ${
                    result.confidence >= 80
                      ? "text-emerald-400"
                      : result.confidence >= 65
                        ? "text-yellow-400"
                        : "text-orange-400"
                  }`}
                >
                  {result.confidence}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Deal Score — only if listing price provided */}
            {result.deal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                data-ocid="buyer.valuation.deal.panel"
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-[#D4AF37]" /> Deal Score
                  Analysis
                </h3>
                <div className="flex items-center gap-6">
                  {/* Circular gauge */}
                  <div className="relative flex-shrink-0">
                    <ScoreRing
                      value={result.deal.score}
                      color={
                        result.deal.score >= 75
                          ? "#10b981"
                          : result.deal.score >= 60
                            ? "#22c55e"
                            : result.deal.score >= 40
                              ? "#eab308"
                              : "#ef4444"
                      }
                      size={88}
                    />
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-white font-bold text-xl">
                        {result.deal.score}
                      </span>
                      <span className="text-white/40 text-[9px]">/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${getDealColor(result.deal.classification)}`}
                    >
                      {result.deal.classification}
                    </span>
                    <p className="text-white font-semibold">
                      {result.deal.label}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {result.deal.pctDiff > 0
                        ? `${result.deal.pctDiff.toFixed(1)}% below fair value — good entry point`
                        : `${Math.abs(result.deal.pctDiff).toFixed(1)}% above fair value — negotiate down`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Recommendation */}
            {result.recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                data-ocid="buyer.valuation.recommendation.panel"
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.25)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <Star size={18} className="text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm">
                        AI Recommendation
                      </h3>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                        style={{
                          color: result.recommendation.actionColor,
                          borderColor: `${result.recommendation.actionColor}40`,
                          background: `${result.recommendation.actionColor}15`,
                        }}
                      >
                        {result.recommendation.action}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {result.recommendation.text}
                    </p>
                    <p className="text-white/30 text-xs mt-2">
                      Confidence: {result.recommendation.confidence}%
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Price Prediction */}
            <div
              data-ocid="buyer.valuation.prediction.panel"
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-white/60 text-xs font-medium uppercase tracking-wide">
                    1 Year Forecast
                  </span>
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  {formatPrice(result.prediction.oneYearPrice)}
                </p>
                <p
                  className={`text-sm font-semibold mt-1 ${getPredClassColor(result.prediction.classification)}`}
                >
                  +{result.prediction.pctGrowth1Y.toFixed(1)}% growth
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${getPredClassColor(result.prediction.classification)} bg-white/5`}
                >
                  {result.prediction.classification}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-blue-400" />
                  <span className="text-white/60 text-xs font-medium uppercase tracking-wide">
                    3 Year Forecast
                  </span>
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  {formatPrice(result.prediction.threeYearPrice)}
                </p>
                <p className="text-sm font-semibold mt-1 text-blue-400">
                  +{result.prediction.pctGrowth3Y.toFixed(1)}% growth
                </p>
                <p className="text-white/30 text-[10px] mt-2">
                  {result.prediction.growthDriver}
                </p>
              </div>
            </div>

            {/* Why This Price */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <button
                type="button"
                data-ocid="buyer.valuation.why_price.toggle"
                onClick={() => setWhyOpen((o) => !o)}
                className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#D4AF37]" /> Why
                  This Price?
                </span>
                {whyOpen ? (
                  <ChevronUp size={16} className="text-white/40" />
                ) : (
                  <ChevronDown size={16} className="text-white/40" />
                )}
              </button>
              <AnimatePresence>
                {whyOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/50">
                          Base Price (locality avg)
                        </span>
                        <span className="text-white font-mono">
                          ₹
                          {result.priceExplanation.basePrice.toLocaleString(
                            "en-IN",
                          )}
                          /sqft
                        </span>
                      </div>
                      {[
                        {
                          label: "Location Factor",
                          value: result.priceExplanation.locationContrib,
                          color: "#34d399",
                        },
                        {
                          label: "Builder Premium",
                          value: result.priceExplanation.builderContrib,
                          color: "#D4AF37",
                        },
                        {
                          label: "Demand Factor",
                          value: result.priceExplanation.demandContrib,
                          color: "#60a5fa",
                        },
                        {
                          label: "Livability Factor",
                          value: result.priceExplanation.livabilityContrib,
                          color: "#a78bfa",
                        },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-white/50">{row.label}</span>
                            <span
                              className="font-mono"
                              style={{ color: row.color }}
                            >
                              {row.value > 0 ? "+" : ""}
                              {row.value}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: row.color }}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(Math.abs(row.value) * 5, 100)}%`,
                              }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Infrastructure Breakdown */}
            <div
              data-ocid="buyer.valuation.infra.panel"
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/8">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Building2 size={14} className="text-[#D4AF37]" />{" "}
                  Infrastructure Breakdown
                </h3>
              </div>
              {[
                {
                  key: "metros",
                  label: "Nearest Metro Stations",
                  items: result.infra.nearestMetros,
                  renderItem: (m: (typeof result.infra.nearestMetros)[0]) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            m.line === "Purple"
                              ? "bg-purple-500"
                              : m.line === "Green"
                                ? "bg-green-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <span className="text-white/80 text-xs">{m.name}</span>
                        <span className="text-white/30 text-xs">{m.line}</span>
                      </div>
                      <span className="text-[#D4AF37] text-xs font-mono">
                        {m.travelTimeMin} mins ({m.roadKm} km)
                      </span>
                    </div>
                  ),
                },
                {
                  key: "parks",
                  label: "Nearby Tech Parks",
                  items: result.infra.topTechParks,
                  renderItem: (p: (typeof result.infra.topTechParks)[0]) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <span className="text-white/80 text-xs">{p.name}</span>
                      <span className="text-white/40 text-xs font-mono">
                        {p.travelTimeMin} mins ({p.roadKm} km)
                      </span>
                    </div>
                  ),
                },
                {
                  key: "health",
                  label: "Hospitals & Schools",
                  items: [
                    ...result.infra.topHospitals,
                    ...result.infra.topSchools,
                  ]
                    .sort((a, b) => a.travelTimeMin - b.travelTimeMin)
                    .slice(0, 5),
                  renderItem: (h: (typeof result.infra.topHospitals)[0]) => (
                    <div
                      key={h.name}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div>
                        <span className="text-white/80 text-xs">{h.name}</span>
                        {h.rating && (
                          <span className="text-yellow-400 text-xs ml-2">
                            <Star size={9} className="inline" /> {h.rating}
                          </span>
                        )}
                      </div>
                      <span className="text-white/40 text-xs font-mono">
                        {h.travelTimeMin} mins ({h.roadKm} km)
                      </span>
                    </div>
                  ),
                },
              ].map((section) => (
                <div key={section.key}>
                  <button
                    type="button"
                    data-ocid={`buyer.valuation.infra.${section.key}.toggle`}
                    onClick={() =>
                      setInfraOpen(
                        infraOpen === section.key ? null : section.key,
                      )
                    }
                    className="w-full flex items-center justify-between px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium"
                  >
                    {section.label}
                    {infraOpen === section.key ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  <AnimatePresence>
                    {infraOpen === section.key && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-2">
                          {(section.items as any[]).map((item: any) =>
                            section.renderItem(item),
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* AI Audit Panel */}
            <AuditPanel
              title="AI Valuation Analysis"
              confidence={result.confidence}
              confidenceReason={
                result.confidence >= 80
                  ? "High data density and comparable coverage"
                  : result.confidence >= 65
                    ? "Moderate comparables — reasonable accuracy"
                    : "Sparse comparables — low transaction density"
              }
              breakdown={[
                {
                  label: "Comparables",
                  value: formatPrice(Math.round(result.fMV * 0.5)),
                  contribution: 50,
                  explanation: "Based on 3–5 similar properties",
                },
                {
                  label: "Location Score",
                  value: `${result.scores.location}/100`,
                  contribution: 20,
                  explanation: "Metro proximity + micro-location",
                },
                {
                  label: "Demand Signal",
                  value: `${result.scores.demand}/100`,
                  contribution: 15,
                  explanation: "Buyer demand & transaction velocity",
                },
                {
                  label: "Infrastructure",
                  value: `${result.scores.tech}/100`,
                  contribution: 15,
                  explanation: "Tech parks, hospitals, schools nearby",
                },
                {
                  label: "Price/sqft",
                  value: `₹${result.pricePerSqft.toLocaleString("en-IN")}`,
                  explanation: "Normalized price per square foot",
                },
              ]}
              disclaimer="Computed by ValuBrix AI backend. Data sourced from market intelligence. Not financial advice."
            />

            {/* AI Learning Indicator */}
            <AILearningIndicator />

            {/* Submit Sold Price */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-amber-300 text-sm font-semibold">
                  Help improve AI accuracy
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  Submit actual sale price to train the model
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSoldModalOpen(true)}
                className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-all"
              >
                Submit Sold Price
              </button>
            </div>

            <SubmitSoldPriceModal
              open={soldModalOpen}
              onClose={() => setSoldModalOpen(false)}
            />

            {/* New Valuation button */}
            <button
              type="button"
              // @audit-panel-anchor
              data-ocid="buyer.valuation.reset.button"
              onClick={() => {
                setResult(null);
                setForm((f) => ({
                  ...f,
                  area: "",
                  locality: "",
                  listingPrice: "",
                }));
              }}
              className="w-full py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 transition-all text-sm"
            >
              Run New Valuation
            </button>
          </motion.div>
        )}
      </div>

      {/* Drill-down Modal */}
      <ScoreDrillDownModal
        isOpen={modalState.open}
        onClose={() => setModalState((s) => ({ ...s, open: false }))}
        scoreType={modalState.scoreType}
        title={modalState.title}
        items={modalState.items}
        score={modalState.score}
      />
    </BuyerLayout>
  );
}
