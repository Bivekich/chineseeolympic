import Hero from '@/components/sections/Hero';
import HowItWorks from '@/components/sections/HowItWorks';
import Benefits from '@/components/sections/Benefits';
import Prizes from '@/components/sections/Prizes';
import SeasonalOlympiads from '@/components/SeasonalOlympiads';
import Contact from '@/components/sections/Contact';
import { dfn } from 'framer-motion/client';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Benefits />
      <HowItWorks />
      <Prizes />
      <SeasonalOlympiads />
      <Contact />
    </main>
  );
}
