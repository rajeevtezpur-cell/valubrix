import { getActiveListingsForBuyer } from "../services/listingService";
export interface MockListing {
  id: string;
  title: string;
  propertyType: "flat" | "villa" | "plot";
  price: number;
  carpetArea: number;
  builtUpArea?: number;
  bhk?: number;
  floor?: number;
  totalFloors?: number;
  location: string;
  city: string;
  facing?: string;
  coveredParking?: number;
  balconies?: number;
  badges: string[];
  images: string[];
  builderName?: string;
  legalStatus?: string;
  landUse?: string;
  plotArea?: number;
  amenities?: string[];
  description?: string;
  // AI Intelligence fields
  dealScore?: number; // 0–100
  dealClassification?: string; // "Strong Buy" | "Good Deal" | "Fair Price" | "Overpriced"
  investmentScore?: number; // 0–100
  aiRecommendation?: string; // "Strong Buy" | "Buy" | "Hold" | "Avoid"
  sellerId?: string;
  status?: string;
}

export const MOCK_LISTINGS: MockListing[] = [
  {
    id: "1",
    title: "3 BHK Luxury Apartment in Indiranagar",
    propertyType: "flat",
    price: 14500000,
    carpetArea: 1450,
    builtUpArea: 1720,
    bhk: 3,
    floor: 8,
    totalFloors: 14,
    location: "Indiranagar",
    city: "Bangalore",
    facing: "North East",
    coveredParking: 2,
    balconies: 3,
    badges: ["High Value Asset", "Golden Verified"],
    builderName: "Prestige",
    legalStatus: "A Khata",
    amenities: [
      "Clubhouse",
      "Swimming Pool",
      "Gym",
      "Power Backup",
      "24/7 Security",
    ],
    description:
      "Premium 3 BHK apartment in the heart of Indiranagar with modern amenities.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    dealScore: 72,
    dealClassification: "Good Deal",
    investmentScore: 84,
    aiRecommendation: "Buy",
  },
  {
    id: "2",
    title: "2 BHK Apartment in Koramangala",
    propertyType: "flat",
    price: 9200000,
    carpetArea: 1080,
    builtUpArea: 1280,
    bhk: 2,
    floor: 4,
    totalFloors: 10,
    location: "Koramangala",
    city: "Bangalore",
    facing: "East",
    coveredParking: 1,
    balconies: 2,
    badges: ["High Liquidity"],
    legalStatus: "A Khata",
    amenities: ["Gym", "Parking", "Power Backup"],
    description: "Well-connected 2 BHK in prime Koramangala location.",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    ],
    dealScore: 55,
    dealClassification: "Fair Price",
    investmentScore: 78,
    aiRecommendation: "Hold",
  },
  {
    id: "3",
    title: "4 BHK Villa in Whitefield",
    propertyType: "villa",
    price: 28000000,
    carpetArea: 3200,
    builtUpArea: 3800,
    bhk: 4,
    floor: 1,
    totalFloors: 2,
    location: "Whitefield",
    city: "Bangalore",
    facing: "North East",
    coveredParking: 3,
    balconies: 4,
    badges: ["High Value Asset", "Golden Verified"],
    builderName: "Sobha",
    legalStatus: "A Khata",
    amenities: ["Clubhouse", "Infinity Pool", "Gym", "Garden", "24/7 Security"],
    description: "Luxurious 4 BHK villa in a gated community by Sobha.",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    ],
    dealScore: 81,
    dealClassification: "Strong Buy",
    investmentScore: 91,
    aiRecommendation: "Strong Buy",
  },
  {
    id: "4",
    title: "3 BHK Apartment in Hebbal",
    propertyType: "flat",
    price: 8500000,
    carpetArea: 1250,
    builtUpArea: 1480,
    bhk: 3,
    floor: 6,
    totalFloors: 12,
    location: "Hebbal",
    city: "Bangalore",
    facing: "West",
    coveredParking: 1,
    balconies: 2,
    badges: ["High Liquidity"],
    legalStatus: "A Khata",
    amenities: ["Gym", "Parking", "Power Backup", "Clubhouse"],
    description: "Spacious 3 BHK with lake views in upcoming Hebbal zone.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800",
    ],
    dealScore: 68,
    dealClassification: "Good Deal",
    investmentScore: 82,
    aiRecommendation: "Buy",
  },
  {
    id: "5",
    title: "2 BHK Flat in Baner",
    propertyType: "flat",
    price: 7800000,
    carpetArea: 980,
    builtUpArea: 1150,
    bhk: 2,
    floor: 3,
    totalFloors: 8,
    location: "Baner",
    city: "Pune",
    facing: "East",
    coveredParking: 1,
    balconies: 1,
    badges: ["Golden Verified"],
    legalStatus: "MAHARERA Registered",
    amenities: ["Gym", "Parking", "24/7 Security"],
    description: "Modern 2 BHK flat in IT hub Baner, Pune.",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800",
    ],
    dealScore: 42,
    dealClassification: "Fair Price",
    investmentScore: 70,
    aiRecommendation: "Hold",
  },
  {
    id: "6",
    title: "3 BHK Premium in Koregaon Park",
    propertyType: "flat",
    price: 18500000,
    carpetArea: 1800,
    builtUpArea: 2100,
    bhk: 3,
    floor: 10,
    totalFloors: 18,
    location: "Koregaon Park",
    city: "Pune",
    facing: "North East",
    coveredParking: 2,
    balconies: 3,
    badges: ["High Value Asset", "Golden Verified"],
    builderName: "Panchshil",
    legalStatus: "MAHARERA Registered",
    amenities: [
      "Clubhouse",
      "Infinity Pool",
      "Gym",
      "Concierge",
      "24/7 Security",
    ],
    description: "Ultra-premium 3 BHK in Koregaon Park by Panchshil Realty.",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
    ],
    dealScore: 31,
    dealClassification: "Overpriced",
    investmentScore: 62,
    aiRecommendation: "Avoid",
  },
  {
    id: "7",
    title: "Residential Plot in Dwarka",
    propertyType: "plot",
    price: 9500000,
    carpetArea: 0,
    location: "Dwarka",
    city: "Delhi",
    badges: ["Golden Verified"],
    legalStatus: "Freehold",
    landUse: "Residential",
    plotArea: 500,
    description: "Prime freehold residential plot in Sector 12, Dwarka.",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
    ],
    dealScore: 61,
    dealClassification: "Good Deal",
    investmentScore: 75,
    aiRecommendation: "Buy",
  },
  {
    id: "8",
    title: "NA Plot in South Delhi",
    propertyType: "plot",
    price: 22000000,
    carpetArea: 0,
    location: "South Delhi",
    city: "Delhi",
    badges: ["High Value Asset", "Golden Verified"],
    legalStatus: "Freehold",
    landUse: "Residential",
    plotArea: 800,
    description: "Premium NA converted plot in South Delhi with road frontage.",
    images: [
      "https://images.unsplash.com/photo-1448630360428-65456885c650?w=800",
    ],
    dealScore: 36,
    dealClassification: "Overpriced",
    investmentScore: 65,
    aiRecommendation: "Hold",
  },
];

export function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export function getAllListings(): MockListing[] {
  try {
    const userListings = getActiveListingsForBuyer();
    return userListings.map((ul: any) => ({
      id: ul.id,
      title: ul.title,
      propertyType: (ul.type?.toLowerCase() === "villa"
        ? "villa"
        : ul.type?.toLowerCase() === "plot"
          ? "plot"
          : "flat") as "flat" | "villa" | "plot",
      price: ul.priceRaw || 0,
      location: ul.locality || ul.location || ul.city || "",
      city: ul.city || ul.locality?.split(",").pop()?.trim() || "",
      bhk: ul.bhk,
      badges: ["New Listing"],
      images:
        Array.isArray(ul.images) && ul.images.length > 0
          ? ul.images
          : ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"],
      dealScore: 60,
      dealClassification: "Fair Price" as const,
      investmentScore: 65,
      aiRecommendation: "Buy" as const,
      amenities: Array.isArray(ul.amenities) ? ul.amenities : [],
      carpetArea: ul.carpetArea
        ? Number(ul.carpetArea) || 0
        : ul.area
          ? Number.parseInt(String(ul.area)) || 0
          : 0,
      builderName: ul.builderName || ul.builder || undefined,
      sellerId: ul.sellerId,
      status: ul.status,
    }));
  } catch {
    return [];
  }
}
