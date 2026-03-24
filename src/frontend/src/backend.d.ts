import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface DealScoreResponse {
    fairValue: bigint;
    expectedDaysToSell: bigint;
    demandScore: bigint;
    liquidityScore: bigint;
    dealTag: string;
    priceGap: bigint;
    dealScore: bigint;
}
export interface PropertyListing {
    id: bigint;
    bhk: bigint;
    floor: bigint;
    status: ListingStatus;
    totalFloors: bigint;
    title: string;
    projectName: string;
    propertyType: PropertyType;
    city: string;
    createdAt: Time;
    badges: Array<string>;
    carpetArea: bigint;
    builderName: string;
    builtUpArea: bigint;
    description: string;
    openParking: bigint;
    legalStatus: string;
    mediaBlobs: Array<ExternalBlob>;
    coveredParking: bigint;
    buildingAge: bigint;
    sellerId: Principal;
    balconies: bigint;
    price: bigint;
    facing: string;
    location: string;
    plotArea: bigint;
    reraNumber: string;
    landUse: string;
    plotUnit: string;
}
export interface ValuationResponse {
    breakdown: ValuationBreakdown;
    confidenceReason: string;
    bestPrice: bigint;
    priceMax: bigint;
    priceMin: bigint;
    confidence: bigint;
    localityFound: boolean;
}
export interface Enquiry {
    id: bigint;
    projectName: string;
    name: string;
    createdAt: Time;
    projectId: string;
    phone: string;
}
export interface ValuationBreakdown {
    comparablesUsed: bigint;
    pricePerSqft: bigint;
    infraContribution: bigint;
    locationContribution: bigint;
    demandContribution: bigint;
    comparablesContribution: bigint;
}
export interface ForecastResponse {
    conservative: bigint;
    aggressive: bigint;
    realistic: bigint;
    disclaimer: string;
    basePrice: bigint;
    growthRate: bigint;
}
export interface RentalResponse {
    avgRentPerSqft: bigint;
    yieldPercent: bigint;
    avgRent: bigint;
    rentMax: bigint;
    rentMin: bigint;
    rentalConfidence: bigint;
    vacancyRate: bigint;
}
export interface ValuationReport {
    id: bigint;
    propertyType: PropertyType;
    userId: Principal;
    createdAt: Time;
    estimatedMax: bigint;
    estimatedMin: bigint;
    confidence: bigint;
    location: string;
}
export interface LocalityIntelligence {
    amenitiesScore: bigint;
    city: string;
    name: string;
    avgPricePerSqft: bigint;
    demandScore: bigint;
    infraScore: bigint;
    locationScore: bigint;
    rentalPerSqft: bigint;
    growthRate: bigint;
    supplyDensity: bigint;
}
export interface UserProfile {
    username: string;
    city: string;
    role: UserRole;
    fullName: string;
    email: string;
    panNumber: string;
    mobile: string;
}
export enum ListingStatus {
    published = "published",
    draft = "draft"
}
export enum PropertyType {
    villa = "villa",
    flat = "flat",
    plot = "plot"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addValuationReport(location: string, propertyType: PropertyType, estimatedMin: bigint, estimatedMax: bigint, confidence: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    computeValuation(locality: string, propertyType: string, sqft: bigint, age: bigint, amenitiesCount: bigint): Promise<ValuationResponse>;
    createEnquiry(projectId: string, projectName: string, name: string, phone: string): Promise<bigint>;
    createListing(title: string, propertyType: PropertyType, location: string, city: string, price: bigint, carpetArea: bigint, builtUpArea: bigint, bhk: bigint, floor: bigint, totalFloors: bigint, buildingAge: bigint, facing: string, coveredParking: bigint, openParking: bigint, balconies: bigint, builderName: string, projectName: string, reraNumber: string, legalStatus: string, landUse: string, plotArea: bigint, plotUnit: string, badges: Array<string>, mediaBlobs: Array<ExternalBlob>, description: string): Promise<bigint>;
    deleteListing(listingId: bigint): Promise<void>;
    filterListings(propertyType: PropertyType, minPrice: bigint, maxPrice: bigint, bhk: bigint): Promise<Array<PropertyListing>>;
    getAllPublishedListings(): Promise<Array<PropertyListing>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDealScore(listingId: bigint): Promise<DealScoreResponse>;
    getEnquiries(): Promise<Array<Enquiry>>;
    getFeedbackCount(): Promise<bigint>;
    getForecast(locality: string, propertyType: string): Promise<ForecastResponse>;
    getListingById(listingId: bigint): Promise<PropertyListing | null>;
    getListingsBySeller(sellerId: Principal): Promise<Array<PropertyListing>>;
    getLocalityIntelligence(locality: string): Promise<LocalityIntelligence | null>;
    getLocalityList(): Promise<Array<string>>;
    getRentalIntelligence(locality: string): Promise<RentalResponse>;
    getSavedProperties(): Promise<Array<PropertyListing>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getValuationReportsForUser(userId: Principal): Promise<Array<ValuationReport>>;
    isCallerAdmin(): Promise<boolean>;
    isIntelligenceSeeded(): Promise<boolean>;
    publishListing(listingId: bigint): Promise<void>;
    registerUser(username: string, fullName: string, mobile: string, email: string, city: string, panNumber: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveProperty(listingId: bigint): Promise<void>;
    searchListings(location: string): Promise<Array<PropertyListing>>;
    searchLocalities(searchQuery: string): Promise<Array<string>>;
    seedIntelligenceData(): Promise<void>;
    trackFeedback(listingId: bigint, eventType: string): Promise<void>;
    unsaveProperty(listingId: bigint): Promise<void>;
    updateListing(listingId: bigint, title: string, propertyType: PropertyType, location: string, city: string, price: bigint, carpetArea: bigint, builtUpArea: bigint, bhk: bigint, floor: bigint, totalFloors: bigint, buildingAge: bigint, facing: string, coveredParking: bigint, openParking: bigint, balconies: bigint, builderName: string, projectName: string, reraNumber: string, legalStatus: string, landUse: string, plotArea: bigint, plotUnit: string, badges: Array<string>, mediaBlobs: Array<ExternalBlob>, description: string): Promise<void>;
    updateUserRole(user: Principal, role: UserRole): Promise<void>;
}
