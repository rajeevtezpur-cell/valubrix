import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Valuation", href: "#valuation" },
  { label: "List Property", href: "#list" },
  { label: "Search", href: "#search" },
  { label: "Services", href: "#services" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { user, openLoginModal } = useAuth();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 50,
        background: "rgba(10,15,30,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#home" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/assets/uploads/5EB5878E-7937-4598-9486-6156F9B2EB9F-3-1.png"
              alt="ValuBrix"
              className="h-9 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                setLogoError(true);
              }}
              style={{ display: logoError ? "none" : undefined }}
            />
            {logoError && (
              <span
                className="font-bold text-xl tracking-tight"
                style={{
                  color: "#C9A84C",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                ValuBrix
              </span>
            )}
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                data-ocid="navbar.link"
                className="text-sm font-medium text-white/80 hover:text-[#C9A84C] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 px-2">
                  {user.fullName || user.username}
                </span>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="navbar.primary_button"
                className="px-5 py-2 text-sm font-semibold rounded-full border transition-all duration-300"
                style={{ color: "#C9A84C", borderColor: "#C9A84C" }}
                onClick={() => openLoginModal()}
                onMouseEnter={(e) => {
                  const b = e.currentTarget;
                  b.style.background = "#C9A84C";
                  b.style.color = "#0A0F1E";
                  b.style.boxShadow = "0 0 20px rgba(201,168,76,0.5)";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget;
                  b.style.background = "transparent";
                  b.style.color = "#C9A84C";
                  b.style.boxShadow = "none";
                }}
              >
                Login / Signup
              </button>
            )}
          </div>

          <button
            type="button"
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-3"
          style={{ background: "rgba(10,15,30,0.97)" }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              data-ocid="navbar.link"
              className="text-sm font-medium text-white/80 hover:text-[#C9A84C] py-2 border-b border-white/5 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {!user && (
            <button
              type="button"
              data-ocid="navbar.primary_button"
              className="mt-2 px-5 py-2 text-sm font-semibold rounded-full border"
              style={{ color: "#C9A84C", borderColor: "#C9A84C" }}
              onClick={() => {
                setMobileOpen(false);
                openLoginModal();
              }}
            >
              Login / Signup
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
