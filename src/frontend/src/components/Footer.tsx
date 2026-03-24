export default function Footer() {
  const year = new Date().getFullYear();
  const utm = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "valubrix",
  );
  return (
    <footer
      className="py-10 text-center"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <div className="mb-3">
        <span
          className="font-bold text-lg tracking-tight"
          style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}
        >
          ValuBrix
        </span>
      </div>
      <p className="text-white/30 text-sm">
        &copy; {year}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${utm}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
        >
          caffeine.ai
        </a>
      </p>
      <p className="text-white/20 text-xs mt-2">
        India&apos;s most transparent property intelligence platform
      </p>
    </footer>
  );
}
