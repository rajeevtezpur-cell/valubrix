import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import BuyerLayout from "../components/BuyerLayout";
import { MOCK_LISTINGS, formatPrice } from "../data/mockListings";

const ZONES = [
  {
    id: "north",
    label: "North Bangalore",
    avgPrice: 7200,
    listings: 42,
    demand: 79,
    x: 160,
    y: 30,
    w: 180,
    h: 100,
    color: "#3b82f6",
    keywords: ["Hebbal", "Yelahanka", "Devanahalli"],
  },
  {
    id: "east",
    label: "East Bangalore",
    avgPrice: 9800,
    listings: 68,
    demand: 91,
    x: 340,
    y: 120,
    w: 160,
    h: 140,
    color: "#f59e0b",
    keywords: ["Whitefield", "Indiranagar", "Koramangala"],
  },
  {
    id: "south",
    label: "South Bangalore",
    avgPrice: 8500,
    listings: 55,
    demand: 85,
    x: 160,
    y: 240,
    w: 180,
    h: 110,
    color: "#10b981",
    keywords: ["Bannerghatta", "Electronic City"],
  },
  {
    id: "central",
    label: "Central Bangalore",
    avgPrice: 12400,
    listings: 28,
    demand: 94,
    x: 175,
    y: 120,
    w: 160,
    h: 120,
    color: "#ef4444",
    keywords: ["MG Road", "Jayanagar", "Koramangala"],
  },
  {
    id: "west",
    label: "West Bangalore",
    avgPrice: 5800,
    listings: 31,
    demand: 71,
    x: 20,
    y: 120,
    w: 140,
    h: 140,
    color: "#8b5cf6",
    keywords: ["Rajajinagar", "Yeshwanthpur"],
  },
];

const BASE_PRICES: Record<string, number> = {
  Bangalore: 9000,
  Pune: 7500,
  Delhi: 8500,
};

function getAiValue(city: string, area: number): number {
  return (BASE_PRICES[city] || 9000) * Math.max(area, 800);
}

// @ts-nocheck
function loadLeafletForMap(): Promise<void> {
  return new Promise((resolve) => {
    if (window.L) {
      resolve();
      return;
    }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    } else {
      const check = () => {
        if (window.L) resolve();
        else setTimeout(check, 50);
      };
      check();
    }
  });
}

// Zone center coordinates for Bangalore
const ZONE_COORDS: Record<string, [number, number]> = {
  north: [13.1, 77.595],
  south: [12.89, 77.595],
  east: [13.0, 77.74],
  west: [13.0, 77.52],
  central: [12.97, 77.595],
};

const ZONE_COLORS: Record<string, string> = {
  north: "#3b82f6",
  south: "#10b981",
  east: "#f59e0b",
  west: "#8b5cf6",
  central: "#ef4444",
};

function BangaloreLeafletMap({
  zones,
  selectedZone,
  onSelectZone,
}: {
  zones: typeof ZONES;
  selectedZone: string | null;
  onSelectZone: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    loadLeafletForMap().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = window.L;
      const m = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([12.97, 77.59], 11);
      mapRef.current = m;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(m);
      for (const d of [100, 300, 600]) setTimeout(() => m.invalidateSize(), d);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        circlesRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    const lmap = mapRef.current;
    if (!lmap || !window.L) return;
    const L = window.L;
    for (const c of circlesRef.current) lmap.removeLayer(c);
    circlesRef.current = [];
    for (const zone of zones) {
      const coords = ZONE_COORDS[zone.id];
      if (!coords) continue;
      const color = ZONE_COLORS[zone.id] || "#3b82f6";
      const isSelected = zone.id === selectedZone;
      const circle = L.circle(coords, {
        radius: 4000,
        color,
        fillColor: color,
        fillOpacity: isSelected ? 0.5 : 0.2,
        weight: isSelected ? 3 : 1.5,
      }).addTo(lmap);
      const label = L.divIcon({
        className: "",
        html: `<div style="background:${isSelected ? color : "rgba(0,0,0,0.7)"};color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:700;border:1.5px solid ${color};pointer-events:none">${zone.label.replace(" Bangalore", "")}<br/><span style="font-size:9px">₹${(zone.avgPrice / 1000).toFixed(1)}K/sqft</span></div>`,
        iconAnchor: [40, 16],
      });
      const labelMarker = L.marker(coords, {
        icon: label,
        interactive: false,
      }).addTo(lmap);
      circle.on("click", () => onSelectZone(zone.id));
      circlesRef.current.push(circle, labelMarker);
    }
  }, [zones, selectedZone, onSelectZone]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", borderRadius: 16 }}
    />
  );
}

export default function BuyerMapPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const selectedZoneData = ZONES.find((z) => z.id === selectedZone);
  const zoneListings = selectedZone
    ? MOCK_LISTINGS.filter((l) => {
        const zone = ZONES.find((z) => z.id === selectedZone);
        if (!zone) return true;
        return zone.keywords.some(
          (k) => l.location.includes(k) || l.city === "Bangalore",
        );
      }).slice(0, 6)
    : [];

  return (
    <BuyerLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Map Explorer</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Click a zone to explore listings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaflet Zone Map */}
          <div className="lg:col-span-2">
            <div
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative"
              style={{ height: 400 }}
            >
              <BangaloreLeafletMap
                zones={ZONES}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
              />
            </div>
          </div>

          {/* Zone Detail / Listings */}
          <div className="space-y-4">
            {selectedZoneData ? (
              <>
                <div
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  style={{ borderColor: `${selectedZoneData.color}40` }}
                >
                  <h3 className="text-white font-bold">
                    {selectedZoneData.label}
                  </h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Avg Price</span>
                      <span className="text-white font-mono">
                        ₹{selectedZoneData.avgPrice.toLocaleString()}/sqft
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Listings</span>
                      <span className="text-white">
                        {selectedZoneData.listings}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Demand Score</span>
                      <span
                        style={{ color: selectedZoneData.color }}
                        className="font-bold"
                      >
                        {selectedZoneData.demand}/100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                    Listings in Zone
                  </p>
                  {zoneListings.map((l) => {
                    const area = l.carpetArea || l.plotArea || 1000;
                    const aiVal = getAiValue(l.city, area);
                    const isGoodDeal = l.price < aiVal * 0.9;
                    return (
                      <Link
                        key={l.id}
                        to="/property/$id"
                        params={{ id: l.id }}
                        className="block bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 rounded-xl p-3 transition-all"
                      >
                        <img
                          src={l.images[0]}
                          alt={l.title}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                        <p className="text-white text-xs font-medium truncate">
                          {l.title}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[#D4AF37] font-bold font-mono text-xs">
                            {formatPrice(l.price)}
                          </span>
                          {isGoodDeal && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                              Good Deal
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-white/40 text-sm">
                  Click a zone on the map to explore listings
                </p>
                <div className="mt-4 space-y-2">
                  {ZONES.map((z) => (
                    <div
                      key={z.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: z.color }}
                        />
                        <span className="text-white/60">{z.label}</span>
                      </div>
                      <span className="text-white/40">
                        {z.listings} listings
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
