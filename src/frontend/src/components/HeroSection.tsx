import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { LocationRecord } from "../data/locationData";
import SmartLocationSearch from "./SmartLocationSearch";

interface HeroSectionProps {
  onSearch: () => void;
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 5) % 100}%`,
  top: `${(i * 23 + 10) % 100}%`,
  size: (i % 3) + 2,
  delay: `${(i * 0.7) % 8}s`,
  duration: `${(i % 4) + 6}s`,
  color: i % 3 === 0 ? "#C9A84C" : "#3B82F6",
  opacity: 0.1 + (i % 5) * 0.04,
}));

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const navigate = useNavigate();

  const handleLocationSelect = (loc: LocationRecord) => {
    onSearch();
    navigate({ to: "/area/$locationId", params: { locationId: loc.id } });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#0A0F1E", paddingTop: "80px" }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('/assets/generated/valubrix-hero-bg.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(201,168,76,0.08) 0%, rgba(10,15,30,0.7) 60%, #0A0F1E 100%)",
        }}
      />

      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none z-0"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: p.opacity,
            animation: `particle-drift ${p.duration} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        {/* Logo with entrance animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex items-center justify-center mb-8"
          style={{ width: 200, height: 200 }}
        >
          {/* Glow behind logo */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(201,168,76,0.25) 0%, transparent 70%)",
              filter: "blur(12px)",
            }}
          />
          {/* Subtle glow ring (additional) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 0 40px 8px rgba(201,168,76,0.12)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: "#C9A84C",
              animation: "pulse-ring 2s ease-out infinite",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: "#C9A84C",
              animation: "pulse-ring 2s ease-out 1s infinite",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: "rgba(201,168,76,0.4)",
              animation: "pulse-ring 2s ease-out 2s infinite",
            }}
          />
          <div
            className="relative flex items-center justify-center rounded-full overflow-hidden"
            style={{
              width: 160,
              height: 160,
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))",
              border: "2px solid rgba(201,168,76,0.4)",
              animation: "float 3s ease-in-out infinite",
            }}
          >
            <img
              src="/assets/uploads/5EB5878E-7937-4598-9486-6156F9B2EB9F-3-1.png"
              alt="ValuBrix"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </motion.div>

        <p
          className="italic text-lg md:text-xl mb-4"
          style={{
            color: "#C9A84C",
            textShadow: "0 0 20px rgba(201,168,76,0.5)",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Clarity in each square feet.
        </p>

        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
          Check any property&apos;s fair price &amp;{" "}
          <span style={{ color: "#C9A84C" }}>negotiate confidently.</span>
        </h1>

        <p className="text-white/60 text-lg md:text-xl mb-10 max-w-2xl">
          India&apos;s most transparent AI-powered property valuation platform.
          Know the real worth before you buy.
        </p>

        <div className="w-full max-w-2xl">
          <SmartLocationSearch
            onSelect={handleLocationSelect}
            size="large"
            placeholder="Search locality, city or pincode"
            className="w-full"
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40">
        <div
          className="w-0.5 h-12 rounded-full"
          style={{
            background: "linear-gradient(to bottom, #C9A84C, transparent)",
            animation: "float 2s ease-in-out infinite",
          }}
        />
        <span className="text-xs text-white/60 tracking-widest uppercase">
          Scroll
        </span>
      </div>
    </section>
  );
}
