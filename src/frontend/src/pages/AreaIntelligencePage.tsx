import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  BarChart2,
  Brain,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  MapPin,
  Minus,
  Navigation,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import GeoIntelligenceMap from "../components/GeoIntelligenceMap";
import NearbyChips from "../components/NearbyChips";
import ScoreDrillDownModal from "../components/ScoreDrillDownModal";
import type { DrillDownItem } from "../components/ScoreDrillDownModal";
import SmartLocationSearch from "../components/SmartLocationSearch";
import SubLocalityPicker from "../components/SubLocalityPicker";
import locationData from "../data/locationData";
import type { LocationRecord } from "../data/locationData";
import {
  type AreaIntelligenceOutput,
  type ValuationOutput,
  getAreaIntelligence,
  getLocalityCoords,
  valuate,
} from "../engines/valuationEngine";
import {
  getLocationById,
  getNearbyLocalities,
  getPriceHistory,
  getSubLocalities,
} from "../utils/locationSearch";

const CITY_IMAGES: Record<string, string> = {
  Bangalore:
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=80",
  Delhi:
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=80",
  Mumbai:
    "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=1200&q=80",
  Hyderabad:
    "https://images.unsplash.com/photo-1563448927898-535e8b5e7d78?w=1200&q=80",
  Chennai:
    "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=1200&q=80",
  Kolkata:
    "https://images.unsplash.com/photo-1558431382-27e303142255?w=1200&q=80",
  Pune: "https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=1200&q=80",
  Patna:
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=80",
};

const DEFAULT_CITY_IMAGE =
  "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=80";

const LOCALITY_CAROUSEL: string[] = [
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
  "https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&q=80",
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
  "https://images.unsplash.com/photo-1459767129954-1b1c1f9b9ace?w=600&q=80",
  "https://images.unsplash.com/photo-1434082033009-b81d41d32e1f?w=600&q=80",
];

const CHART_GRID = [0, 0.25, 0.5, 0.75, 1];
const CHART_YLABELS = [0, 0.5, 1];

function PriceTrendChart({
  data,
}: { data: { year: string; price: number }[] }) {
  const [drawn, setDrawn] = useState(false);
  const W = 600;
  const H = 180;
  const pad = { top: 20, right: 20, bottom: 30, left: 55 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const prices = data.map((d) => d.price);
  const minP = Math.min(...prices) * 0.95;
  const maxP = Math.max(...prices) * 1.05;
  const xs = data.map((_, i) => pad.left + (i / (data.length - 1)) * iW);
  const ys = data.map(
    (d) => pad.top + iH - ((d.price - minP) / (maxP - minP)) * iH,
  );
  const pathD = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`)
    .join(" ");
  const areaD = `${pathD} L ${xs[xs.length - 1]} ${pad.top + iH} L ${xs[0]} ${pad.top + iH} Z`;
  const pathLen = 800;

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <title>Price trend chart</title>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {CHART_GRID.map((t) => (
        <line
          key={t}
          x1={pad.left}
          y1={pad.top + iH * (1 - t)}
          x2={pad.left + iW}
          y2={pad.top + iH * (1 - t)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {CHART_YLABELS.map((t) => (
        <text
          key={t}
          x={pad.left - 6}
          y={pad.top + iH * (1 - t) + 4}
          textAnchor="end"
          fill="rgba(255,255,255,0.4)"
          fontSize="11"
        >
          ₹{Math.round(minP + ((maxP - minP) * t) / 1000)}k
        </text>
      ))}
      {data.map((d) => (
        <text
          key={d.year}
          x={xs[data.indexOf(d)]}
          y={H - 8}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="11"
        >
          {d.year}
        </text>
      ))}
      {drawn && (
        <path
          d={areaD}
          fill="url(#areaGrad)"
          className="transition-all duration-700"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        style={{
          strokeDasharray: pathLen,
          strokeDashoffset: drawn ? 0 : pathLen,
          transition: "stroke-dashoffset 1.2s ease-in-out",
        }}
      />
      {drawn &&
        data.map((d) => (
          <g key={d.year}>
            <circle
              cx={xs[data.indexOf(d)]}
              cy={ys[data.indexOf(d)]}
              r="5"
              fill="#0a0f1e"
              stroke="#10b981"
              strokeWidth="2"
            />
            <circle
              cx={xs[data.indexOf(d)]}
              cy={ys[data.indexOf(d)]}
              r="2.5"
              fill="#10b981"
            />
          </g>
        ))}
    </svg>
  );
}

function MomentumIndicator({
  momentum,
}: { momentum?: "hot" | "stable" | "cooling" }) {
  const config = {
    hot: {
      label: "Hot Market",
      color: "#10b981",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/40",
      icon: <TrendingUp size={18} />,
    },
    stable: {
      label: "Stable Market",
      color: "#f59e0b",
      bg: "bg-amber-500/15",
      border: "border-amber-500/40",
      icon: <Minus size={18} />,
    },
    cooling: {
      label: "Cooling Market",
      color: "#ef4444",
      bg: "bg-red-500/15",
      border: "border-red-500/40",
      icon: <TrendingDown size={18} />,
    },
  };
  const cfg = config[momentum ?? "stable"];
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full ${cfg.bg} border ${cfg.border}`}
      style={{ color: cfg.color }}
      data-ocid="area.momentum.panel"
    >
      <span className="animate-pulse">{cfg.icon}</span>
      <span className="font-semibold text-sm">{cfg.label}</span>
    </div>
  );
}

export default function AreaIntelligencePage() {
  const { locationId } = useParams({ strict: false }) as { locationId: string };
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedSub, setSelectedSub] = useState<string | undefined>();

  const location = getLocationById(locationId, locationData);
  const nearby = location ? getNearbyLocalities(locationId, locationData) : [];
  const subLocalities = location
    ? getSubLocalities(locationId, locationData)
    : [];
  const priceHistory = location ? getPriceHistory(location) : [];
  const heroImage = location?.city
    ? (CITY_IMAGES[location.city] ?? DEFAULT_CITY_IMAGE)
    : DEFAULT_CITY_IMAGE;

  useEffect(() => {
    const t = setInterval(
      () => setCarouselIndex((i) => (i + 1) % LOCALITY_CAROUSEL.length),
      4000,
    );
    return () => clearInterval(t);
  }, []);

  const [areaIntel, setAreaIntel] = useState<AreaIntelligenceOutput | null>(
    null,
  );
  const [valuationForm, setValuationForm] = useState({
    bhk: 2,
    area: "1200",
    propertyType: "flat" as "flat" | "villa" | "plot",
    builder: "",
  });
  const [valuationResult, setValuationResult] =
    useState<ValuationOutput | null>(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [areaModalState, setAreaModalState] = useState<{
    open: boolean;
    scoreType: "tech" | "amenity" | "location" | "demand" | "deal";
    title: string;
    items: DrillDownItem[];
    score: number;
  }>({ open: false, scoreType: "tech", title: "", items: [], score: 0 });

  // Compute area intelligence once location is resolved
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — re-run only when locationId changes
  useEffect(() => {
    if (location) {
      try {
        const coords = getLocalityCoords(location.name);
        const intel = getAreaIntelligence(
          location.name,
          coords.lat,
          coords.lng,
        );
        setAreaIntel(intel);
      } catch {
        /* fallback gracefully */
      }
    }
  }, [location?.id]);

  const handleAreaValuate = () => {
    if (!location) return;
    setValuationLoading(true);
    setValuationResult(null);
    setTimeout(() => {
      const coords = getLocalityCoords(location.name);
      const result = valuate({
        locality: location.name,
        lat: coords.lat,
        lng: coords.lng,
        builder: valuationForm.builder,
        city: location.city,
        area: Number(valuationForm.area) || 1200,
        floor: 3,
        propertyType: valuationForm.propertyType,
        bhk: valuationForm.bhk,
      });
      setValuationResult(result);
      setValuationLoading(false);
    }, 1200);
  };

  const handleNearbySelect = (loc: LocationRecord) => {
    navigate({ to: "/area/$locationId", params: { locationId: loc.id } });
  };

  const handleSubSelect = (loc: LocationRecord) => {
    setSelectedSub(loc.id);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #05091a 0%, #0a0f1e 50%, #091422 100%)",
      }}
    >
      <nav
        className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl"
        style={{ background: "rgba(5,9,26,0.85)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            data-ocid="area.back_button"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:block">Back</span>
          </button>
          <a
            href="/"
            className="flex items-center gap-2 mr-4"
            data-ocid="area.logo.link"
          >
            <img
              src="/assets/uploads/5EB5878E-7937-4598-9486-6156F9B2EB9F-3-1.png"
              alt="ValuBrix"
              className="h-8 w-auto object-contain"
            />
          </a>
          <div className="flex-1 max-w-xl">
            <SmartLocationSearch
              onSelect={(loc) =>
                navigate({
                  to: "/area/$locationId",
                  params: { locationId: loc.id },
                })
              }
              placeholder="Search another locality..."
              size="default"
            />
          </div>
        </div>
      </nav>

      {!location ? (
        <div
          className="max-w-3xl mx-auto px-4 py-16 text-center"
          data-ocid="area.error_state"
        >
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8">
            <Activity size={40} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Limited locality data available
            </h2>
            <p className="text-white/60">
              Showing city level insights. Try searching for a specific area.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="mt-6 px-6 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors"
              data-ocid="area.back_home.button"
            >
              Return to Home
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div
            className="relative rounded-2xl overflow-hidden h-64 md:h-80"
            data-ocid="area.hero.panel"
          >
            <img
              src={heroImage}
              alt={location.city}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(5,9,26,0.9) 0%, rgba(5,9,26,0.5) 60%, transparent 100%)",
              }}
            />
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">
                  {location.city}, {location.state}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                {location.name}
              </h1>
              <p className="text-white/60 text-sm">
                {location.district} &bull; {location.pincode}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {location.avgPricePerSqft && (
                  <span className="floating-badge px-3 py-1.5 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm border border-white/15 text-white/85">
                    Avg Rent: ₹
                    {Math.round(location.avgPricePerSqft * 0.0025).toFixed(0)}
                    /sqft/mo
                  </span>
                )}
                {location.priceGrowthYoY && (
                  <span className="floating-badge px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 text-emerald-300">
                    Price Growth: +{location.priceGrowthYoY}% YoY
                  </span>
                )}
                {areaIntel && areaIntel.nearestMetros.length > 0 && (
                  <span className="floating-badge px-3 py-1.5 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm border border-white/15 text-white/85">
                    Metro: {areaIntel.nearestMetros[0].name} ~
                    {areaIntel.nearestMetros[0].distance.toFixed(1)}km
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            data-ocid="area.stats.panel"
          >
            <StatCard
              icon={<Building2 size={20} />}
              label="Avg Price / sqft"
              value={
                location.avgPricePerSqft
                  ? `₹${location.avgPricePerSqft.toLocaleString()}`
                  : "N/A"
              }
              color="emerald"
              index={1}
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="YoY Growth"
              value={
                location.priceGrowthYoY ? `+${location.priceGrowthYoY}%` : "N/A"
              }
              color="amber"
              index={2}
            />
            <StatCard
              icon={<BarChart2 size={20} />}
              label="Transactions"
              value={location.transactionVolume?.toString() ?? "N/A"}
              sub="last 12 months"
              color="blue"
              index={3}
            />
            <StatCard
              icon={<Activity size={20} />}
              label="Market"
              value={
                location.marketMomentum
                  ? location.marketMomentum.charAt(0).toUpperCase() +
                    location.marketMomentum.slice(1)
                  : "N/A"
              }
              color={
                location.marketMomentum === "hot"
                  ? "emerald"
                  : location.marketMomentum === "cooling"
                    ? "red"
                    : "amber"
              }
              index={4}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div
              className="md:col-span-2 rounded-2xl border border-white/8 bg-white/3 p-5"
              data-ocid="area.chart.panel"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Price Trend (2022 – 2026)
                </h3>
                <span className="text-xs text-white/40">₹ per sqft</span>
              </div>
              <PriceTrendChart data={priceHistory} />
            </div>

            <div className="space-y-4">
              <div
                className="rounded-2xl border border-white/8 bg-white/3 p-5"
                data-ocid="area.transactions.panel"
              >
                <h3 className="text-white font-semibold mb-3">
                  Recent Transactions
                </h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {location.transactionVolume ?? "N/A"}
                </div>
                <div className="text-xs text-white/50 mb-3">
                  transactions recorded
                </div>
                {location.avgPricePerSqft && (
                  <div className="text-sm text-white/70">
                    Price range:{" "}
                    <span className="text-white font-medium">
                      ₹
                      {Math.round(
                        location.avgPricePerSqft * 0.88,
                      ).toLocaleString()}
                    </span>
                    {" – "}
                    <span className="text-white font-medium">
                      ₹
                      {Math.round(
                        location.avgPricePerSqft * 1.15,
                      ).toLocaleString()}
                    </span>{" "}
                    /sqft
                  </div>
                )}
              </div>

              <div
                className="rounded-2xl border border-white/8 bg-white/3 p-5"
                data-ocid="area.momentum_card.panel"
              >
                <h3 className="text-white font-semibold mb-3">
                  Market Momentum
                </h3>
                <MomentumIndicator momentum={location.marketMomentum} />
              </div>

              <div
                className="rounded-2xl border border-white/8 bg-white/3 p-5"
                data-ocid="area.microbadge.panel"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={16} className="text-amber-400" />
                  <span className="text-xs text-white/50 uppercase tracking-wide">
                    Micro Market
                  </span>
                </div>
                <div className="text-white font-semibold">
                  {location.name}{" "}
                  {location.type === "locality" ? "East" : "Growth Corridor"}
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  {location.city} Metropolitan Area
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden border border-white/8"
            data-ocid="area.carousel.panel"
          >
            <div className="relative h-48 md:h-64">
              {LOCALITY_CAROUSEL.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${location.name} view ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                    i === carouselIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(5,9,26,0.8) 0%, transparent 50%)",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setCarouselIndex(
                    (i) =>
                      (i - 1 + LOCALITY_CAROUSEL.length) %
                      LOCALITY_CAROUSEL.length,
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                data-ocid="area.carousel.pagination_prev"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCarouselIndex((i) => (i + 1) % LOCALITY_CAROUSEL.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                data-ocid="area.carousel.pagination_next"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {LOCALITY_CAROUSEL.map((src, i) => (
                  <button
                    type="button"
                    key={src}
                    onClick={() => setCarouselIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === carouselIndex ? "bg-white w-4" : "bg-white/40 w-1.5"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {nearby.length > 0 && (
            <div
              className="rounded-2xl border border-white/8 bg-white/3 p-5"
              data-ocid="area.nearby.panel"
            >
              <h3 className="text-white font-semibold mb-3">
                Nearby Localities
              </h3>
              <NearbyChips
                localities={nearby}
                onSelect={handleNearbySelect}
                currentId={locationId}
              />
            </div>
          )}

          {subLocalities.length > 0 && (
            <div
              className="rounded-2xl border border-white/8 bg-white/3 p-5"
              data-ocid="area.sublocality.panel"
            >
              <h3 className="text-white font-semibold mb-3">
                Areas within {location.name}
              </h3>
              <SubLocalityPicker
                subLocalities={subLocalities}
                onSelect={handleSubSelect}
                selectedId={selectedSub}
              />
            </div>
          )}

          {/* AI Geo Intelligence Section */}
          <div
            className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5"
            data-ocid="area.geo_intel.panel"
          >
            <div className="flex items-center gap-2 mb-5">
              <Brain size={20} className="text-yellow-400" />
              <h3 className="text-white font-semibold">AI Geo Intelligence</h3>
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-yellow-300 text-xs font-medium">
                <Sparkles size={11} /> Live Analysis
              </span>
            </div>

            {/* Geo Intelligence Map */}
            {(() => {
              try {
                const mapCoords = getLocalityCoords(location.name);
                return (
                  <div className="mb-4" data-ocid="area.map_marker">
                    <GeoIntelligenceMap
                      lat={mapCoords.lat}
                      lng={mapCoords.lng}
                      name={location.name}
                      city={location.city}
                      height={240}
                    />
                  </div>
                );
              } catch {
                return null;
              }
            })()}

            {/* Intelligence Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-yellow-400" />
                  <span className="text-xs text-white/50">Metro Proximity</span>
                </div>
                <div className="font-semibold text-sm text-yellow-300">
                  {location.name === "Indiranagar" ||
                  location.name === "Whitefield" ||
                  location.name === "Hebbal" ||
                  location.name === "Jalahalli"
                    ? "Within 800m"
                    : "~1.5 km"}
                </div>
                <div className="text-xs text-yellow-400/60 mt-0.5">
                  +10% Metro Premium applied
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={14} className="text-blue-400" />
                  <span className="text-xs text-white/50">Amenity Score</span>
                </div>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                  {(location.priceGrowthYoY ?? 0) >= 10
                    ? "High"
                    : (location.priceGrowthYoY ?? 0) >= 7
                      ? "Medium"
                      : "Low"}{" "}
                  Amenity Zone
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-xs text-white/50">Future Growth</span>
                </div>
                <div className="font-semibold text-sm text-emerald-400">
                  {(location.priceGrowthYoY ?? 0) >= 10
                    ? "High Potential"
                    : "Medium Potential"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={14} className="text-purple-400" />
                  <span className="text-xs text-white/50">
                    Transaction Density
                  </span>
                </div>
                <div className="font-semibold text-sm text-white">
                  {(location.transactionVolume ?? 0) > 150
                    ? "High"
                    : (location.transactionVolume ?? 0) > 80
                      ? "Medium"
                      : "Low"}
                </div>
              </div>
            </div>

            {/* Growth Corridor */}
            {(location.priceGrowthYoY ?? 0) >= 10 && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 flex items-center gap-3 mb-4">
                <TrendingUp size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="text-emerald-300 font-semibold text-sm">
                    North Bangalore Growth Corridor
                  </div>
                  <div className="text-emerald-400/60 text-xs mt-0.5">
                    {location.priceGrowthYoY}% YoY growth rate
                  </div>
                </div>
              </div>
            )}

            {/* === AI Area Intelligence Panel === */}
            {areaIntel && (
              <div className="mb-6 space-y-4">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" /> AI Area
                  Intelligence
                </h3>
                {/* Score Rings Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Investment Score",
                      value: areaIntel.investmentScore,
                      color: "#D4AF37",
                      st: "demand" as const,
                      items: areaIntel.topTechParks.map((p) => ({
                        name: p.name,
                        distance: p.distance,
                        weight: p.weight,
                      })),
                    },
                    {
                      label: "Growth Score",
                      value: areaIntel.growthScore,
                      color: "#10b981",
                      st: "location" as const,
                      items: areaIntel.nearestMetros.map((m) => ({
                        name: m.name,
                        distance: m.distance,
                        line: m.line,
                      })),
                    },
                    {
                      label: "Livability Score",
                      value: areaIntel.livabilityScore,
                      color: "#60a5fa",
                      st: "amenity" as const,
                      items: [
                        ...areaIntel.topHospitals,
                        ...areaIntel.topSchools,
                      ].map((a) => ({
                        name: a.name,
                        distance: a.distance,
                        rating: a.rating,
                      })),
                    },
                    {
                      label: "Demand Score",
                      value: areaIntel.demandScore,
                      color: "#a78bfa",
                      st: "tech" as const,
                      items: areaIntel.topTechParks.slice(0, 5).map((p) => ({
                        name: p.name,
                        distance: p.distance,
                        weight: p.weight,
                      })),
                    },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.label}
                      data-ocid={`area.intel.${s.st}.card`}
                      onClick={() =>
                        setAreaModalState({
                          open: true,
                          scoreType: s.st,
                          title: s.label,
                          items: s.items,
                          score: s.value,
                        })
                      }
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-center hover:border-[#D4AF37]/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all cursor-pointer"
                    >
                      <div
                        className="text-2xl font-bold font-mono mb-0.5"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </div>
                      <div className="text-white/40 text-[10px]">{s.label}</div>
                      <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.value}%`,
                            backgroundColor: s.color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <div className="text-white/25 text-[9px] mt-1">
                        Click to explore ›
                      </div>
                    </button>
                  ))}
                </div>
                {/* Area Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">
                      Avg Price/sqft
                    </div>
                    <div className="text-white font-bold">
                      ₹{areaIntel.avgPricePerSqft.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">
                      1Y Price Trend
                    </div>
                    <div className="text-emerald-400 font-bold">
                      +{areaIntel.priceTrend1Y.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">
                      3Y Price Trend
                    </div>
                    <div className="text-blue-400 font-bold">
                      +{areaIntel.priceTrend3Y.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">
                      Data Confidence
                    </div>
                    <div className="text-yellow-400 font-bold">
                      {areaIntel.confidence}%
                    </div>
                  </div>
                </div>
                {/* Classification */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                  <TrendingUp
                    size={16}
                    className="text-emerald-400 flex-shrink-0"
                  />
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mr-2 ${
                        areaIntel.classification === "High Growth"
                          ? "text-emerald-400 bg-emerald-500/15"
                          : areaIntel.classification === "Emerging"
                            ? "text-yellow-400 bg-yellow-500/15"
                            : "text-orange-400 bg-orange-500/15"
                      }`}
                    >
                      {areaIntel.classification}
                    </span>
                    <span className="text-white/50 text-xs">
                      {areaIntel.growthDriver}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* === Auto Valuation Widget === */}
            {location && (
              <div className="mb-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Zap size={14} className="text-[#D4AF37]" /> Quick Property
                  Valuation — {location.name}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase mb-1">
                      BHK
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() =>
                            setValuationForm((f) => ({ ...f, bhk: b }))
                          }
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${valuationForm.bhk === b ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-white/5 text-white/60 border-white/10"}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase mb-1">
                      Size (sqft)
                    </p>
                    <input
                      type="number"
                      value={valuationForm.area}
                      onChange={(e) =>
                        setValuationForm((f) => ({
                          ...f,
                          area: e.target.value,
                        }))
                      }
                      data-ocid="area.valuation_widget.area.input"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-[#D4AF37]/50"
                    />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase mb-1">
                      Type
                    </p>
                    <select
                      value={valuationForm.propertyType}
                      onChange={(e) =>
                        setValuationForm((f) => ({
                          ...f,
                          propertyType: e.target.value as
                            | "flat"
                            | "villa"
                            | "plot",
                        }))
                      }
                      data-ocid="area.valuation_widget.type.select"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-[#D4AF37]/50"
                    >
                      <option value="flat">Flat</option>
                      <option value="villa">Villa</option>
                      <option value="plot">Plot</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase mb-1">
                      Builder (opt)
                    </p>
                    <input
                      type="text"
                      value={valuationForm.builder}
                      placeholder="e.g. Prestige"
                      onChange={(e) =>
                        setValuationForm((f) => ({
                          ...f,
                          builder: e.target.value,
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-[#D4AF37]/50 placeholder:text-white/20"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAreaValuate}
                  disabled={valuationLoading}
                  data-ocid="area.valuation_widget.submit_button"
                  className="w-full py-2 bg-[#D4AF37] hover:bg-[#B8960C] disabled:opacity-60 text-black font-bold rounded-xl text-sm transition-all"
                >
                  {valuationLoading ? "Calculating..." : "Calculate Value"}
                </button>
                {valuationResult && !valuationLoading && (
                  <div
                    className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2"
                    data-ocid="area.valuation_widget.results.panel"
                  >
                    <div className="col-span-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 text-center">
                      <p className="text-white/50 text-[10px] mb-0.5">
                        Fair Market Value
                      </p>
                      <p className="text-xl font-bold text-[#D4AF37] font-mono">
                        {valuationResult.fMV >= 10000000
                          ? `₹${(valuationResult.fMV / 10000000).toFixed(2)} Cr`
                          : `₹${(valuationResult.fMV / 100000).toFixed(1)} L`}
                      </p>
                      <p className="text-white/30 text-[10px]">
                        ₹{valuationResult.pricePerSqft.toLocaleString("en-IN")}
                        /sqft · {valuationResult.confidence}% confidence
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-white/40 text-[10px] mb-0.5">
                        Tech Score
                      </p>
                      <p className="text-blue-400 font-bold">
                        {valuationResult.scores.tech}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-white/40 text-[10px] mb-0.5">
                        Confidence
                      </p>
                      <p
                        className={`font-bold ${valuationResult.confidence >= 75 ? "text-emerald-400" : "text-yellow-400"}`}
                      >
                        {valuationResult.confidence}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA to full Location Intelligence */}
            <a
              href="/location-intelligence"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-400/25"
              style={{
                background:
                  "linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #ca8a04 100%)",
              }}
              data-ocid="area.location_intel.primary_button"
            >
              <Brain size={16} />
              Full Location Intelligence Engine
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
      {/* Score Drill-Down Modal */}
      <ScoreDrillDownModal
        isOpen={areaModalState.open}
        onClose={() => setAreaModalState((s) => ({ ...s, open: false }))}
        scoreType={areaModalState.scoreType}
        title={areaModalState.title}
        items={areaModalState.items}
        score={areaModalState.score}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  index: number;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  const c = colorMap[color] ?? colorMap.emerald;
  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/3 p-4 backdrop-blur"
      data-ocid={`area.stat.card.${index}`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${c}`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
      {sub && <div className="text-xs text-white/35 mt-0.5">{sub}</div>}
    </div>
  );
}
