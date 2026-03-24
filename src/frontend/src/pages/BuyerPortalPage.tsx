import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Calculator,
  Cpu,
  Eye,
  GitCompare,
  Map as MapIcon,
  Search,
  Tag,
  TrendingUp,
} from "lucide-react";
import BuyerLayout from "../components/BuyerLayout";
import { PortalGuard } from "../components/PortalGuard";
import { useAuth } from "../context/AuthContext";
import {
  MOCK_LISTINGS,
  formatPrice,
  getAllListings,
} from "../data/mockListings";

const BASE_PRICES: Record<string, number> = {
  Bangalore: 9000,
  Pune: 7500,
  Delhi: 8500,
};

function getAiValue(_price: number, city: string, area: number): number {
  const base = BASE_PRICES[city] || 9000;
  return base * Math.max(area, 800);
}

function BuyerDashboardContent() {
  const { user } = useAuth();

  const topDeals = getAllListings()
    .filter((l) => {
      const ai = getAiValue(
        l.price,
        l.city,
        l.carpetArea || l.plotArea || 1000,
      );
      return l.price < ai * 0.9;
    })
    .slice(0, 3);

  const dashCards = [
    {
      icon: Search,
      label: "Search Properties",
      desc: "Browse thousands of listings with deal detection",
      link: "/buyer/search",
      color: "#60a5fa",
      ocid: "buyer.search.card",
    },
    {
      icon: MapIcon,
      label: "Map Explorer",
      desc: "Discover properties by zone and region",
      link: "/buyer/map",
      color: "#2dd4bf",
      ocid: "buyer.map.card",
    },
    {
      icon: Tag,
      label: "Deal Finder",
      desc: "AI-detected undervalued properties",
      link: "/buyer/deals",
      color: "#34d399",
      ocid: "buyer.dealfinder.card",
    },
    {
      icon: TrendingUp,
      label: "AI Property Valuation",
      desc: "Get instant AI-powered property valuation",
      link: "/buyer/valuation",
      color: "#D4AF37",
      ocid: "buyer.valuation.card",
    },
    {
      icon: BarChart2,
      label: "Investment Insights",
      desc: "Rental yield, demand scores, investment ratings",
      link: "/buyer/valuation",
      color: "#a78bfa",
      ocid: "buyer.insights.card",
    },
    {
      icon: Activity,
      label: "Market Pulse",
      desc: "Hottest areas, price drops, rental demand",
      link: "/buyer/market-pulse",
      color: "#fbbf24",
      ocid: "buyer.marketpulse.card",
    },
    {
      icon: Eye,
      label: "Off-Market Opportunities",
      desc: "AI-predicted properties before they list",
      link: "/buyer/off-market",
      color: "#818cf8",
      ocid: "buyer.offmarket.card",
    },
    {
      icon: GitCompare,
      label: "Property Comparison",
      desc: "Compare up to 4 properties side-by-side",
      link: "/buyer/compare",
      color: "#f472b6",
      ocid: "buyer.compare.card",
    },
    {
      icon: Calculator,
      label: "Financial Calculators",
      desc: "EMI, rental yield, flip profit and more",
      link: "/buyer/calculators",
      color: "#fb923c",
      ocid: "buyer.calculators.card",
    },
    {
      icon: Cpu,
      label: "Intelligence Terminal",
      desc: "Professional market analytics dashboard",
      link: "/buyer/intelligence",
      color: "#22d3ee",
      ocid: "buyer.intelligence.card",
    },
  ];

  return (
    <BuyerLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back,{" "}
            <span className="text-[#D4AF37]">
              {user?.fullName || user?.username || "Buyer"}
            </span>
          </h1>
          <p className="text-white/50 mt-1">
            Buyer Intelligence Platform — powered by AI
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {dashCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.ocid}
                to={card.link as any}
                data-ocid={card.ocid}
                className="group bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(212,175,55,0.15)] block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon size={20} style={{ color: card.color }} />
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all"
                  />
                </div>
                <h3 className="text-white font-semibold text-sm">
                  {card.label}
                </h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Properties Saved", value: "0" },
            { label: "Valuations Done", value: "0" },
            { label: "Alerts Active", value: "0" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-[#D4AF37] font-mono">
                {s.value}
              </p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-bold text-lg">
                Best Deals Right Now
              </h2>
              <p className="text-white/40 text-sm">
                Properties priced below AI market estimate
              </p>
            </div>
            <Link
              to="/buyer/deals"
              className="text-[#D4AF37] text-sm hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {topDeals.length > 0 ? (
              topDeals.map((l) => {
                const ai = getAiValue(
                  l.price,
                  l.city,
                  l.carpetArea || l.plotArea || 1000,
                );
                const pctBelow = Math.round((1 - l.price / ai) * 100);
                return (
                  <Link
                    key={l.id}
                    to="/property/$id"
                    params={{ id: l.id }}
                    className="flex items-center justify-between bg-white/5 hover:bg-white/8 rounded-xl p-4 transition-all group"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">
                        {l.title}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {l.location}, {l.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#D4AF37] font-bold font-mono text-sm">
                        {formatPrice(l.price)}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                        Good Deal — {pctBelow}% below
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-white/30 text-sm text-center py-4">
                All listings are fairly priced
              </p>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}

export default function BuyerPortalPage() {
  return (
    <PortalGuard portal="buyer">
      <BuyerDashboardContent />
    </PortalGuard>
  );
}
