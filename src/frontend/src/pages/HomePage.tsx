import BookAppointment from "../components/BookAppointment";
import FeatureCards from "../components/FeatureCards";
import Footer from "../components/Footer";
import GuestLimitModal from "../components/GuestLimitModal";
import HeroSection from "../components/HeroSection";
import MissionVision from "../components/MissionVision";
import Navbar from "../components/Navbar";
import OurPromise from "../components/OurPromise";
import PortalEntryCards from "../components/PortalEntryCards";
import PriceForecastPreview from "../components/PriceForecastPreview";
import PropertyIntelligencePanel from "../components/PropertyIntelligencePanel";
import RecentlyListed from "../components/RecentlyListed";
import ServiceFeatureCards from "../components/ServiceFeatureCards";
import StageJourney from "../components/StageJourney";
import StatsCounter from "../components/StatsCounter";
import TrustCard from "../components/TrustCard";
import WhyValuBrix from "../components/WhyValuBrix";
import { useGuestLimit } from "../hooks/useGuestLimit";

export default function HomePage() {
  const { checkUsage, isLimitReached, dismissLimit } = useGuestLimit();
  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh" }}>
      <Navbar />
      <main>
        <HeroSection onSearch={checkUsage} />
        <StatsCounter />
        <MissionVision />
        <WhyValuBrix />
        <FeatureCards />
        <TrustCard />
        <OurPromise />
        <PortalEntryCards />
        <PriceForecastPreview />
        <ServiceFeatureCards />
        <PropertyIntelligencePanel />
        <StageJourney />
        <RecentlyListed />
        <BookAppointment />
      </main>
      <Footer />
      <GuestLimitModal isOpen={isLimitReached} onClose={dismissLimit} />
    </div>
  );
}
