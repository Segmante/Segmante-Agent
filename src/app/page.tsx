import { SuperMemoryHero } from '@/components/supermemory-hero';
import { UsageTimeline } from '@/components/usage-timeline';

export default function Home() {
  return (
    <div className="space-y-0">
      <SuperMemoryHero />
      <UsageTimeline />
    </div>
  );
}