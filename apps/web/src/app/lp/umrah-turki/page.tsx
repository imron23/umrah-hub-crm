import { Suspense } from 'react';
import LandingPage from "@/components/marketing/LandingPage";

export default function UmrahTurkiLP() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <LandingPage 
        slug="lp_umrah_turki"
        title="Umrah Plus Turki Spiritual"
        subtitle="The ultimate journey: Visit the Blue Mosque in Istanbul before performing Umrah in the Holy Land. A perfect blend of history and spirituality."
        bgImage="/images/umrah_turki_hero.png"
      />
    </Suspense>
  );
}
