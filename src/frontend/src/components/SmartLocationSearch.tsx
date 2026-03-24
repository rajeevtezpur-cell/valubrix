import { Check, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LocationRecord } from "../data/locationData";
import locationData from "../data/locationData";
import { searchLocations } from "../utils/locationSearch";

interface SmartLocationSearchProps {
  onSelect?: (location: LocationRecord) => void;
  placeholder?: string;
  size?: "default" | "large";
  className?: string;
  initialLocation?: LocationRecord;
  externalValue?: string;
}

const typeBadgeColor: Record<string, string> = {
  city: "bg-blue-500/20 text-blue-300",
  district: "bg-purple-500/20 text-purple-300",
  locality: "bg-emerald-500/20 text-emerald-300",
  village: "bg-yellow-500/20 text-yellow-300",
  road: "bg-orange-500/20 text-orange-300",
  sector: "bg-cyan-500/20 text-cyan-300",
  layout: "bg-pink-500/20 text-pink-300",
  GP: "bg-amber-500/20 text-amber-300",
};

export default function SmartLocationSearch({
  onSelect,
  placeholder = "Search locality, city or pincode",
  size = "default",
  className = "",
  initialLocation,
  externalValue,
}: SmartLocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LocationRecord | null>(
    initialLocation ?? null,
  );
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect =
      inputRef.current
        .closest(".search-input-wrapper")
        ?.getBoundingClientRect() ?? inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setQuery(val);
      if (val.trim().length >= 2) {
        const res = searchLocations(val, locationData);
        setResults(res);
        setOpen(true);
        updateDropdownPosition();
      } else {
        setResults([]);
        setOpen(false);
      }
    },
    [updateDropdownPosition],
  );

  const handleSelect = (loc: LocationRecord) => {
    setJustSelected(loc.id);
    setTimeout(() => {
      setSelected(loc);
      setQuery("");
      setOpen(false);
      setResults([]);
      setJustSelected(null);
      onSelect?.(loc);
    }, 350);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node) &&
        !(e.target as Element)?.closest("[data-ocid='location.dropdown_menu']")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional – only sync on externalValue change
  useEffect(() => {
    if (externalValue === undefined) return;
    if (selected && selected.name === externalValue) return;
    if (!selected && query === externalValue) return;
    setSelected(null);
    setQuery(externalValue || "");
  }, [externalValue]);

  const isLarge = size === "large";

  if (selected) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          className="location-chip flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-white shadow-lg shadow-emerald-500/10"
          data-ocid="location.chip"
        >
          <MapPin size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium text-sm">
            {selected.name}, {selected.city}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 text-white/50 hover:text-white/90 transition-colors"
            data-ocid="location.chip.close_button"
            aria-label="Change location"
          >
            <X size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
          data-ocid="location.change_button"
        >
          Change location
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        className={`search-input-wrapper flex items-center gap-3 rounded-2xl bg-white/8 border border-white/15 backdrop-blur-sm transition-all focus-within:border-emerald-500/60 focus-within:bg-white/12 focus-within:shadow-lg focus-within:shadow-emerald-500/10 ${
          isLarge ? "px-5 py-4" : "px-4 py-3"
        }`}
      >
        <MapPin
          size={isLarge ? 22 : 18}
          className="text-emerald-400 shrink-0"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
              updateDropdownPosition();
            }
          }}
          placeholder={placeholder}
          className={`flex-1 bg-transparent outline-none text-white placeholder:text-white/40 ${
            isLarge ? "text-lg" : "text-sm"
          }`}
          data-ocid="location.search_input"
          aria-label="Search location"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
              setResults([]);
            }}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <X size={16} />
          </button>
        )}
        {!query && (
          <Search size={isLarge ? 20 : 16} className="text-white/30 shrink-0" />
        )}
      </div>

      {/* Dropdown – rendered with fixed position to escape overflow:hidden ancestors */}
      {open && results.length > 0 && (
        <div
          style={dropdownStyle}
          className="rounded-xl border border-white/10 bg-[#0d1526]/95 backdrop-blur-xl shadow-2xl shadow-black/40 max-h-[300px] overflow-y-auto"
          data-ocid="location.dropdown_menu"
        >
          {results.map((loc, i) => (
            <button
              type="button"
              key={loc.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(loc)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/8 group border-b border-white/5 last:border-0 ${
                justSelected === loc.id ? "bg-emerald-500/15 scale-[0.99]" : ""
              }`}
              data-ocid={`location.dropdown_menu.item.${i + 1}`}
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                {justSelected === loc.id ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <MapPin
                    size={14}
                    className="text-white/40 group-hover:text-emerald-400 transition-colors"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">
                    {loc.name}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeBadgeColor[loc.type] ?? "bg-white/10 text-white/50"}`}
                  >
                    {loc.type}
                  </span>
                </div>
                <div className="text-xs text-white/45 mt-0.5 truncate">
                  {loc.district}, {loc.state} &mdash; {loc.pincode}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.length >= 2 && (
        <div
          style={dropdownStyle}
          className="rounded-xl border border-white/10 bg-[#0d1526]/95 backdrop-blur-xl shadow-2xl shadow-black/40"
          data-ocid="location.dropdown_menu.empty_state"
        >
          <div className="px-4 py-6 text-center text-white/40 text-sm">
            No locations found. Try a different name or pincode.
          </div>
        </div>
      )}
    </div>
  );
}
