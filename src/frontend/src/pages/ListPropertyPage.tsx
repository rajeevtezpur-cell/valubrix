import { useNavigate, useSearch } from "@tanstack/react-router";
import { reverseGeocode } from "../utils/reverseGeocode";

const KNOWN_LOCALITIES_COORDS = [
  { name: "Koramangala", lat: 12.9279, lng: 77.6271 },
  { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { name: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { name: "Electronic City", lat: 12.8458, lng: 77.6668 },
  { name: "Hebbal", lat: 13.0358, lng: 77.597 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
  { name: "HSR Layout", lat: 12.9116, lng: 77.6389 },
  { name: "Marathahalli", lat: 12.9591, lng: 77.6974 },
  { name: "Sarjapur Road", lat: 12.86, lng: 77.786 },
  { name: "Bannerghatta Road", lat: 12.8789, lng: 77.5975 },
  { name: "JP Nagar", lat: 12.9081, lng: 77.585 },
  { name: "Malleswaram", lat: 13.0023, lng: 77.5674 },
  { name: "Rajajinagar", lat: 12.9932, lng: 77.553 },
  { name: "Jayanagar", lat: 12.925, lng: 77.5938 },
  { name: "BTM Layout", lat: 12.9165, lng: 77.6101 },
  { name: "Nagarbhavi", lat: 12.9565, lng: 77.5078 },
  { name: "Vijayanagar", lat: 12.9721, lng: 77.5284 },
  { name: "Shivajinagar", lat: 12.9849, lng: 77.602 },
  { name: "Vasanth Nagar", lat: 12.9955, lng: 77.5937 },
  { name: "Domlur", lat: 12.9605, lng: 77.6373 },
  { name: "Bellandur", lat: 12.9254, lng: 77.6819 },
  { name: "KR Puram", lat: 13.0052, lng: 77.6955 },
  { name: "Thanisandra", lat: 13.063, lng: 77.6185 },
  { name: "Hennur", lat: 13.0455, lng: 77.6395 },
  { name: "Rajankunte", lat: 13.13, lng: 77.6 },
  { name: "Devanahalli", lat: 13.2492, lng: 77.7129 },
  { name: "Kanakapura Road", lat: 12.8481, lng: 77.5753 },
  { name: "Sadashivanagar", lat: 13.0111, lng: 77.5805 },
  { name: "Yeshwanthpur", lat: 13.0237, lng: 77.5479 },
  { name: "Peenya", lat: 13.0294, lng: 77.5224 },
  { name: "RT Nagar", lat: 13.0203, lng: 77.5985 },
  { name: "Banaswadi", lat: 13.0141, lng: 77.6505 },
  { name: "CV Raman Nagar", lat: 12.9888, lng: 77.6602 },
  { name: "Old Airport Road", lat: 12.9603, lng: 77.6497 },
  { name: "Bommanahalli", lat: 12.8938, lng: 77.6351 },
  { name: "Chandapura", lat: 12.8064, lng: 77.7021 },
  { name: "Attibele", lat: 12.772, lng: 77.7663 },
  { name: "Tumkur Road", lat: 13.0633, lng: 77.5124 },
  { name: "Varthur", lat: 12.9399, lng: 77.736 },
  { name: "Kadugodi", lat: 12.9922, lng: 77.7625 },
  { name: "Horamavu", lat: 13.0365, lng: 77.653 },
  { name: "Kalyan Nagar", lat: 13.0253, lng: 77.6417 },
  { name: "HAL", lat: 12.9611, lng: 77.6567 },
  { name: "Frazer Town", lat: 12.9832, lng: 77.6088 },
  { name: "Ulsoor", lat: 12.9795, lng: 77.6208 },
  { name: "MG Road", lat: 12.9756, lng: 77.6099 },
  { name: "Kalkere", lat: 13.0413, lng: 77.6753 },
  { name: "Budigere", lat: 13.1028, lng: 77.7667 },
  { name: "Sarjapur", lat: 12.86, lng: 77.786 },
  { name: "Bannerghatta", lat: 12.8604, lng: 77.5856 },
  { name: "Doddaballapur", lat: 13.296, lng: 77.5376 },
  { name: "Nelamangala", lat: 13.0997, lng: 77.3907 },
  { name: "Hosa Road", lat: 12.861, lng: 77.6821 },
  { name: "Kammanahalli", lat: 13.0124, lng: 77.639 },
];

function nearestLocalityName(lat: number, lng: number): string {
  let best = KNOWN_LOCALITIES_COORDS[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const loc of KNOWN_LOCALITIES_COORDS) {
    const d = Math.sqrt((lat - loc.lat) ** 2 + (lng - loc.lng) ** 2);
    if (d < bestDist) {
      bestDist = d;
      best = loc;
    }
  }
  return best.name;
}

declare global {
  interface Window {
    L: any;
  }
}

function loadLeafletForMap(): Promise<any> {
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

function ListingMapPin({
  coords,
  onChange,
  onDragEnd,
}: {
  coords: [number, number];
  onChange: (c: [number, number]) => void;
  onDragEnd?: (c: [number, number]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initCoordsRef = useRef(coords);
  const onChangeRef = useRef(onChange);
  const onDragEndRef = useRef(onDragEnd);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const L = await loadLeafletForMap();
        if (cancelled || !containerRef.current) return;
        const [initLat, initLng] = initCoordsRef.current;
        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
        }).setView([initLat, initLng], 13);
        mapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 18,
        }).addTo(map);
        const icon = L.divIcon({
          className: "",
          html: '<div style="width:28px;height:28px;background:#D4AF37;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([initLat, initLng], {
          icon,
          draggable: true,
        }).addTo(map);
        markerRef.current = marker;
        marker.on("dragend", (e: any) => {
          const ll = e.target.getLatLng();
          const newCoords: [number, number] = [ll.lat, ll.lng];
          onChangeRef.current(newCoords);
          onDragEndRef.current?.(newCoords);
        });
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          const newCoords: [number, number] = [lat, lng];
          marker.setLatLng(newCoords);
          onChangeRef.current(newCoords);
          onDragEndRef.current?.(newCoords);
        });
        for (const d of [100, 500]) setTimeout(() => map?.invalidateSize(), d);
      } catch {
        // map init failed
      }
    }
    init();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng(coords);
      mapRef.current.setView(coords, mapRef.current.getZoom());
    }
  }, [coords]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import GlobalNav from "../components/GlobalNav";
import SmartLocationSearch from "../components/SmartLocationSearch";
import { useAuth } from "../context/AuthContext";
import type { LocationRecord } from "../data/locationData";
import { formatPrice } from "../data/mockListings";

const STEPS = [
  "Basic Details",
  "Structure",
  "Configuration",
  "Pricing & Media",
  "Review & Publish",
];

type PropertyType = "flat" | "villa" | "plot";
type SellerType = "owner" | "builder" | "agent";

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <p className="text-white/60 text-xs font-medium block mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center hover:border-[#D4AF37] transition-all"
        >
          <Minus size={14} />
        </button>
        <span className="text-white font-bold w-8 text-center font-mono">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center hover:border-[#D4AF37] transition-all"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function PillSelector({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string | string[];
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const isActive = (o: string) =>
    multi
      ? (value as string[])
          .map((v) => v.toLowerCase())
          .includes(o.toLowerCase())
      : (value as string).toLowerCase() === o.toLowerCase();
  const handleClick = (o: string) => {
    if (multi) {
      const arr = value as string[];
      onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]);
    } else {
      onChange(o);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => handleClick(o)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            isActive(o)
              ? "bg-[#D4AF37] text-black border-[#D4AF37]"
              : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const LOCALITY_PRICE_MAP: Record<string, number> = {
  koramangala: 12000,
  indiranagar: 11500,
  whitefield: 8500,
  "hsr layout": 10000,
  jayanagar: 9500,
  "jp nagar": 8500,
  malleshwaram: 9000,
  malleswaram: 9000,
  sadashivanagar: 13000,
  "richmond town": 12000,
  ulsoor: 9500,
  "frazer town": 9000,
  "cunningham road": 14000,
  "lavelle road": 15000,
  "electronic city": 6000,
  sarjapur: 6500,
  marathahalli: 7500,
  "kr puram": 5500,
  hebbal: 7000,
  yelahanka: 5500,
  bannerghatta: 6000,
  "bannerghatta road": 6500,
  "btm layout": 8000,
  bellandur: 7000,
  domlur: 8500,
  "mg road": 11000,
  "kalyan nagar": 6500,
  "rt nagar": 6000,
  nagarbhavi: 5800,
  rajajinagar: 7000,
  "basaveshwara nagar": 7000,
  vijayanagar: 6500,
  banashankari: 7000,
  kanakapura: 5000,
  "kanakapura road": 5500,
  "tumkur road": 5000,
  "hosur road": 5500,
  "old airport road": 7500,
  "cv raman nagar": 6500,
  "rammurthy nagar": 5500,
  thanisandra: 5500,
  hennur: 5800,
  "hennur road": 5500,
  devanahalli: 4500,
  "yelahanka new town": 5000,
  bagalur: 4000,
  rajankunte: 4200,
  doddaballapur: 3800,
  nelamangala: 3500,
  attibele: 3200,
  chandapura: 3500,
  begur: 4500,
  "hosa road": 5500,
  varthur: 5500,
  kadugodi: 5000,
  "manyata tech park": 7500,
  banaswadi: 6000,
  kalkere: 5000,
  peenya: 4500,
  yeshwanthpur: 7000,
  shivajinagar: 9000,
  hal: 8000,
  horamavu: 5800,
  kammanahalli: 6200,
  bommanahalli: 5500,
  budigere: 4000,
};

function computeEstimate(
  locality: string,
  city: string,
  area: number,
): { min: number; max: number } | null {
  if (!area || area <= 0) return null;

  const cityNorm = city.toLowerCase().replace(/bengaluru/g, "bangalore");
  const localityKey = locality.toLowerCase();
  let pricePerSqft = 0;

  for (const [key, price] of Object.entries(LOCALITY_PRICE_MAP)) {
    if (localityKey.includes(key) || key.includes(localityKey)) {
      pricePerSqft = price;
      break;
    }
  }

  if (!pricePerSqft) {
    if (cityNorm.includes("bangalore") || cityNorm.includes("bengaluru"))
      pricePerSqft = 6500;
    else if (cityNorm.includes("mumbai") || cityNorm.includes("bombay"))
      pricePerSqft = 18000;
    else if (cityNorm.includes("pune")) pricePerSqft = 8000;
    else if (
      cityNorm.includes("delhi") ||
      cityNorm.includes("gurgaon") ||
      cityNorm.includes("noida")
    )
      pricePerSqft = 9000;
    else if (cityNorm.includes("hyderabad")) pricePerSqft = 6000;
    else if (cityNorm.includes("chennai")) pricePerSqft = 7000;
    else pricePerSqft = 5500;
  }

  const mid = pricePerSqft * area;
  return { min: Math.round(mid * 0.9), max: Math.round(mid * 1.1) };
}

function computeBadges(form: any): string[] {
  const badges: string[] = [];
  if (form.legalStatus === "A Khata") badges.push("High Liquidity");
  if (form.legalStatus === "Freehold") badges.push("Golden Verified");
  const builder = (form.builderName || "").toLowerCase();
  if (
    ["prestige", "sobha", "brigade"].some((b) => builder.includes(b)) ||
    form.balconies >= 3 ||
    form.facing === "North East" ||
    form.coveredParking >= 3
  ) {
    badges.push("High Value Asset");
  }
  return [...new Set(badges)];
}

export default function ListPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const mediaRef = useRef<HTMLInputElement>(null);

  // Form state
  const [sellerType, setSellerType] = useState<SellerType>("owner");
  const [propertyType, setPropertyType] = useState<PropertyType>("flat");
  // Single unified location state
  const [locationObj, setLocationObj] = useState<{
    name: string;
    city: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [cityState, setCityState] = useState("");
  // Derived for backward-compat with rest of form
  const location = locationObj?.name ?? "";
  const city = (cityState || locationObj?.city) ?? "";
  const pinCoords: [number, number] = locationObj
    ? [locationObj.lat, locationObj.lng]
    : [12.9716, 77.5946];

  const updateLocation = (loc: {
    name: string;
    city: string;
    lat: number;
    lng: number;
  }) => {
    setLocationObj(loc);
    setErrors((prev) => ({ ...prev, location: "" }));
  };
  const [buildingAge, setBuildingAge] = useState("");
  const [totalFloors, setTotalFloors] = useState(5);
  const [floor, setFloor] = useState(1);
  const [carpetArea, setCarpetArea] = useState("");
  const [builtUpArea, setBuiltUpArea] = useState("");
  const [builtUpError, setBuiltUpError] = useState("");
  const [plotArea, setPlotArea] = useState("");
  const [plotUnit, setPlotUnit] = useState("sq ft");
  const [landUse, setLandUse] = useState("");
  const [bhk, setBhk] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [balconies, setBalconies] = useState(1);
  const [coveredParking, setCoveredParking] = useState(1);
  const [openParking, setOpenParking] = useState(0);
  const [facing, setFacing] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [_reraNumber, _setReraNumber] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaDrag, setMediaDrag] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [amenities, setAmenities] = useState<string[]>([]);
  const AMENITY_OPTIONS = [
    "Parking",
    "Lift",
    "Gym",
    "Security",
    "Power Backup",
    "Swimming Pool",
    "Club House",
    "Garden",
    "CCTV",
  ];
  const toggleAmenity = (a: string) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  useEffect(() => {
    if (!user) void navigate({ to: "/auth" });
  }, [user, navigate]);

  const locality = locationObj?.name ?? "";
  const estimate = computeEstimate(locality, city, Number(carpetArea) || 0);
  const priceWarning =
    estimate && listingPrice && Number(listingPrice) > estimate.max * 1.2;
  const badges = computeBadges({
    legalStatus,
    builderName,
    balconies,
    facing,
    coveredParking,
  });

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!sellerType) newErrors.sellerType = "Please select seller type";
      if (!propertyType) newErrors.propertyType = "Please select property type";
      if (!location) newErrors.location = "Please select a location";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return false;
      }
    }
    if (step === 3 && !listingPrice) {
      newErrors.listingPrice = "Please enter the listing price";
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    if (step === 1 && propertyType !== "plot") {
      if (
        Number(builtUpArea) > 0 &&
        Number(builtUpArea) <= Number(carpetArea)
      ) {
        setBuiltUpError("Built-up area must be greater than carpet area.");
        return false;
      }
      setBuiltUpError("");
    }
    if (step === 3 && mediaFiles.length === 0) {
      setMediaError("Please upload at least 1 photo.");
      return false;
    }
    setMediaError("");
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => Math.min(4, s + 1));
  };
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const handleMediaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setMediaDrag(false);
    const files = Array.from(e.dataTransfer.files);
    setMediaFiles((prev) => [...prev, ...files]);
    setMediaError("");
  };

  const handlePublish = async () => {
    if (mediaFiles.length === 0) {
      setMediaError("Please upload at least 1 photo.");
      setStep(3);
      return;
    }
    // Do NOT store images as base64 - causes localStorage quota exceeded
    // Images will show a placeholder; listing always saves successfully
    // Save listing to localStorage
    const priceNum = Number(listingPrice) || 0;
    const newListing = {
      id: `user_${Date.now()}`,
      title: `${bhk ? `${bhk} BHK ` : ""}${propertyType ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1) : "Property"} in ${location || city || "Unknown"}`,
      locality: location || city || "Unknown",
      city: city || location || "Bangalore",
      price:
        priceNum > 0
          ? priceNum >= 10000000
            ? `₹${(priceNum / 10000000).toFixed(2)} Cr`
            : priceNum >= 100000
              ? `₹${(priceNum / 100000).toFixed(0)} L`
              : `₹${priceNum}`
          : "₹0",
      priceRaw: priceNum,
      area: carpetArea ? `${carpetArea} sq ft` : "",
      carpetArea: Number(carpetArea) || 0,
      images: [],
      type: propertyType
        ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
        : "Property",
      status: "Active",
      views: 0,
      saves: 0,
      leads_count: 0,
      visit_count: 0,
      sellerId:
        (user?.mobile || user?.email || user?.username || "").trim() ||
        "unknown",
      sellerName: user?.fullName || user?.username || "Seller",
      bhk: bhk,
      createdAt: Date.now(),
      amenities: amenities,
    };
    try {
      const existing = JSON.parse(
        localStorage.getItem("valubrix_user_listings") || "[]",
      );
      existing.unshift(newListing);
      localStorage.setItem("valubrix_user_listings", JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent("valubrix:listings-updated"));
    } catch (err) {
      console.error("Failed to save listing", err);
      return;
    }
    setPublished(true);
    setTimeout(() => navigate({ to: "/seller/listings" }), 2000);
  };

  if (!user) return null;

  if (published) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F1F] to-[#121B35] flex items-center justify-center">
        <GlobalNav />
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check size={36} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Listing Published!</h2>
          <p className="text-white/50 mt-2">
            Your property is now live on ValuBrix
          </p>
          <p className="text-white/30 text-sm mt-1">
            Redirecting to Seller Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1F] to-[#121B35]">
      <GlobalNav />
      <div className="pt-20 px-4 max-w-5xl mx-auto py-8">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold text-white">
                  List Your Property
                </h1>
                <span className="text-white/40 text-sm">
                  Step {step + 1} / {STEPS.length}
                </span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((step + 1) / STEPS.length) * 100}%`,
                    background:
                      "linear-gradient(90deg, #B8960C, #D4AF37, #F0D060)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[#D4AF37] text-sm font-semibold">
                  {STEPS[step]}
                </p>
                <p className="text-white/30 text-xs">
                  {Math.round(((step + 1) / STEPS.length) * 100)}% complete
                </p>
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
              {/* STEP 0 */}
              {step === 0 && (
                <div data-ocid="listing.wizard.step.1" className="space-y-6">
                  <div>
                    <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                      Seller Type
                    </p>
                    <PillSelector
                      options={["Owner", "Builder", "Agent"]}
                      value={sellerType}
                      onChange={(v: string) => {
                        setSellerType(v.toLowerCase() as SellerType);
                        setErrors((prev) => ({ ...prev, sellerType: "" }));
                      }}
                    />
                    {errors.sellerType && (
                      <p
                        className="text-red-400 text-xs mt-1"
                        data-ocid="listing.seller_type.error_state"
                      >
                        {errors.sellerType}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                      Property Type
                    </p>
                    <PillSelector
                      options={["Flat", "Villa", "Plot"]}
                      value={propertyType}
                      onChange={(v: string) =>
                        setPropertyType(v.toLowerCase() as PropertyType)
                      }
                    />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                      Location
                    </p>
                    <SmartLocationSearch
                      placeholder="Enter city or locality..."
                      onSelect={(loc: LocationRecord) => {
                        const coords = KNOWN_LOCALITIES_COORDS.find(
                          (c) =>
                            c.name.toLowerCase() === loc.name.toLowerCase(),
                        ) ?? { lat: 12.9716, lng: 77.5946 };
                        updateLocation({
                          name: loc.name,
                          city: loc.city,
                          lat: coords.lat,
                          lng: coords.lng,
                        });
                      }}
                      className="w-full"
                    />
                    {errors.location && (
                      <p
                        className="text-red-400 text-xs mt-1"
                        data-ocid="listing.location.error_state"
                      >
                        {errors.location}
                      </p>
                    )}
                    {/* Map Pin Placement */}
                    <div className="mt-4">
                      <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                        Pin Location on Map{" "}
                        <span className="text-white/30 normal-case">
                          (click or drag)
                        </span>
                      </p>
                      <div
                        className="rounded-xl overflow-hidden border border-white/10"
                        style={{ height: 240 }}
                      >
                        <ListingMapPin
                          coords={pinCoords}
                          onChange={() => {}}
                          onDragEnd={(c) => {
                            const cityName =
                              c[0] > 12.7 && c[0] < 13.4
                                ? "Bangalore"
                                : "India";
                            const fallback = nearestLocalityName(c[0], c[1]);
                            updateLocation({
                              name: fallback,
                              city: cityName,
                              lat: c[0],
                              lng: c[1],
                            });
                            reverseGeocode(c[0], c[1]).then((realName) => {
                              if (realName && realName !== "Unknown location") {
                                updateLocation({
                                  name: realName,
                                  city: cityName,
                                  lat: c[0],
                                  lng: c[1],
                                });
                              }
                            });
                          }}
                        />
                      </div>
                      <p className="text-white/40 text-xs mt-1.5">
                        Lat: {pinCoords[0].toFixed(4)}, Lng:{" "}
                        {pinCoords[1].toFixed(4)}
                      </p>
                      {locationObj && (
                        <p className="text-yellow-400/80 text-xs mt-1 flex items-center gap-1">
                          📍 Location set to:{" "}
                          <strong>{locationObj.name}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                      City
                    </p>
                    <PillSelector
                      options={[
                        "Bangalore",
                        "Pune",
                        "Delhi",
                        "Mumbai",
                        "Hyderabad",
                      ]}
                      value={city}
                      onChange={setCityState}
                    />
                  </div>
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <div data-ocid="listing.wizard.step.2" className="space-y-6">
                  {propertyType !== "plot" ? (
                    <>
                      <div>
                        <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                          Year of Construction
                        </p>
                        <PillSelector
                          options={[
                            "0–3 yrs",
                            "3–7 yrs",
                            "7–10 yrs",
                            "10+ yrs",
                          ]}
                          value={buildingAge}
                          onChange={setBuildingAge}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Stepper
                          label="Total Floors"
                          value={totalFloors}
                          onChange={setTotalFloors}
                          min={1}
                        />
                        <Stepper
                          label="Floor of Unit"
                          value={floor}
                          onChange={setFloor}
                          min={0}
                          max={totalFloors}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-white/60 text-xs font-medium block mb-2">
                            Carpet Area (sqft) *
                          </p>
                          <input
                            type="number"
                            placeholder="e.g. 1200"
                            value={carpetArea}
                            onChange={(e) => setCarpetArea(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <p className="text-white/60 text-xs font-medium block mb-2">
                            Super Built-up Area (sqft) *
                          </p>
                          <input
                            type="number"
                            placeholder="e.g. 1450"
                            value={builtUpArea}
                            onChange={(e) => setBuiltUpArea(e.target.value)}
                            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37] ${
                              builtUpError
                                ? "border-red-500"
                                : "border-white/10"
                            }`}
                          />
                          {builtUpError && (
                            <p className="text-red-400 text-xs mt-1">
                              {builtUpError}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-white/60 text-xs font-medium block mb-2">
                          Plot Area *
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Area"
                            value={plotArea}
                            onChange={(e) => setPlotArea(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                          />
                          <select
                            value={plotUnit}
                            onChange={(e) => setPlotUnit(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                          >
                            {["sq ft", "sq yards", "acres", "guntas"].map(
                              (u) => (
                                <option
                                  key={u}
                                  value={u}
                                  className="bg-[#121B35]"
                                >
                                  {u}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                          Land Use Type
                        </p>
                        <PillSelector
                          options={[
                            "Agricultural",
                            "Residential",
                            "Commercial",
                            "Industrial",
                          ]}
                          value={landUse}
                          onChange={setLandUse}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div data-ocid="listing.wizard.step.3" className="space-y-6">
                  {propertyType === "plot" ? (
                    <div className="text-center py-8 text-white/50">
                      <p>No configuration needed for plot listings.</p>
                      <p className="text-sm mt-1">Click Next to continue.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                          BHK
                        </p>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((b) => (
                            <button
                              type="button"
                              key={b}
                              onClick={() => setBhk(b)}
                              className={`w-14 h-12 rounded-xl font-bold border transition-all ${
                                bhk === b
                                  ? "bg-[#D4AF37] text-black border-[#D4AF37] scale-105"
                                  : "bg-white/5 text-white/70 border-white/10"
                              }`}
                            >
                              {b}
                              {b === 4 ? "+" : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Stepper
                          label="Bathrooms"
                          value={bathrooms}
                          onChange={setBathrooms}
                          min={1}
                        />
                        <div>
                          <Stepper
                            label="Balconies"
                            value={balconies}
                            onChange={setBalconies}
                          />
                          {balconies >= 3 && (
                            <p className="text-[#D4AF37] text-xs mt-1 flex items-center gap-1">
                              <Check size={10} /> High Value Asset signal!
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Stepper
                            label="Covered Parking"
                            value={coveredParking}
                            onChange={setCoveredParking}
                          />
                          <p className="text-white/40 text-xs mt-1">
                            ₹3L–₹7L value each
                          </p>
                        </div>
                        <Stepper
                          label="Open Parking"
                          value={openParking}
                          onChange={setOpenParking}
                        />
                      </div>
                      <div>
                        <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                          Unit Facing
                        </p>
                        <PillSelector
                          options={[
                            "North",
                            "East",
                            "South",
                            "West",
                            "North East",
                            "North West",
                            "South East",
                            "South West",
                          ]}
                          value={facing}
                          onChange={setFacing}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div data-ocid="listing.wizard.step.4" className="space-y-6">
                  {/* AI Valuation Preview */}
                  {carpetArea && city && (
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-5">
                      <p className="text-[#D4AF37] text-xs font-medium uppercase tracking-wide mb-1">
                        AI Estimated Market Value
                      </p>
                      {estimate && estimate.min > 0 ? (
                        <p className="text-white font-bold text-2xl font-mono">
                          {formatPrice(estimate.min)} –{" "}
                          {formatPrice(estimate.max)}
                        </p>
                      ) : (
                        <p className="text-white/60 text-sm italic">
                          No market data available for this micro-location
                        </p>
                      )}
                      <p className="text-white/40 text-xs mt-1">
                        Based on {city} market rates • Updates with area changes
                      </p>
                    </div>
                  )}

                  {/* Listing Price */}
                  <div>
                    <p className="text-white/60 text-xs font-medium block mb-2">
                      Your Listing Price (₹)
                    </p>
                    <input
                      type="number"
                      placeholder="Enter your listing price"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                    {priceWarning && (
                      <div className="mt-2 flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                        <AlertTriangle
                          size={14}
                          className="text-orange-400 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-orange-300 text-xs font-medium">
                            Your listing price is above market range.
                          </p>
                          <p className="text-orange-400/70 text-xs">
                            Recommended:{" "}
                            {estimate
                              ? `${formatPrice(estimate.min)} – ${formatPrice(estimate.max)}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Legal Status */}
                  {city === "Bangalore" && (
                    <div>
                      <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                        Legal Status (Bangalore)
                      </p>
                      <PillSelector
                        options={["A Khata", "B Khata"]}
                        value={legalStatus}
                        onChange={setLegalStatus}
                      />
                    </div>
                  )}
                  {city === "Pune" && (
                    <div>
                      <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                        Legal Status (Pune)
                      </p>
                      <PillSelector
                        options={[
                          "MAHARERA Registered",
                          "7/12 Extract Available",
                        ]}
                        value={legalStatus}
                        onChange={setLegalStatus}
                        multi
                      />
                    </div>
                  )}
                  {city === "Delhi" && (
                    <div>
                      <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                        Legal Status (Delhi)
                      </p>
                      <PillSelector
                        options={["Freehold", "Leasehold"]}
                        value={legalStatus}
                        onChange={setLegalStatus}
                      />
                    </div>
                  )}

                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-white/60 text-xs font-medium block mb-2">
                        Builder Name (Optional)
                      </p>
                      <input
                        type="text"
                        placeholder="e.g. Prestige"
                        value={builderName}
                        onChange={(e) => setBuilderName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs font-medium block mb-2">
                        Project Name (Optional)
                      </p>
                      <input
                        type="text"
                        placeholder="e.g. Prestige Sunrise"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                      Amenities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AMENITY_OPTIONS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAmenity(a)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            amenities.includes(a)
                              ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                              : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div>
                    <p className="text-white/60 text-xs font-medium block mb-2 uppercase tracking-wide">
                      Property Photos / Videos *
                    </p>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setMediaDrag(true);
                      }}
                      onDragLeave={() => setMediaDrag(false)}
                      onDrop={handleMediaDrop}
                      onClick={() => mediaRef.current?.click()}
                      onKeyDown={(e) =>
                        e.key === "Enter" && mediaRef.current?.click()
                      }
                      // biome-ignore lint/a11y/useSemanticElements: drag-drop zone
                      role="button"
                      tabIndex={0}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        mediaDrag
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-white/20 hover:border-[#D4AF37]/40"
                      }`}
                    >
                      <Upload
                        size={24}
                        className="mx-auto text-white/40 mb-2"
                      />
                      <p className="text-white/50 text-sm">
                        Drag & drop or click to upload photos
                      </p>
                      <p className="text-white/25 text-xs mt-1">
                        Minimum 1 photo required
                      </p>
                    </div>
                    <input
                      ref={mediaRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setMediaFiles((prev) => [...prev, ...files]);
                        setMediaError("");
                      }}
                    />
                    {mediaError && (
                      <p className="text-red-400 text-xs mt-1">{mediaError}</p>
                    )}
                    {mediaFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {mediaFiles.map((f, i) => (
                          <div
                            key={`media-${i}-${f.name}`}
                            className="relative"
                          >
                            <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-white/40 text-xs overflow-hidden">
                              {f.type.startsWith("image") ? (
                                <img
                                  src={URL.createObjectURL(f)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>Video</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setMediaFiles((prev) =>
                                  prev.filter((_, j) => j !== i),
                                )
                              }
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4 — REVIEW */}
              {step === 4 && (
                <div data-ocid="listing.wizard.step.5" className="space-y-4">
                  <h2 className="text-white font-semibold">
                    Review Your Listing
                  </h2>

                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {badges.map((b) => (
                        <span
                          key={b}
                          className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-xs px-3 py-1 rounded-full font-medium"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Property Type", value: propertyType },
                      {
                        label: "Location",
                        value: `${location || "–"}, ${city || "–"}`,
                      },
                      { label: "Seller Type", value: sellerType },
                      ...(propertyType !== "plot"
                        ? [
                            { label: "BHK", value: `${bhk} BHK` },
                            {
                              label: "Carpet Area",
                              value: `${carpetArea || "–"} sqft`,
                            },
                            {
                              label: "Floor",
                              value: `${floor} / ${totalFloors}`,
                            },
                            { label: "Facing", value: facing || "–" },
                            {
                              label: "Covered Parking",
                              value: String(coveredParking),
                            },
                            { label: "Balconies", value: String(balconies) },
                          ]
                        : [
                            {
                              label: "Plot Area",
                              value: `${plotArea || "–"} ${plotUnit}`,
                            },
                            { label: "Land Use", value: landUse || "–" },
                          ]),
                      { label: "Legal Status", value: legalStatus || "–" },
                      {
                        label: "Listing Price",
                        value: listingPrice
                          ? formatPrice(Number(listingPrice))
                          : "–",
                      },
                      {
                        label: "AI Estimate",
                        value:
                          carpetArea && city && estimate && estimate.min > 0
                            ? `${formatPrice(estimate.min)} – ${formatPrice(estimate.max)}`
                            : carpetArea && city
                              ? "No market data available"
                              : "–",
                      },
                      {
                        label: "Photos",
                        value: `${mediaFiles.length} uploaded`,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="bg-white/5 rounded-xl p-3"
                      >
                        <p className="text-white/40 text-xs">{row.label}</p>
                        <p className="text-white text-sm font-medium mt-0.5 capitalize">
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {builderName && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-white/40 text-xs">Builder</p>
                      <p className="text-white text-sm font-medium mt-0.5">
                        {builderName}
                        {projectName ? ` – ${projectName}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div
              className="flex items-center justify-between mt-6"
              data-ocid="listing.navigation.panel"
            >
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0}
                data-ocid="listing.wizard.secondary_button"
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-all disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  data-ocid="listing.wizard.primary_button"
                  className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold px-6 py-3 rounded-xl transition-all"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  data-ocid="listing.publish.primary_button"
                  onClick={handlePublish}
                  className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold px-8 py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                >
                  <Check size={16} /> Publish Listing
                </button>
              )}
            </div>
          </div>
          {/* end form flex-1 */}

          {/* Live Preview Panel */}
          <div className="hidden md:block w-72 flex-shrink-0 sticky top-24 self-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-4">
                Live Preview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {propertyType === "flat"
                      ? "🏢"
                      : propertyType === "villa"
                        ? "🏡"
                        : "🌳"}
                  </span>
                  <span className="text-white font-medium capitalize">
                    {propertyType || "Property Type"}
                  </span>
                </div>
                {location && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-[10px] uppercase">
                      Location
                    </p>
                    <p className="text-white text-sm font-medium">
                      {location}
                      {city ? `, ${city}` : ""}
                    </p>
                  </div>
                )}
                {listingPrice && (
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-3">
                    <p className="text-white/40 text-[10px] uppercase">Price</p>
                    <p className="text-[#D4AF37] text-lg font-bold">
                      {Number(listingPrice) >= 10000000
                        ? `₹${(Number(listingPrice) / 10000000).toFixed(2)} Cr`
                        : `₹${(Number(listingPrice) / 100000).toFixed(0)} L`}
                    </p>
                  </div>
                )}
                {(bhk > 0 || carpetArea) && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-[10px] uppercase">
                      Details
                    </p>
                    <p className="text-white text-sm">
                      {bhk} BHK{carpetArea ? `, ${carpetArea} sqft` : ""}
                    </p>
                  </div>
                )}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-blue-300 text-[10px] font-medium">
                    🤖 AI Valuation
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    AI valuation will appear after submission
                  </p>
                </div>
                {sellerType && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-[10px] uppercase">
                      Seller
                    </p>
                    <p className="text-white text-sm capitalize">
                      {sellerType}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* end flex gap-6 */}
      </div>
    </div>
  );
}
