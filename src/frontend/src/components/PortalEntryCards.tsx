import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Home, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const portals = [
  {
    id: "buyers" as const,
    icon: TrendingUp,
    title: "Buyers & Investors",
    subtitle: "Check valuation and browse properties.",
    desc: "Get AI-powered fair value estimates, compare neighborhoods, and invest with total confidence.",
    accent: "#3B82F6",
    glowColor: "rgba(59,130,246,0.35)",
    gradient:
      "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))",
    ocid: "portal.buyers.primary_button",
    route: "/buyer",
    portalKey: "buyer" as const,
    delay: 0,
  },
  {
    id: "sellers" as const,
    icon: Home,
    title: "Sellers",
    subtitle: "List property and manage listings.",
    desc: "Showcase your property with verified valuation data and reach serious, informed buyers.",
    accent: "#C9A84C",
    glowColor: "rgba(201,168,76,0.35)",
    gradient:
      "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))",
    ocid: "portal.sellers.primary_button",
    route: "/seller",
    portalKey: "seller" as const,
    delay: 150,
  },
  {
    id: "banks" as const,
    icon: Building2,
    title: "Banks & Financial Institutions",
    subtitle: "Generate loan-grade valuation reports.",
    desc: "Access institutional-quality valuation data for mortgage underwriting, risk assessment, and portfolio analytics.",
    accent: "#16C784",
    glowColor: "rgba(22,199,132,0.35)",
    gradient:
      "linear-gradient(135deg, rgba(22,199,132,0.12), rgba(22,199,132,0.04))",
    ocid: "portal.banks.primary_button",
    route: "/bank",
    portalKey: "banker" as const,
    delay: 300,
  },
];

function PortalCard(props: (typeof portals)[0]) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();
  const Icon = props.icon;

  const handleNav = () => {
    if (user) {
      navigate({ to: props.route as "/" });
    } else {
      openLoginModal(props.portalKey);
    }
  };

  return (
    <div
      className="portal-card glass-card p-8 flex flex-col gap-6 relative overflow-hidden"
      style={{
        background: hovered ? props.gradient : "rgba(255,255,255,0.05)",
        border: `1px solid ${hovered ? `${props.accent}70` : "rgba(255,255,255,0.08)"}`,
        boxShadow: hovered
          ? `0 32px 80px rgba(0,0,0,0.6), 0 0 60px ${props.glowColor}, 0 0 0 1px ${props.accent}20`
          : `0 8px 40px rgba(0,0,0,0.4), 0 0 20px ${props.glowColor.replace("0.35", "0.08")}`,
        transform: hovered
          ? "translateY(-10px) scale(1.01)"
          : "translateY(0) scale(1)",
        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        animationDelay: `${props.delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {props.id === "sellers" && (
        <div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.06) 40%, transparent 80%)",
            backgroundSize: "200% 100%",
            animation: "shimmerBorder 3s linear infinite",
          }}
        />
      )}

      {hovered && (
        <>
          <div
            className="sparkle"
            style={{
              position: "absolute",
              top: "12%",
              right: "18%",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: props.accent,
              opacity: 0.7,
              animation: "sparkleFloat 1.4s ease-in-out infinite",
            }}
          />
          <div
            className="sparkle"
            style={{
              position: "absolute",
              top: "35%",
              right: "8%",
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: props.accent,
              opacity: 0.5,
              animation: "sparkleFloat 1.8s ease-in-out 0.3s infinite",
            }}
          />
          <div
            className="sparkle"
            style={{
              position: "absolute",
              bottom: "20%",
              right: "22%",
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: props.accent,
              opacity: 0.4,
              animation: "sparkleFloat 2.1s ease-in-out 0.6s infinite",
            }}
          />
        </>
      )}

      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10"
        style={{
          background: `${props.accent}1a`,
          border: `1px solid ${props.accent}35`,
          boxShadow: hovered ? `0 0 24px ${props.glowColor}` : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        <Icon size={28} style={{ color: props.accent }} />
      </div>
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white mb-2">{props.title}</h3>
        <p className="text-sm mb-3" style={{ color: `${props.accent}cc` }}>
          {props.subtitle}
        </p>
        <p className="text-white/55 text-sm leading-relaxed">{props.desc}</p>
      </div>
      <button
        type="button"
        data-ocid={props.ocid}
        onClick={handleNav}
        className="mt-auto flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold self-start cursor-pointer relative z-10 overflow-hidden"
        style={{
          background: hovered ? props.accent : "transparent",
          color: hovered ? "#0A0F1E" : props.accent,
          border: `1px solid ${props.accent}`,
          boxShadow: hovered
            ? `0 0 28px ${props.glowColor}, 0 4px 16px rgba(0,0,0,0.3)`
            : "none",
          transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        Enter Portal
        <ArrowRight
          size={14}
          style={{
            transform: hovered ? "translateX(4px)" : "translateX(0)",
            transition: "transform 0.3s ease",
          }}
        />
      </button>
    </div>
  );
}

export default function PortalEntryCards() {
  return (
    <section className="py-20 max-w-6xl mx-auto px-4">
      <style>{`
        @keyframes cardReveal { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerBorder { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes sparkleFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; } 50% { transform: translateY(-8px) scale(1.5); opacity: 1; } }
        @keyframes headingReveal { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .portal-section-heading { animation: headingReveal 0.7s cubic-bezier(0.23, 1, 0.32, 1) 0.1s both; }
        .portal-card { animation: cardReveal 0.7s cubic-bezier(0.23, 1, 0.32, 1) both; }
        .portal-card:nth-child(1) { animation-delay: 0.3s; }
        .portal-card:nth-child(2) { animation-delay: 0.45s; }
        .portal-card:nth-child(3) { animation-delay: 0.6s; }
      `}</style>

      <div className="text-center mb-14 portal-section-heading">
        <p className="text-[#C9A84C] text-sm font-semibold uppercase tracking-widest mb-3">
          Choose Your Path
        </p>
        <h2
          className="text-3xl md:text-4xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Which portal is right for you?
        </h2>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        data-ocid="portal.section"
      >
        {portals.map((p) => (
          <PortalCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}
