'use client';

import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import PowerFeatures from '@/components/PowerFeatures';
import DashboardTeaser from '@/components/DashboardTeaser';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Marquee />
      <PowerFeatures />
      <DashboardTeaser />
    </main>
  );
}
