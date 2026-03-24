import { BarChart2, Cpu, Home, Search } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const services = [
  {
    icon: Cpu,
    title: "AI Valuation",
    description:
      "Get an accurate, real-time AI-generated valuation for any property in India within seconds.",
    tags: ["Evaluate", "Trust", "Purchase"],
  },
  {
    icon: Home,
    title: "List Property",
    description:
      "List your property with AI-verified pricing and reach qualified, data-driven buyers.",
    tags: ["List", "Showcase", "Sell"],
  },
  {
    icon: Search,
    title: "Property Search",
    description:
      "Search and compare properties by location, budget, and yield with intelligent filtering.",
    tags: ["Find", "Compare", "Decide"],
  },
  {
    icon: BarChart2,
    title: "Area Intelligence",
    description:
      "Deep-dive micro-market analytics: price trends, infrastructure projects, and investment potential scores.",
    tags: ["Analyze", "Understand", "Invest"],
  },
];

export default function ServiceFeatureCards() {
  const ref = useScrollReveal(true);
  return (
    <section className="py-20 max-w-6xl mx-auto px-4">
      <div className="text-center mb-14">
        <p className="text-[#C9A84C] text-sm font-semibold uppercase tracking-widest mb-3">
          Platform Features
        </p>
        <h2
          className="text-3xl md:text-4xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Everything you need to transact with confidence
        </h2>
      </div>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {services.map((s) => (
          <div key={s.title} className="glass-card p-7 flex flex-col gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <s.icon size={22} style={{ color: "#C9A84C" }} />
            </div>
            <h3 className="font-bold text-white text-base">{s.title}</h3>
            <p className="text-white/55 text-sm leading-relaxed flex-1">
              {s.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {s.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    color: "#C9A84C",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
