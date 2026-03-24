// @ts-nocheck
// Uses Leaflet via CDN (loaded dynamically), not npm import
import { useEffect, useRef } from "react";
import type { ScoredProject } from "../engines/projectIntelligenceEngine";

function getTagColor(tag: string): string {
  switch (tag) {
    case "Luxury":
      return "#D4AF37";
    case "Premium":
      return "#a855f7";
    case "Best Value":
      return "#10b981";
    case "Budget Pick":
      return "#3b82f6";
    default:
      return "#6b7280";
  }
}

function formatPrice(rupees: number): string {
  const cr = rupees / 10_000_000;
  if (cr >= 1) return `\u20b9${cr.toFixed(2)}Cr`;
  return `\u20b9${(rupees / 100_000).toFixed(0)}L`;
}

interface MapViewProps {
  projects: ScoredProject[];
  onSelect: (p: ScoredProject) => void;
}

function loadLeaflet(): Promise<void> {
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
      // script tag exists but may not be loaded yet
      const check = () => {
        if (window.L) resolve();
        else setTimeout(check, 50);
      };
      check();
    }
  });
}

export default function MapView({ projects, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const validProjects = projects.filter(
    (p) =>
      p.latitude &&
      p.longitude &&
      !Number.isNaN(p.latitude) &&
      !Number.isNaN(p.longitude) &&
      p.latitude !== 0 &&
      p.longitude !== 0,
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadLeaflet().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = window.L;
      L.Icon.Default.prototype._getIconUrl = undefined;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const leafletMap = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([13.0827, 77.5877], 11);
      mapRef.current = leafletMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(leafletMap);

      for (const d of [100, 300, 600, 1200])
        setTimeout(() => leafletMap.invalidateSize(), d);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    const leafletMap = mapRef.current;
    if (!leafletMap || !window.L) return;
    const L = window.L;

    for (const m of markersRef.current) leafletMap.removeLayer(m);
    markersRef.current = [];

    for (const project of validProjects) {
      const color = getTagColor(project.score?.tag ?? "");
      const icon = L.divIcon({
        className: "",
        html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.917 14 24 14 24S28 23.917 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.9"/></svg>`,
        iconSize: [28, 38],
        iconAnchor: [14, 38],
        popupAnchor: [0, -40],
      });

      const m = L.marker([project.latitude, project.longitude], { icon });
      const popupContent = document.createElement("div");
      popupContent.style.cssText = "min-width:180px;font-family:sans-serif;";
      popupContent.innerHTML = `
        <div style="font-weight:700;font-size:13px;margin-bottom:2px">${project.name}</div>
        <div style="font-size:11px;color:#666;margin-bottom:2px">${project.builder}</div>
        <div style="font-size:11px;color:#888;margin-bottom:4px">${project.locality}</div>
        <div style="font-size:12px;font-weight:600;color:#B8860B;margin-bottom:6px">${formatPrice(project.price_min)} &ndash; ${formatPrice(project.price_max)}</div>
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <span style="background:#1a2b3c;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px">Score: ${project.score?.investmentScore ?? "\u2013"}</span>
          <span style="background:${color}22;color:${color};border:1px solid ${color}66;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600">${project.score?.tag ?? ""}</span>
        </div>
      `;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "View Details";
      btn.style.cssText =
        "width:100%;background:#1a3a5c;color:#fff;border:none;border-radius:8px;padding:6px 0;font-size:11px;cursor:pointer;font-weight:600";
      btn.onclick = () => onSelectRef.current(project);
      popupContent.appendChild(btn);

      m.bindPopup(L.popup({ maxWidth: 240 }).setContent(popupContent));
      m.addTo(leafletMap);
      markersRef.current.push(m);
    }
  }, [validProjects]);

  return (
    <div
      className="relative w-full rounded-2xl border border-white/10 overflow-hidden"
      style={{ height: "100%", minHeight: "500px" }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
      />

      <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-1.5 pointer-events-none">
        {(["Luxury", "Premium", "Best Value", "Budget Pick"] as const).map(
          (tag) => (
            <div
              key={tag}
              className="flex items-center gap-1.5 bg-[#0D1B2A]/90 rounded-lg px-2 py-1 border border-white/10"
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: getTagColor(tag) }}
              />
              <span className="text-white/80 text-[10px] whitespace-nowrap">
                {tag}
              </span>
            </div>
          ),
        )}
      </div>

      <div className="absolute top-3 right-3 z-[1000] bg-[#0D1B2A]/90 border border-white/10 rounded-lg px-3 py-1.5 pointer-events-none">
        <span className="text-white/70 text-xs">
          {validProjects.length} projects
        </span>
      </div>
    </div>
  );
}
