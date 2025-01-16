import Hero from '@/components/sections/Hero';
import HowItWorks from '@/components/sections/HowItWorks';
import Benefits from '@/components/sections/Benefits';
import Prizes from '@/components/sections/Prizes';
import Stages from '@/components/sections/Stages';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Benefits />
      <HowItWorks />
      <Prizes />
      <Stages />
      <Contact />
    </main>
  );
}
