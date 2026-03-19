import { Suspense } from 'react';
import LandingPage from "@/components/marketing/LandingPage";

export default function UmrahPromoLP() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <LandingPage 
        slug="lp_umrah_promo"
        title="Umrah Exclusive 2026 Promo"
        subtitle="Experience the divine journey with premium five-star accommodation and direct flights. Limited slots available for Ramadhan and Syawal sessions."
        bgImage="/images/umrah_promo_hero.png"
      />
    </Suspense>
  );
}
