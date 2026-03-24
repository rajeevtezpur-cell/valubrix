import { MapPin } from "lucide-react";
import { useState } from "react";
import { reverseGeocode } from "../utils/reverseGeocode";

const GEO_LOCALITIES = [
  { name: "Koramangala", city: "Bangalore", lat: 12.9352, lng: 77.6245 },
  { name: "Indiranagar", city: "Bangalore", lat: 12.9784, lng: 77.6408 },
  { name: "Whitefield", city: "Bangalore", lat: 12.9698, lng: 77.7499 },
  { name: "Electronic City", city: "Bangalore", lat: 12.8399, lng: 77.677 },
  { name: "Hebbal", city: "Bangalore", lat: 13.035, lng: 77.597 },
  { name: "Yelahanka", city: "Bangalore", lat: 13.1007, lng: 77.5963 },
  { name: "HSR Layout", city: "Bangalore", lat: 12.9116, lng: 77.6389 },
  { name: "Marathahalli", city: "Bangalore", lat: 12.9591, lng: 77.6975 },
  { name: "Sarjapur Road", city: "Bangalore", lat: 12.901, lng: 77.688 },
  { name: "JP Nagar", city: "Bangalore", lat: 12.9063, lng: 77.5857 },
  { name: "Malleswaram", city: "Bangalore", lat: 13.0035, lng: 77.565 },
  { name: "Devanahalli", city: "Bangalore", lat: 13.25, lng: 77.71 },
  { name: "Thanisandra", city: "Bangalore", lat: 13.06, lng: 77.63 },
  { name: "Hennur", city: "Bangalore", lat: 13.035, lng: 77.638 },
  { name: "BTM Layout", city: "Bangalore", lat: 12.9165, lng: 77.6101 },
  { name: "Jayanagar", city: "Bangalore", lat: 12.9299, lng: 77.5833 },
  { name: "Bellandur", city: "Bangalore", lat: 12.9243, lng: 77.6784 },
  { name: "KR Puram", city: "Bangalore", lat: 13.0052, lng: 77.6955 },
  { name: "Bagalur", city: "Bangalore", lat: 13.18, lng: 77.65 },
  { name: "Rajankunte", city: "Bangalore", lat: 13.13, lng: 77.6 },
  { name: "Hinjewadi", city: "Pune", lat: 18.5971, lng: 73.7367 },
  { name: "Baner", city: "Pune", lat: 18.5625, lng: 73.7724 },
  { name: "Wakad", city: "Pune", lat: 18.6023, lng: 73.7607 },
  { name: "Koregaon Park", city: "Pune", lat: 18.5362, lng: 73.8955 },
  { name: "Kharadi", city: "Pune", lat: 18.5535, lng: 73.9408 },
  { name: "Dwarka", city: "Delhi", lat: 28.5921, lng: 77.046 },
  { name: "South Delhi", city: "Delhi", lat: 28.5274, lng: 77.2107 },
  { name: "Gurgaon Sector 45", city: "Delhi", lat: 28.4089, lng: 77.0433 },
  { name: "Noida", city: "Delhi", lat: 28.5355, lng: 77.391 },
  { name: "Andheri", city: "Mumbai", lat: 19.1136, lng: 72.8697 },
  { name: "Powai", city: "Mumbai", lat: 19.1177, lng: 72.9054 },
  { name: "Thane", city: "Mumbai", lat: 19.2183, lng: 72.9781 },
];

export type GeoLocality = (typeof GEO_LOCALITIES)[number];

export interface LocationSelectResult {
  lat: number;
  lng: number;
  displayAddress: string;
  locality: GeoLocality | null;
}

interface Props {
  onLocationSelect: (result: LocationSelectResult) => void;
  height?: string;
  initialCenter?: [number, number];
  className?: string;
}

const CITIES = ["Bangalore", "Pune", "Delhi", "Mumbai"];

export default function LocationSelectMap({
  onLocationSelect,
  className = "",
}: Props) {
  const [selected, setSelected] = useState<GeoLocality | null>(null);
  const [activeCity, setActiveCity] = useState("Bangalore");
  const [loading, setLoading] = useState(false);

  const cityLocalities = GEO_LOCALITIES.filter((l) => l.city === activeCity);

  const handleSelect = async (loc: GeoLocality) => {
    setSelected(loc);
    setLoading(true);
    const address = await reverseGeocode(loc.lat, loc.lng);
    setLoading(false);
    onLocationSelect({
      lat: loc.lat,
      lng: loc.lng,
      displayAddress: address || `${loc.name}, ${loc.city}`,
      locality: loc,
    });
  };

  return (
    <div className={className}>
      {/* City tabs */}
      <div className="flex gap-1.5 mb-2">
        {CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setActiveCity(city)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeCity === city
                ? "bg-[#D4AF37] text-black"
                : "bg-white/5 text-white/50 hover:text-white border border-white/10"
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Locality grid */}
      <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {cityLocalities.map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => handleSelect(loc)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left transition-all ${
              selected?.name === loc.name
                ? "bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]"
                : "bg-white/5 border border-white/10 text-white/70 hover:border-white/30"
            }`}
          >
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{loc.name}</span>
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="mt-2 px-1 text-xs">
        {loading && <p className="text-white/40">📍 Detecting location...</p>}
        {!loading && selected && (
          <p className="text-[#D4AF37] font-semibold">
            Selected: {selected.name}, {selected.city}
          </p>
        )}
        {!loading && !selected && (
          <p className="text-white/30">Click a locality to select a location</p>
        )}
      </div>
    </div>
  );
}
