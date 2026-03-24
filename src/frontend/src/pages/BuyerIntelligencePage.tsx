import { ArrowUpDown, BarChart3, Download, MapPin, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BuyerLayout from "../components/BuyerLayout";
import LocationSelectMap from "../components/LocationSelectMap";
import SmartLocationSearch from "../components/SmartLocationSearch";
import type { LocationRecord } from "../data/locationData";

const NEIGHBORHOODS = [
  {
    locality: "Whitefield",
    price: 9800,
    change: "+8.2%",
    demand: 91,
    invest: 84,
    positive: true,
    city: "Bangalore",
    infra: 78,
  },
  {
    locality: "Sarjapur Road",
    price: 8400,
    change: "+11.3%",
    demand: 94,
    invest: 89,
    positive: true,
    city: "Bangalore",
    infra: 82,
  },
  {
    locality: "Indiranagar",
    price: 14200,
    change: "+5.1%",
    demand: 88,
    invest: 78,
    positive: true,
    city: "Bangalore",
    infra: 91,
  },
  {
    locality: "Hebbal",
    price: 7600,
    change: "+3.4%",
    demand: 79,
    invest: 72,
    positive: true,
    city: "Bangalore",
    infra: 74,
  },
  {
    locality: "Koramangala",
    price: 13500,
    change: "+6.8%",
    demand: 86,
    invest: 80,
    positive: true,
    city: "Bangalore",
    infra: 89,
  },
  {
    locality: "Baner, Pune",
    price: 8100,
    change: "+9.2%",
    demand: 83,
    invest: 81,
    positive: true,
    city: "Pune",
    infra: 76,
  },
  {
    locality: "Koregaon Park",
    price: 12800,
    change: "+4.7%",
    demand: 80,
    invest: 75,
    positive: true,
    city: "Pune",
    infra: 83,
  },
  {
    locality: "Dwarka, Delhi",
    price: 7200,
    change: "+2.9%",
    demand: 74,
    invest: 70,
    positive: true,
    city: "Delhi",
    infra: 71,
  },
  {
    locality: "Yelahanka",
    price: 5600,
    change: "+9.8%",
    demand: 81,
    invest: 86,
    positive: true,
    city: "Bangalore",
    infra: 68,
  },
  {
    locality: "Electronic City",
    price: 5400,
    change: "+12.1%",
    demand: 84,
    invest: 88,
    positive: true,
    city: "Bangalore",
    infra: 72,
  },
];

type SortKey = "price" | "demand" | "invest" | "infra";

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

export default function BuyerIntelligencePage() {
  const [sortKey, setSortKey] = useState<SortKey>("invest");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<
    (typeof NEIGHBORHOODS)[0] | null
  >(null);
  const [showMap, setShowMap] = useState(false);

  const avgPrice = useCountUp(8420);
  const totalListings = useCountUp(2847);
  const soldThisMonth = useCountUp(342);
  const avgDays = useCountUp(38);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...NEIGHBORHOODS].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  const handleSearchSelect = (loc: LocationRecord) => {
    const match = NEIGHBORHOODS.find((n) =>
      n.locality.toLowerCase().includes(loc.name.toLowerCase()),
    );
    setSelectedLoc(match ?? null);
  };

  const topFive = [...NEIGHBORHOODS]
    .sort((a, b) => b.invest - a.invest)
    .slice(0, 5);

  const comparables = selectedLoc
    ? NEIGHBORHOODS.filter(
        (n) =>
          n.city === selectedLoc.city && n.locality !== selectedLoc.locality,
      ).slice(0, 3)
    : [];

  return (
    <BuyerLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
            <span className="text-[#D4AF37]">[</span> REAL ESTATE INTELLIGENCE
            TERMINAL <span className="text-[#D4AF37]">]</span>
          </h1>
          <p className="text-white/40 text-sm mt-0.5 font-mono">
            Bangalore Market — Live Analytics Dashboard
          </p>
        </div>

        {/* KPI Strip */}
        <div
          data-ocid="buyer_intel.city_summary.panel"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            {
              label: "Avg Price / sqft",
              value: `₹${avgPrice.toLocaleString()}`,
              sub: "Bangalore",
            },
            {
              label: "Active Listings",
              value: totalListings.toLocaleString(),
              sub: "Platform-wide",
            },
            {
              label: "Sold This Month",
              value: soldThisMonth.toLocaleString(),
              sub: "Transactions",
            },
            {
              label: "Avg Days-to-Sell",
              value: `${avgDays} days`,
              sub: "City Average",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 font-mono"
            >
              <p className="text-white/40 text-xs uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-[#D4AF37] text-2xl font-bold mt-1">
                {stat.value}
              </p>
              <p className="text-white/30 text-xs mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Smart Search */}
        <div className="mb-4">
          <SmartLocationSearch
            placeholder="Search any locality for detailed intelligence..."
            onSelect={handleSearchSelect}
          />
        </div>

        {/* Map toggle */}
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            data-ocid="buyer_intel.map.toggle"
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-sm transition-all"
          >
            <MapPin size={14} className="text-[#D4AF37]" />
            {showMap ? "Hide Map" : "Select on Map"}
          </button>
          <button
            type="button"
            data-ocid="buyer_intel.export.button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-sm transition-all"
          >
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            data-ocid="buyer_intel.share.button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-sm transition-all"
          >
            <Share2 size={14} /> Share
          </button>
        </div>

        {showMap && (
          <div className="mb-6">
            <LocationSelectMap
              height="300px"
              onLocationSelect={(result) => {
                if (result.locality) {
                  const match = NEIGHBORHOODS.find((n) =>
                    n.locality
                      .toLowerCase()
                      .includes(result.locality!.name.toLowerCase()),
                  );
                  setSelectedLoc(match ?? null);
                }
              }}
            />
          </div>
        )}

        {/* Selected location intelligence */}
        {selectedLoc && (
          <div className="mb-6 bg-gradient-to-r from-[#D4AF37]/10 to-white/5 border border-[#D4AF37]/30 rounded-2xl p-5">
            <p className="text-[#D4AF37] text-xs uppercase tracking-widest mb-2">
              Location Intelligence
            </p>
            <div className="flex flex-wrap items-start gap-6">
              <div>
                <h2 className="text-white text-xl font-bold">
                  {selectedLoc.locality}
                </h2>
                <p className="text-white/40 text-sm">{selectedLoc.city}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <div>
                  <p className="text-white/40 text-xs">Price/sqft</p>
                  <p className="text-[#D4AF37] font-bold text-lg">
                    ₹{selectedLoc.price.toLocaleString()}
                  </p>
                  <p className="text-emerald-400 text-xs">
                    {selectedLoc.change} YoY
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Demand Score</p>
                  <p className="text-white font-bold text-lg">
                    {selectedLoc.demand}/100
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Investment Score</p>
                  <p className="text-white font-bold text-lg">
                    {selectedLoc.invest}/100
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Infra Score</p>
                  <p className="text-white font-bold text-lg">
                    {selectedLoc.infra}/100
                  </p>
                </div>
              </div>
            </div>
            {comparables.length > 0 && (
              <div className="mt-4">
                <p className="text-white/40 text-xs mb-2">
                  Comparable Areas in {selectedLoc.city}
                </p>
                <div className="flex gap-3 flex-wrap">
                  {comparables.map((c) => (
                    <button
                      type="button"
                      key={c.locality}
                      onClick={() => setSelectedLoc(c)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 hover:border-[#D4AF37]/40 transition-colors"
                    >
                      {c.locality} · ₹{c.price.toLocaleString()} · {c.invest}
                      /100
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedLoc(null)}
              className="mt-3 text-white/30 text-xs underline hover:text-white/60"
            >
              Clear
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sortable Neighborhood Table */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#D4AF37]" />
                <h2 className="text-white font-bold text-sm">
                  Neighbourhood Intelligence Table
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-white/30 border-b border-white/10">
                      <th className="text-left px-4 py-3">Locality</th>
                      {(
                        ["price", "demand", "invest", "infra"] as SortKey[]
                      ).map((k) => (
                        <th key={k} className="text-right px-4 py-3">
                          <button
                            type="button"
                            data-ocid={`buyer_intel.sort.${k}.button`}
                            onClick={() => handleSort(k)}
                            className="flex items-center gap-1 ml-auto hover:text-white/70 transition-colors"
                          >
                            {k.charAt(0).toUpperCase() + k.slice(1)}
                            <ArrowUpDown size={10} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((n, i) => (
                      <tr
                        key={n.locality}
                        data-ocid={`buyer_intel.row.${i + 1}`}
                        onClick={() => setSelectedLoc(n)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setSelectedLoc(n)
                        }
                        className={`border-b border-white/5 cursor-pointer transition-colors ${
                          selectedLoc?.locality === n.locality
                            ? "bg-[#D4AF37]/8 border-[#D4AF37]/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-white font-semibold">
                            {n.locality}
                          </div>
                          <div className="text-white/30">{n.city}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[#D4AF37]">
                            ₹{n.price.toLocaleString()}
                          </span>
                          <div
                            className={`text-xs ${n.positive ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {n.change}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          {n.demand}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-lg ${
                              n.invest >= 85
                                ? "bg-emerald-500/20 text-emerald-300"
                                : n.invest >= 75
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {n.invest}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          {n.infra}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Top 5 Investment Score Chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
                Top Investment Scores
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={topFive}
                  layout="vertical"
                  margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[60, 100]}
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="locality"
                    type="category"
                    tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0d1526",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="invest" radius={[0, 4, 4, 0]}>
                    {topFive.map((entry, i) => (
                      <Cell
                        key={entry.locality}
                        fill={i === 0 ? "#D4AF37" : "#856b24"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Summary */}
            <div className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-5">
              <p className="text-[#D4AF37] text-xs uppercase tracking-widest mb-3">
                AI Market Summary
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Bangalore's real estate market shows strong growth momentum,
                with Sarjapur Road and Electronic City leading investment
                scores. North Bangalore (Yelahanka, Thanisandra) emerging as
                high-growth corridors due to infrastructure expansion. Premium
                micro-markets (Koramangala, Indiranagar) show steady demand
                despite higher entry prices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
