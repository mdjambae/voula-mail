import { Hero } from '../components/landing/Hero';
import { Stats } from '../components/landing/Stats';
import { Features } from '../components/landing/Features';
import { SecuritySection } from '../components/landing/SecuritySection';
import { FAQ } from '../components/landing/FAQ';
import { CTA } from '../components/landing/CTA';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <SecuritySection />
      <FAQ />
      <CTA />
    </>
  );
}
