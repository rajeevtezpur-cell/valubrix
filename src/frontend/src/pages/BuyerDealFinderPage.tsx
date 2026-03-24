import { useEffect, useState } from "react";
import BuyerLayout from "../components/BuyerLayout";
import { PortalGuard } from "../components/PortalGuard";

const ALL_DEALS = [
  {
    id: 1,
    name: "Prestige Lakeside Habitat",
    location: "Whitefield, Bangalore",
    listed: 8500000,
    aiValue: 9800000,
    type: "Flat",
    city: "Bangalore",
    budget: "50L-1Cr",
    reasoning: "Metro expansion + IT corridor demand surge",
  },
  {
    id: 2,
    name: "Sobha Royal Pavilion",
    location: "Sarjapur Road, Bangalore",
    listed: 12000000,
    aiValue: 13200000,
    type: "Villa",
    city: "Bangalore",
    budget: "1Cr+",
    reasoning: "Underpriced relative to infra score of 87",
  },
  {
    id: 3,
    name: "Godrej Splendour",
    location: "Hoodi, Bangalore",
    listed: 6500000,
    aiValue: 7000000,
    type: "Flat",
    city: "Bangalore",
    budget: "50L-1Cr",
    reasoning: "Tech park proximity discount not reflected",
  },
  {
    id: 4,
    name: "Brigade Cornerstone Utopia",
    location: "Whitefield, Bangalore",
    listed: 9800000,
    aiValue: 9900000,
    type: "Flat",
    city: "Bangalore",
    budget: "1Cr+",
    reasoning: "Fair market price, RERA compliant",
  },
  {
    id: 5,
    name: "Phoenix One Bangalore West",
    location: "Rajajinagar, Bangalore",
    listed: 15500000,
    aiValue: 14000000,
    type: "Flat",
    city: "Bangalore",
    budget: "1Cr+",
    reasoning: "Premium priced above locality average",
  },
  {
    id: 6,
    name: "Devanahalli Plots Phase 2",
    location: "Devanahalli, Bangalore",
    listed: 3200000,
    aiValue: 4500000,
    type: "Plot",
    city: "Bangalore",
    budget: "Under 50L",
    reasoning: "Airport corridor undervalued, STRR boost",
  },
  {
    id: 7,
    name: "Kolte Patil Life Republic",
    location: "Hinjewadi, Pune",
    listed: 7200000,
    aiValue: 8600000,
    type: "Flat",
    city: "Pune",
    budget: "50L-1Cr",
    reasoning: "IT park proximity at builder distress price",
  },
  {
    id: 8,
    name: "Rohan Ananta",
    location: "Wakad, Pune",
    listed: 6800000,
    aiValue: 7400000,
    type: "Flat",
    city: "Pune",
    budget: "50L-1Cr",
    reasoning: "New launch discount with high appreciation",
  },
  {
    id: 9,
    name: "Amanora Gold Towers",
    location: "Hadapsar, Pune",
    listed: 9500000,
    aiValue: 9600000,
    type: "Flat",
    city: "Pune",
    budget: "1Cr+",
    reasoning: "Fair price, strong rental yield area",
  },
  {
    id: 10,
    name: "DLF Camellias",
    location: "Golf Course Rd, Delhi NCR",
    listed: 38000000,
    aiValue: 42000000,
    type: "Villa",
    city: "Delhi NCR",
    budget: "1Cr+",
    reasoning: "Luxury segment correction opportunity",
  },
  {
    id: 11,
    name: "Vatika Sovereign Park",
    location: "Sector 99, Delhi NCR",
    listed: 8900000,
    aiValue: 9800000,
    type: "Flat",
    city: "Delhi NCR",
    budget: "1Cr+",
    reasoning: "Expressway infra not yet priced in",
  },
  {
    id: 12,
    name: "Manyata Residency",
    location: "Hebbal, Bangalore",
    listed: 7800000,
    aiValue: 7200000,
    type: "Flat",
    city: "Bangalore",
    budget: "50L-1Cr",
    reasoning: "Slight premium over current demand level",
  },
  {
    id: 13,
    name: "Embassy Springs",
    location: "Devanahalli, Bangalore",
    listed: 4800000,
    aiValue: 6200000,
    type: "Villa",
    city: "Bangalore",
    budget: "Under 50L",
    reasoning: "Airport proximity severely undervalued",
  },
  {
    id: 14,
    name: "Mahindra Eden",
    location: "Kanakapura Rd, Bangalore",
    listed: 5900000,
    aiValue: 6300000,
    type: "Flat",
    city: "Bangalore",
    budget: "50L-1Cr",
    reasoning: "Green corridor with infra uplift pending",
  },
  {
    id: 15,
    name: "Paranjape Blue Ridge",
    location: "Hinjewadi, Pune",
    listed: 5200000,
    aiValue: 5800000,
    type: "Flat",
    city: "Pune",
    budget: "50L-1Cr",
    reasoning: "Phase 3 IT expansion not priced",
  },
];

const NEARBY_PROJECTS = [
  {
    name: "Prestige Tech Vista",
    loc: "Whitefield",
    score: 84,
    tag: "High Growth",
  },
  {
    name: "Brigade Orchards",
    loc: "Devanahalli",
    score: 88,
    tag: "Strong Buy",
  },
  { name: "Sobha City", loc: "Thanisandra", score: 79, tag: "Good Value" },
];

function dealScore(listed: number, aiValue: number) {
  return Math.round(((aiValue - listed) / aiValue) * 100);
}

function dealTag(score: number) {
  if (score >= 15)
    return { label: "Strong Buy", color: "#10b981", bg: "#10b98120" };
  if (score >= 5)
    return { label: "Good Deal", color: "#14b8a6", bg: "#14b8a620" };
  if (score >= -5)
    return { label: "Fair Price", color: "#f59e0b", bg: "#f59e0b20" };
  return { label: "Overpriced", color: "#ef4444", bg: "#ef444420" };
}

function DealBarChart({ deals }: { deals: typeof ALL_DEALS }) {
  const top10 = [...deals]
    .sort(
      (a, b) => dealScore(b.listed, b.aiValue) - dealScore(a.listed, a.aiValue),
    )
    .slice(0, 10);
  const maxScore = Math.max(
    ...top10.map((d) => Math.abs(dealScore(d.listed, d.aiValue))),
    1,
  );
  return (
    <div className="space-y-2">
      {top10.map((d, i) => {
        const score = dealScore(d.listed, d.aiValue);
        const tag = dealTag(score);
        const width = (Math.abs(score) / maxScore) * 100;
        return (
          <div key={d.id} className="flex items-center gap-3">
            <span className="text-white/30 text-xs w-4 text-right">
              {i + 1}
            </span>
            <span className="text-white/70 text-xs w-36 truncate">
              {d.name.split(" ").slice(0, 3).join(" ")}
            </span>
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${width}%`, background: tag.color }}
              />
            </div>
            <span
              className="text-xs font-bold w-12 text-right"
              style={{ color: tag.color }}
            >
              {score >= 0 ? "+" : ""}
              {score}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function BuyerDealFinderPage() {
  const [cityFilter, setCityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [budgetFilter, setBudgetFilter] = useState("All");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const filtered = ALL_DEALS.filter((d) => {
    if (cityFilter !== "All" && d.city !== cityFilter) return false;
    if (typeFilter !== "All" && d.type !== typeFilter) return false;
    if (budgetFilter !== "All" && d.budget !== budgetFilter) return false;
    return true;
  });

  const cities = ["All", "Bangalore", "Pune", "Delhi NCR"];
  const types = ["All", "Flat", "Villa", "Plot"];
  const budgets = ["All", "Under 50L", "50L-1Cr", "1Cr+"];

  return (
    <PortalGuard portal="buyer">
      <BuyerLayout>
        <div
          className="max-w-6xl mx-auto"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s" }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Deal Finder</h1>
            <p className="text-white/50">
              AI-powered undervalued properties ranked by deal score vs fair
              market value.
            </p>
          </div>

          {/* Filters */}
          <div
            className="flex flex-wrap gap-6 mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl"
            data-ocid="dealfinder.panel"
          >
            <div>
              <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">
                City
              </p>
              <div className="flex gap-2 flex-wrap">
                {cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-ocid="dealfinder.tab"
                    onClick={() => setCityFilter(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      cityFilter === c
                        ? "bg-[#D4AF37] text-black"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">
                Type
              </p>
              <div className="flex gap-2 flex-wrap">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-ocid="dealfinder.tab"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      typeFilter === t
                        ? "bg-[#D4AF37] text-black"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">
                Budget
              </p>
              <div className="flex gap-2 flex-wrap">
                {budgets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    data-ocid="dealfinder.tab"
                    onClick={() => setBudgetFilter(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      budgetFilter === b
                        ? "bg-[#D4AF37] text-black"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* Main Deals Table */}
            <div
              className="xl:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              data-ocid="dealfinder.table"
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-bold">Deal List</h2>
                <span className="text-white/30 text-xs">
                  {filtered.length} properties
                </span>
              </div>
              <div className="overflow-y-auto max-h-[520px]">
                {filtered.map((d, i) => {
                  const score = dealScore(d.listed, d.aiValue);
                  const tag = dealTag(score);
                  return (
                    <div
                      key={d.id}
                      data-ocid={`dealfinder.item.${i + 1}`}
                      className="px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">
                            {d.name}
                          </p>
                          <p className="text-white/40 text-xs">{d.location}</p>
                        </div>
                        <span
                          className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: tag.bg, color: tag.color }}
                        >
                          {tag.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <p className="text-white/30 text-[10px] mb-0.5">
                            Listed
                          </p>
                          <p className="text-white text-sm font-medium">
                            ₹{(d.listed / 100000).toFixed(1)}L
                          </p>
                        </div>
                        <div>
                          <p className="text-white/30 text-[10px] mb-0.5">
                            AI Value
                          </p>
                          <p className="text-emerald-400 text-sm font-bold">
                            ₹{(d.aiValue / 100000).toFixed(1)}L
                          </p>
                        </div>
                        <div>
                          <p className="text-white/30 text-[10px] mb-0.5">
                            Deal Score
                          </p>
                          <p
                            className="text-sm font-bold"
                            style={{ color: tag.color }}
                          >
                            {score >= 0 ? "+" : ""}
                            {score}%
                          </p>
                        </div>
                      </div>
                      <p className="text-white/30 text-xs mt-2 italic">
                        {d.reasoning}
                      </p>
                      {/* Enhanced deal score info from AI engine */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            color: tag.color,
                            background: tag.bg,
                            borderColor: `${tag.color}40`,
                          }}
                        >
                          {tag.label}
                        </span>
                        {score >= 5 && (
                          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                            Est. {score >= 15 ? "21" : score >= 5 ? "45" : "90"}{" "}
                            days to sell
                          </span>
                        )}
                        <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                          Gap: ₹{((d.aiValue - d.listed) / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div
                    className="py-12 text-center text-white/30"
                    data-ocid="dealfinder.empty_state"
                  >
                    No deals match selected filters
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Bar Chart */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 text-sm">
                  Top Deals by Score
                </h3>
                <DealBarChart
                  deals={filtered.length > 0 ? filtered : ALL_DEALS}
                />
              </div>

              {/* AI Insights */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 text-sm">
                  AI Insights
                </h3>
                <ul className="space-y-3 text-white/60 text-xs">
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] mt-0.5">→</span>
                    <span>
                      Properties near airport corridors (Devanahalli) are
                      systematically underpriced by 20–30% vs future infra
                      impact.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] mt-0.5">→</span>
                    <span>
                      Builder distress in Hinjewadi/Wakad creating 8–15%
                      discount windows on new launches.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] mt-0.5">→</span>
                    <span>
                      Metro phase 3 expansion has not yet been priced into
                      Whitefield listings (typically 6–12 month lag).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] mt-0.5">→</span>
                    <span>
                      Villa and plot segments show 1.15–1.30× multiplier
                      advantage over flat pricing growth trajectories.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Nearby Similar Projects */}
          <div>
            <h2 className="text-white font-bold mb-4">
              Nearby Similar Projects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {NEARBY_PROJECTS.map((p, i) => (
                <div
                  key={p.name}
                  data-ocid={`dealfinder.item.${i + 13}`}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#D4AF37]/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-semibold">{p.name}</p>
                      <p className="text-white/40 text-xs">{p.loc}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] font-semibold">
                      {p.tag}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">{p.score}</div>
                  <p className="text-white/30 text-xs">Investment Score</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BuyerLayout>
    </PortalGuard>
  );
}
