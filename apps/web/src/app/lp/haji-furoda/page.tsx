import { Suspense } from 'react';
import LandingPage from "@/components/marketing/LandingPage";

export default function HajiFurodaLP() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <LandingPage 
        slug="lp_haji_furoda"
        title="Haji Furoda Platinum Edition"
        subtitle="Direct entrance to Hajj without the long wait. Exclusive VIP service including premium tents in Mina and five-star Makkah hotels."
        bgImage="/images/haji_furoda_hero.png"
      />
    </Suspense>
  );
}
