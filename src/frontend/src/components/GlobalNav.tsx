import { Link, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function GlobalNav() {
  const { user, logout, openLoginModal, setUserRole } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate({ to: "/" });
  };

  const handleSwitchRole = (role: "buyer" | "seller" | "banker") => {
    setUserRole(role);
    setDropdownOpen(false);
    if (role === "buyer") navigate({ to: "/buyer" });
    else if (role === "seller") navigate({ to: "/seller" });
    else if (role === "banker") navigate({ to: "/bank" });
  };

  const dashboardLink =
    user?.role === "buyer"
      ? "/buyer"
      : user?.role === "seller"
        ? "/seller"
        : user?.role === "bankOfficer" || user?.role === "banker"
          ? "/bank"
          : user?.role === "admin"
            ? "/admin"
            : "/dashboard";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F1F]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/assets/uploads/5EB5878E-7937-4598-9486-6156F9B2EB9F-3-1.png"
            alt="ValuBrix"
            className="h-9 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextSibling as HTMLElement;
              if (fallback) fallback.style.display = "block";
            }}
          />
          <span
            className="font-bold text-xl tracking-tight"
            style={{
              color: "#C9A84C",
              fontFamily: "'Playfair Display', serif",
              display: "none",
            }}
          >
            ValuBrix
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            data-ocid="nav.home.link"
            className="text-white/70 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            Home
          </Link>
          <Link
            to="/valuation"
            data-ocid="nav.valuation.link"
            className="text-white/70 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            Valuation
          </Link>
          <Link
            to="/search"
            data-ocid="nav.search.link"
            className="text-white/70 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            Search Properties
          </Link>
          <Link
            to="/seller/list-property"
            data-ocid="nav.list.link"
            className="text-white/70 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            List Property
          </Link>
          <Link
            to="/bank"
            data-ocid="nav.bank.link"
            className="flex items-center gap-1.5 text-white/70 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            <Building2 size={14} />
            Bank Portal
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                data-ocid="nav.profile.button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-white text-sm transition-all"
              >
                <User size={16} className="text-[#D4AF37]" />
                <span className="hidden sm:block">
                  {user.fullName || user.username}
                </span>
                <ChevronDown size={14} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-10 w-56 bg-[#121B35] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                  <Link
                    to={dashboardLink as "/"}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white text-sm transition-colors"
                  >
                    <LayoutDashboard size={14} /> My Dashboard
                  </Link>
                  {user.role === "seller" && (
                    <Link
                      to="/seller"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white text-sm transition-colors"
                    >
                      <List size={14} /> My Listings
                    </Link>
                  )}
                  {/* Switch Role */}
                  <div className="border-t border-white/5 px-4 py-2">
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-2">
                      Switch Role
                    </p>
                    {(["buyer", "seller", "banker"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        data-ocid={`nav.switch_role.${role}.button`}
                        onClick={() => handleSwitchRole(role)}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:bg-white/5 hover:text-white text-sm transition-colors capitalize"
                      >
                        <RefreshCw size={12} />
                        {role === "banker"
                          ? "Banker"
                          : role.charAt(0).toUpperCase() + role.slice(1)}
                        {user.role === role ||
                        (user.role === "bankOfficer" && role === "banker") ? (
                          <span className="ml-auto text-[#D4AF37] text-xs">
                            ✓ Active
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-ocid="nav.logout.button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-white/5 text-sm transition-colors border-t border-white/5"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              data-ocid="nav.login.button"
              onClick={() => openLoginModal()}
              className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold px-4 py-1.5 rounded-full text-sm transition-all"
            >
              Login
            </button>
          )}
          <button
            type="button"
            className="md:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A0F1F] border-t border-white/10 px-4 py-3 flex flex-col gap-3">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-[#D4AF37] py-2 text-sm"
          >
            Home
          </Link>
          <Link
            to="/valuation"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-[#D4AF37] py-2 text-sm"
          >
            Valuation
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-[#D4AF37] py-2 text-sm"
          >
            Search Properties
          </Link>
          <Link
            to="/seller/list-property"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-[#D4AF37] py-2 text-sm"
          >
            List Property
          </Link>
          <Link
            to="/bank"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-[#D4AF37] py-2 text-sm"
          >
            Bank Portal
          </Link>
        </div>
      )}
    </nav>
  );
}
