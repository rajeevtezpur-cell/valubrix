import { Cpu, Info, MapPin, Shield } from "lucide-react";
import { useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const features = [
  {
    icon: Shield,
    title: "Data Transparency",
    description:
      "All valuations are backed by verifiable public data sources. No black boxes, no guesswork — just clear, auditable logic.",
  },
  {
    icon: Cpu,
    title: "AI Driven Pricing",
    description:
      "Our proprietary ML models analyze thousands of comparable transactions in real-time, delivering precision pricing for any micro-market.",
  },
  {
    icon: MapPin,
    title: "Pan India Coverage",
    description:
      "From tier-1 metros to emerging tier-3 cities — comprehensive property intelligence across 500+ cities and growing.",
  },
  {
    icon: Info,
    title: "Zero Brokerage Intelligence",
    description:
      "Our insights are entirely independent of brokers and agents. Pure data, pure analysis, with no commission-driven bias.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
}: { icon: React.ElementType; title: string; description: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="glass-card p-8 flex flex-col gap-5 cursor-default transition-all duration-300"
      style={{
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        border: hovered
          ? "1px solid rgba(201,168,76,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(201,168,76,0.1)"
          : "0 8px 40px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
        style={{
          background: hovered
            ? "rgba(201,168,76,0.15)"
            : "rgba(201,168,76,0.08)",
          border: "1px solid rgba(201,168,76,0.2)",
          transition: "all 0.3s ease",
        }}
      >
        <Icon
          size={26}
          style={{
            color: "#C9A84C",
            transform: hovered
              ? "rotate(5deg) scale(1.1)"
              : "rotate(0deg) scale(1)",
            transition: "transform 0.3s ease",
          }}
        />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-white/55 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function FeatureCards() {
  const ref = useScrollReveal(true);
  return (
    <section className="py-20 max-w-6xl mx-auto px-4" id="services">
      <div className="text-center mb-14">
        <p className="text-[#C9A84C] text-sm font-semibold uppercase tracking-widest mb-3">
          What Makes Us Different
        </p>
        <h2
          className="text-3xl md:text-4xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Built for those who value clarity
        </h2>
      </div>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}
