import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ExamplesSection } from '@/components/landing/ExamplesSection';
import { FounderStorySection } from '@/components/landing/FounderStorySection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { WaitlistSection } from '@/components/landing/WaitlistSection';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <ExamplesSection />
        <FounderStorySection />
        <HowItWorks />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  );
}
