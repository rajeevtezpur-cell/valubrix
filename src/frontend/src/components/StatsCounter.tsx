import { useCountUp } from "../hooks/useCountUp";

function StatItem({
  target,
  label,
  prefix = "",
  suffix = "+",
}: { target: number; label: string; prefix?: string; suffix?: string }) {
  const { count, ref } = useCountUp(target, 2200);
  const display =
    target >= 1000 ? count.toLocaleString("en-IN") : count.toString();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="flex flex-col items-center gap-2"
    >
      <span
        className="text-4xl md:text-5xl font-bold"
        style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}
      >
        {prefix}
        {display}
        {suffix}
      </span>
      <span className="text-sm md:text-base text-white/60 text-center">
        {label}
      </span>
    </div>
  );
}

export default function StatsCounter() {
  return (
    <section className="py-20 relative">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 50%, rgba(59,130,246,0.04) 100%)",
        }}
      />
      <div className="relative max-w-5xl mx-auto px-4">
        <div
          className="glass-card py-12 px-8 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6 text-center"
          style={{ border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <StatItem target={10000} label="Valuations Completed" />
          <div
            className="hidden sm:block w-px"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <StatItem target={500} label="Cities Covered" />
          <div
            className="hidden sm:block w-px"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <StatItem
            target={2000}
            label="Cr+ Property Value Assessed"
            prefix="₹"
          />
        </div>
      </div>
    </section>
  );
}
