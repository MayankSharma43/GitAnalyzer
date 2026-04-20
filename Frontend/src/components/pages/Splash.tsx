import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import AuditBreakdown from "@/components/landing/AuditBreakdown";
import StatsBar from "@/components/landing/StatsBar";
import FeatureColumns from "@/components/landing/FeatureColumns";
import BrutalTruth from "@/components/landing/BrutalTruth";
import Footer from "@/components/landing/Footer";

export default function Splash() {
  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a]">
      <Navbar />
      <Hero />
      <Marquee />
      <AuditBreakdown />
      <StatsBar />
      <FeatureColumns />
      <BrutalTruth />
      <Footer />
    </div>
  );
}
