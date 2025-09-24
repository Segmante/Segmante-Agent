import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { QuickStartSection } from '@/components/quick-start-section';

export default function Home() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturesSection />
      <QuickStartSection />
    </div>
  );
}