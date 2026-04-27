import { Hero } from "@/components/sections/Hero";
import { TrustStats } from "@/components/sections/TrustStats";
import { WhyFaithway } from "@/components/sections/WhyFaithway";
import { ServicesShowcase } from "@/components/sections/ServicesShowcase";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { Destinations } from "@/components/sections/Destinations";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTASection } from "@/components/sections/CTASection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStats />
      <WhyFaithway />
      <ServicesShowcase />
      <ProcessTimeline />
      <Destinations />
      <Testimonials />
      <CTASection />
      <ContactSection />
    </>
  );
}
