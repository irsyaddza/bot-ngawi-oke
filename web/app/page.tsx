import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import CommandList from '@/components/CommandList';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Marquee />
      <CommandList />
    </main>
  );
}
