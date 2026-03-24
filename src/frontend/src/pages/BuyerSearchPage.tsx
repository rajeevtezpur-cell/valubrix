import { useNavigate } from "@tanstack/react-router";
import { Filter, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import BuyerLayout from "../components/BuyerLayout";
import SmartLocationSearch from "../components/SmartLocationSearch";
import type { LocationRecord } from "../data/locationData";
import { formatPrice, getAllListings } from "../data/mockListings";

const MAP_LOCALITIES = [
  { name: "Koramangala", city: "Bangalore" },
  { name: "Indiranagar", city: "Bangalore" },
  { name: "Whitefield", city: "Bangalore" },
  { name: "Electronic City", city: "Bangalore" },
  { name: "Hebbal", city: "Bangalore" },
  { name: "HSR Layout", city: "Bangalore" },
  { name: "Marathahalli", city: "Bangalore" },
  { name: "Sarjapur Road", city: "Bangalore" },
  { name: "JP Nagar", city: "Bangalore" },
  { name: "Bellandur", city: "Bangalore" },
  { name: "Hinjewadi", city: "Pune" },
  { name: "Baner", city: "Pune" },
  { name: "Kharadi", city: "Pune" },
  { name: "Andheri", city: "Mumbai" },
  { name: "Powai", city: "Mumbai" },
  { name: "Dwarka", city: "Delhi" },
  { name: "Noida", city: "Delhi" },
  { name: "Gachibowli", city: "Hyderabad" },
  { name: "Madhapur", city: "Hyderabad" },
  { name: "OMR", city: "Chennai" },
  { name: "Adyar", city: "Chennai" },
  { name: "New Town", city: "Kolkata" },
];

const BASE_PRICES: Record<string, number> = {
  Bangalore: 9000,
  Pune: 7500,
  Delhi: 8500,
};

function getAiValue(city: string, area: number): number {
  return (BASE_PRICES[city] || 9000) * Math.max(area, 800);
}

function getDealLabel(
  listingPrice: number,
  aiValue: number,
): { label: string; color: string; bg: string } {
  const ratio = listingPrice / aiValue;
  if (ratio < 0.9)
    return {
      label: "Good Deal",
      color: "text-green-300",
      bg: "bg-green-500/20 border-green-500/30",
    };
  if (ratio <= 1.1)
    return {
      label: "Fair Deal",
      color: "text-yellow-300",
      bg: "bg-yellow-500/20 border-yellow-500/30",
    };
  return {
    label: "Overpriced",
    color: "text-red-300",
    bg: "bg-red-500/20 border-red-500/30",
  };
}

function getInvestScoreStyle(score: number) {
  if (score >= 80) return "text-emerald-400 bg-black/60 border-emerald-500/50";
  if (score >= 65) return "text-yellow-400 bg-black/60 border-yellow-500/50";
  return "text-red-400 bg-black/60 border-red-500/50";
}

function getRecoStyle(reco: string) {
  if (reco === "Strong Buy" || reco === "Buy")
    return "text-emerald-400 bg-emerald-500/10";
  if (reco === "Hold") return "text-yellow-400 bg-yellow-500/10";
  return "text-red-400 bg-red-500/10";
}

const CONSTRUCTION_AGES = [
  { value: "any", label: "Any Age" },
  { value: "0-3", label: "0–3 yrs" },
  { value: "3-7", label: "3–7 yrs" },
  { value: "7-10", label: "7–10 yrs" },
  { value: "10+", label: "10+ yrs" },
];

export default function BuyerSearchPage() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(true);
  const [propTypes, setPropTypes] = useState<string[]>([]);
  const [bhkFilter, setBhkFilter] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [builderFilter, setBuilderFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [constructionAge, setConstructionAge] = useState("any");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationRecord | null>(null);
  const [showMap, setShowMap] = useState(false);

  const togglePropType = (t: string) =>
    setPropTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  const toggleBhk = (b: number) =>
    setBhkFilter((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  const toggleAmenity = (a: string) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  function handleLocalitySelect(loc: { name: string; city: string }) {
    const syntheticLocation: LocationRecord = {
      id: `locality-${loc.name.toLowerCase().replace(/ /g, "-")}`,
      name: loc.name,
      type: "locality" as const,
      city: loc.city,
      district: loc.city,
      state: "India",
      pincode: "",
      searchTokens: [loc.name.toLowerCase(), loc.city.toLowerCase()],
    };
    setSelectedLocation(syntheticLocation);
    setShowMap(false);
  }

  const filtered = getAllListings().filter((l) => {
    if (propTypes.length > 0 && !propTypes.includes(l.propertyType))
      return false;
    if (bhkFilter.length > 0) {
      if (bhkFilter.includes(4)) {
        if (!l.bhk || (l.bhk < 4 && !bhkFilter.slice(0, -1).includes(l.bhk)))
          return false;
      } else if (l.bhk && !bhkFilter.includes(l.bhk)) return false;
    }
    if (minPrice && l.price < Number(minPrice) * 100000) return false;
    if (maxPrice && l.price > Number(maxPrice) * 100000) return false;
    if (
      builderFilter &&
      !l.builderName?.toLowerCase().includes(builderFilter.toLowerCase())
    )
      return false;
    if (
      projectFilter &&
      !l.title.toLowerCase().includes(projectFilter.toLowerCase())
    )
      return false;
    const area = l.carpetArea || l.plotArea || 0;
    if (minArea && area < Number(minArea)) return false;
    if (maxArea && area > Number(maxArea)) return false;
    if (amenities.length > 0) {
      const has = amenities.every((a) =>
        l.amenities?.some((la) => la.toLowerCase().includes(a.toLowerCase())),
      );
      if (!has) return false;
    }
    if (selectedLocation) {
      const locName = selectedLocation.name.toLowerCase().trim();
      const lLoc = l.location.toLowerCase().trim();
      const _lCity = l.city.toLowerCase().trim();
      // Strict bidirectional locality match, or exact city match only
      const matches = lLoc.includes(locName) || locName.includes(lLoc);
      if (!matches) return false;
    }
    return true;
  });

  return (
    <BuyerLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Search Properties</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {filtered.length} properties found
            </p>
          </div>
          <button
            type="button"
            data-ocid="buyer_search.filter.toggle"
            onClick={() => setShowFilters((f) => !f)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition-all"
          >
            <SlidersHorizontal size={14} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Location Search + Map Toggle */}
        <div className="mb-5">
          <div className="flex items-start gap-2">
            <div
              className="flex-1 max-w-xl"
              data-ocid="buyer_search.location.search_input"
            >
              <SmartLocationSearch
                placeholder="Filter by locality, city or region..."
                onSelect={(loc) => {
                  setSelectedLocation(loc);
                  setShowMap(false);
                }}
                className="w-full"
              />
            </div>
            <button
              type="button"
              data-ocid="buyer_search.map.toggle"
              onClick={() => setShowMap((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all whitespace-nowrap ${
                showMap
                  ? "bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              }`}
            >
              <MapIcon size={14} />
              Select on Map
            </button>
          </div>

          {/* Locality picker panel */}
          {showMap && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/3 p-3">
              <p className="text-white/40 text-xs mb-2">Select a locality:</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
                {MAP_LOCALITIES.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleLocalitySelect(loc)}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:border-[#D4AF37]/40 hover:text-white text-xs truncate transition-all text-left"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedLocation && (
            <button
              type="button"
              onClick={() => {
                setSelectedLocation(null);
              }}
              className="mt-2 text-xs text-white/40 hover:text-white flex items-center gap-1"
            >
              <X size={12} /> Clear location filter ({selectedLocation.name},{" "}
              {selectedLocation.city})
            </button>
          )}
        </div>

        <div className="flex gap-6 overflow-hidden">
          {/* FILTER PANEL */}
          {showFilters && (
            <aside
              data-ocid="buyer_search.filter.panel"
              className="w-full sm:w-64 flex-shrink-0 space-y-5"
            >
              {/* Property Type */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
                  Property Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {["flat", "villa", "plot"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => togglePropType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                        propTypes.includes(t)
                          ? "bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
                  Price Range (Lakhs)
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    data-ocid="buyer_search.min_price.input"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    data-ocid="buyer_search.max_price.input"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* BHK */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
                  BHK
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBhk(b)}
                      className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all ${
                        bhkFilter.includes(b)
                          ? "bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {b === 4 ? "4+" : b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Builder & Project */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
                    Builder Name
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Prestige, Sobha"
                    value={builderFilter}
                    onChange={(e) => setBuilderFilter(e.target.value)}
                    data-ocid="buyer_search.builder.input"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30"
                  />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
                    Project Name
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Lakeside Habitat"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    data-ocid="buyer_search.project.input"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* Area Size */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
                  Area (sqft)
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value)}
                    data-ocid="buyer_search.min_area.input"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxArea}
                    onChange={(e) => setMaxArea(e.target.value)}
                    data-ocid="buyer_search.max_area.input"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* Construction Age */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
                  Construction Age
                </p>
                <select
                  value={constructionAge}
                  onChange={(e) => setConstructionAge(e.target.value)}
                  data-ocid="buyer_search.construction_age.select"
                  className="w-full bg-[#0A0F1F] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#D4AF37]/50"
                >
                  {CONSTRUCTION_AGES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amenities */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
                  Amenities
                </p>
                <div className="space-y-2">
                  {["Parking", "Gym", "Swimming Pool"].map((a) => (
                    <label
                      key={a}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={amenities.includes(a)}
                        onChange={() => toggleAmenity(a)}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="text-white/60 text-xs">{a}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  setPropTypes([]);
                  setBhkFilter([]);
                  setMinPrice("");
                  setMaxPrice("");
                  setBuilderFilter("");
                  setProjectFilter("");
                  setMinArea("");
                  setMaxArea("");
                  setConstructionAge("any");
                  setAmenities([]);
                  setSelectedLocation(null);
                }}
                className="w-full py-2 rounded-xl border border-white/10 text-white/40 hover:text-white text-xs flex items-center justify-center gap-1 transition-all"
              >
                <Filter size={12} /> Reset Filters
              </button>
            </aside>
          )}

          {/* PROPERTY GRID */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div
                data-ocid="buyer_search.empty_state"
                className="flex flex-col items-center justify-center py-24 text-white/30"
              >
                <p className="text-lg font-medium">
                  No properties match your filters
                </p>
                <p className="text-sm mt-1">
                  Try adjusting or resetting the filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((listing, idx) => {
                  const area = listing.carpetArea || listing.plotArea || 1000;
                  const aiVal = getAiValue(listing.city, area);
                  const deal = getDealLabel(listing.price, aiVal);
                  const dealLabel = listing.dealClassification ?? deal.label;
                  return (
                    <button
                      type="button"
                      key={listing.id}
                      data-ocid={`buyer_search.property.card.${idx + 1}`}
                      onClick={() =>
                        navigate({
                          to: "/property/$id",
                          params: { id: listing.id },
                        })
                      }
                      className="group bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)] text-left w-full"
                    >
                      <div className="relative">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-44 object-cover"
                        />
                        {/* Deal tag */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full border font-medium ${deal.color} ${deal.bg}`}
                          >
                            {dealLabel}
                          </span>
                        </div>
                        {/* Investment Score badge */}
                        {listing.investmentScore !== undefined && (
                          <div className="absolute top-3 right-3">
                            <span
                              className={`text-xs font-bold w-9 h-9 rounded-full border flex items-center justify-center ${getInvestScoreStyle(listing.investmentScore)}`}
                            >
                              {listing.investmentScore}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-4">
                          <div className="flex items-end justify-between">
                            <span className="text-white font-bold text-lg">
                              {formatPrice(listing.price)}
                            </span>
                            <div className="text-right">
                              <p className="text-white/50 text-[10px]">
                                AI Value
                              </p>
                              <p className="text-green-300 font-semibold text-sm">
                                {formatPrice(aiVal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {listing.title}
                        </h3>
                        <p className="text-white/40 text-xs mt-0.5">
                          {listing.location}, {listing.city}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-white/50 text-xs">
                          {listing.bhk && <span>{listing.bhk} BHK</span>}
                          <span>{area.toLocaleString()} sqft</span>
                          {listing.builderName && (
                            <span className="text-[#D4AF37]/70">
                              {listing.builderName}
                            </span>
                          )}
                        </div>
                        {listing.aiRecommendation && (
                          <div className="mt-2">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRecoStyle(listing.aiRecommendation)}`}
                            >
                              ▶ {listing.aiRecommendation}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
