import { useEffect, useRef, useState } from "react";
import { reverseGeocode } from "../utils/reverseGeocode";

declare global {
  interface Window {
    L: any;
  }
}

const KNOWN_LOCALITIES = [
  { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { name: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { name: "Electronic City", lat: 12.8399, lng: 77.677 },
  { name: "Hebbal", lat: 13.035, lng: 77.597 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
  { name: "HSR Layout", lat: 12.9116, lng: 77.6389 },
  { name: "Marathahalli", lat: 12.9591, lng: 77.6975 },
  { name: "Sarjapur", lat: 12.8606, lng: 77.7836 },
  { name: "Bannerghatta Road", lat: 12.889, lng: 77.5975 },
  { name: "JP Nagar", lat: 12.9063, lng: 77.5857 },
  { name: "Malleswaram", lat: 13.0035, lng: 77.565 },
  { name: "Rajankunte", lat: 13.13, lng: 77.6 },
  { name: "Devanahalli", lat: 13.25, lng: 77.71 },
  { name: "Kanakapura Road", lat: 12.85, lng: 77.57 },
  { name: "Bagalur", lat: 13.18, lng: 77.65 },
  { name: "Thanisandra", lat: 13.06, lng: 77.63 },
  { name: "Bellary Road", lat: 13.05, lng: 77.6 },
  { name: "Old Airport Road", lat: 12.96, lng: 77.65 },
  { name: "Nagawara", lat: 13.045, lng: 77.62 },
  { name: "Shivajinagar", lat: 12.9849, lng: 77.602 },
  { name: "Vasanth Nagar", lat: 12.9955, lng: 77.5937 },
  { name: "BTM Layout", lat: 12.9165, lng: 77.6101 },
  { name: "Jayanagar", lat: 12.9299, lng: 77.5833 },
  { name: "Rajajinagar", lat: 12.9908, lng: 77.5536 },
  { name: "Domlur", lat: 12.9608, lng: 77.6418 },
  { name: "Bellandur", lat: 12.9243, lng: 77.6784 },
  { name: "KR Puram", lat: 13.0052, lng: 77.6955 },
  { name: "Hennur", lat: 13.035, lng: 77.638 },
];

export function findNearestLocality(latVal: number, lngVal: number): string {
  let nearest = KNOWN_LOCALITIES[0];
  let minDist = Number.POSITIVE_INFINITY;
  for (const loc of KNOWN_LOCALITIES) {
    const d = Math.sqrt((loc.lat - latVal) ** 2 + (loc.lng - lngVal) ** 2);
    if (d < minDist) {
      minDist = d;
      nearest = loc;
    }
  }
  return nearest.name;
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
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
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Failed to load Leaflet"));
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          resolve(window.L);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("timeout"));
      }, 10000);
    }
  });
}

function getHeatZones(latVal: number, lngVal: number) {
  return [
    { lat: latVal + 0.008, lng: lngVal + 0.005, radius: 600, color: "#ef4444" },
    { lat: latVal - 0.006, lng: lngVal + 0.009, radius: 500, color: "#ef4444" },
    { lat: latVal + 0.015, lng: lngVal - 0.008, radius: 700, color: "#eab308" },
    { lat: latVal - 0.012, lng: lngVal - 0.006, radius: 650, color: "#eab308" },
    { lat: latVal + 0.018, lng: lngVal + 0.014, radius: 550, color: "#eab308" },
    { lat: latVal - 0.02, lng: lngVal + 0.018, radius: 800, color: "#3b82f6" },
    { lat: latVal + 0.022, lng: lngVal - 0.015, radius: 750, color: "#3b82f6" },
    { lat: latVal - 0.018, lng: lngVal - 0.02, radius: 700, color: "#3b82f6" },
  ];
}

function addHeatCircles(
  map: any,
  L: any,
  latVal: number,
  lngVal: number,
): any[] {
  const added: any[] = [];
  for (const zone of getHeatZones(latVal, lngVal)) {
    const circle = L.circle([zone.lat, zone.lng], {
      radius: zone.radius,
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: 0.15,
      weight: 1,
      opacity: 0.4,
    }).addTo(map);
    added.push(circle);
  }
  return added;
}

interface GeoIntelligenceMapProps {
  lat: number;
  lng: number;
  name: string;
  city: string;
  height?: number;
  onLocationChange?: (lat: number, lng: number, name: string) => void;
  externalLocation?: { lat: number; lng: number; name: string };
}

export default function GeoIntelligenceMap({
  lat,
  lng,
  name,
  city,
  height = 280,
  onLocationChange,
  externalLocation,
}: GeoIntelligenceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const initLatRef = useRef(lat);
  const initLngRef = useRef(lng);

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  // Sync marker when parent pushes a new location (e.g. from search)
  // Also fire onLocationChange so the parent page data refreshes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional coord-only trigger
  useEffect(() => {
    if (!externalLocation || !mapRef.current || !markerRef.current) return;
    const { lat: eLat, lng: eLng, name: eName } = externalLocation;
    markerRef.current.setLatLng([eLat, eLng]);
    mapRef.current.setView([eLat, eLng], 13);
    setPinLat(eLat);
    setPinLng(eLng);
    setPinLabel(eName);
    setUseExact(false);
    // Redraw heat circles
    if (window.L) {
      const L = window.L;
      for (const c of circlesRef.current) mapRef.current.removeLayer(c);
      circlesRef.current = addHeatCircles(mapRef.current, L, eLat, eLng);
    }
    // Notify parent so all data panels refresh with new coordinates
    onLocationChangeRef.current?.(eLat, eLng, eName);
  }, [externalLocation?.lat, externalLocation?.lng, externalLocation?.name]);

  const [pinLat, setPinLat] = useState(lat);
  const [pinLng, setPinLng] = useState(lng);
  const [isDragging, setIsDragging] = useState(false);
  const [pinLabel, setPinLabel] = useState(`${name}, ${city}`);
  const [useExact, setUseExact] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPinLat(lat);
    setPinLng(lng);
    setPinLabel(`${name}, ${city}`);
    setUseExact(false);
  }, [lat, lng, name, city]);

  useEffect(() => {
    let cancelled = false;
    const initLat = initLatRef.current;
    const initLng = initLngRef.current;

    async function initMap() {
      try {
        const L = await loadLeaflet();
        if (cancelled || !containerRef.current) return;

        L.Icon.Default.prototype._getIconUrl = undefined;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
        }).setView([initLat, initLng], 13);
        mapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);
        for (const d of [100, 500, 1000])
          setTimeout(() => map?.invalidateSize(), d);
        circlesRef.current = addHeatCircles(map, L, initLat, initLng);

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;background:#D4AF37;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        const marker = L.marker([initLat, initLng], {
          icon,
          draggable: true,
        }).addTo(map);
        markerRef.current = marker;

        marker.on("dragstart", () => setIsDragging(true));
        marker.on("dragend", (e: any) => {
          // Use EXACT coordinates from the event — never replace with locality center
          const newLat = e.target.getLatLng().lat;
          const newLng = e.target.getLatLng().lng;
          const fallbackName = findNearestLocality(newLat, newLng);
          setPinLat(newLat);
          setPinLng(newLng);
          setPinLabel("Loading...");
          setUseExact(false);
          setIsDragging(false);
          map.setView([newLat, newLng], map.getZoom());
          for (const c of circlesRef.current) map.removeLayer(c);
          circlesRef.current = addHeatCircles(map, L, newLat, newLng);
          // Reverse geocode for display label only — NEVER replaces coordinates
          reverseGeocode(newLat, newLng).then((realName) => {
            const displayName =
              realName !== "Unknown location" ? realName : fallbackName;
            setPinLabel(displayName);
            setIsDragging(false);
            // Fire with exact newLat/newLng coordinates
            onLocationChangeRef.current?.(newLat, newLng, displayName);
          });
        });

        map.on("click", (e: any) => {
          // Use EXACT clicked coordinates
          const newLat = e.latlng.lat;
          const newLng = e.latlng.lng;
          const fallbackName = findNearestLocality(newLat, newLng);
          marker.setLatLng([newLat, newLng]);
          setPinLat(newLat);
          setPinLng(newLng);
          setPinLabel("Loading...");
          setUseExact(false);
          for (const c of circlesRef.current) map.removeLayer(c);
          circlesRef.current = addHeatCircles(map, L, newLat, newLng);
          // Reverse geocode for display label only — NEVER replaces coordinates
          reverseGeocode(newLat, newLng).then((realName) => {
            const displayName =
              realName !== "Unknown location" ? realName : fallbackName;
            setPinLabel(displayName);
            // Fire with exact newLat/newLng coordinates
            onLocationChangeRef.current?.(newLat, newLng, displayName);
          });
        });

        setReady(true);
      } catch (err) {
        console.error("GeoIntelligenceMap load error:", err);
      }
    }

    initMap();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      circlesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && ready) {
      mapRef.current.setView([lat, lng], 13);
      markerRef.current?.setLatLng([lat, lng]);
    }
  }, [lat, lng, ready]);

  const hasMoved = pinLat !== lat || pinLng !== lng;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-white/10"
      style={{ height }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {isDragging && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/30 rounded-xl">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasMoved && (
        <div className="absolute bottom-10 right-2 z-[1000]">
          <button
            type="button"
            onClick={() => setUseExact(true)}
            className="bg-[#D4AF37] text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-[#c9a227] transition-colors"
            data-ocid="geo_map.primary_button"
          >
            {useExact
              ? "\u2713 Using exact location"
              : "Use this exact location"}
          </button>
        </div>
      )}

      <div className="absolute top-2 right-2 z-[1000] space-y-1">
        {[
          { c: "#ef4444", l: "High Activity" },
          { c: "#eab308", l: "Medium" },
          { c: "#3b82f6", l: "Low" },
        ].map((item) => (
          <div
            key={item.l}
            className="flex items-center gap-1.5 bg-[#0D1B2A]/90 rounded px-2 py-0.5"
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: item.c }}
            />
            <span className="text-white/70 text-[10px]">{item.l}</span>
          </div>
        ))}
      </div>

      <div className="absolute top-2 left-2 z-[1000]">
        <div className="bg-[#0D1B2A]/90 border border-white/10 rounded px-2 py-0.5">
          <span className="text-white/50 text-[9px]">
            Click or drag pin to explore
          </span>
        </div>
      </div>

      <div className="absolute bottom-2 left-2 z-[1000]">
        <div className="bg-[#0D1B2A]/90 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-white text-xs font-medium">{pinLabel}</span>
        </div>
      </div>
    </div>
  );
}
