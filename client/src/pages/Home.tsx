import { useState, useEffect } from 'react';
import HeroSection from '../components/features/HeroSection';
import Partners from '../components/features/Partners';
import AllPartsGrid from '../components/features/AllPartsGrid';
import FeaturedProducts from '../components/features/FeaturedProducts';
import WhyChooseUs from '../components/features/WhyChooseUs';
import FeaturedStores from '../components/features/FeaturedStores';
import BoostedProducts from '../components/features/BoostedProducts';
import PromoPage from '../components/features/PromoPage';
import BuyerStepsPopup from '../components/modals/BuyerStepsPopup';

export default function Home() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [wiggle, setWiggle] = useState(false);

  // ÉDUCATION AUTOMATIQUE
  useEffect(() => {
    const timer = setTimeout(() => setIsPopupOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Montre le tooltip 2s après fermeture
  useEffect(() => {
    if (!isPopupOpen) {
      const t1 = setTimeout(() => setShowTooltip(true), 2000);
      const t2 = setTimeout(() => setShowTooltip(false), 7000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isPopupOpen]);

  // Wiggle toutes les 8s pour rappeler
  useEffect(() => {
    const interval = setInterval(() => {
      setWiggle(true);
      setTimeout(() => setWiggle(false), 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 relative">
      <HeroSection />
      <BoostedProducts />
      <FeaturedProducts />
      <PromoPage />
      <FeaturedStores />
      <AllPartsGrid />
      <WhyChooseUs />
      <Partners />

      {/* BOUTON ÉDUCATIF */}
      <div className="fixed bottom-6 left-6 z-40">
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute -top-12 left-0 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap animate-fade-in">
             Première visite? Clique ici
            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        )}

        <button
          onClick={() => {
            setIsPopupOpen(true);
            setShowTooltip(false);
          }}
          className={`
            relative flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-amber-500
            hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold
            py-3.5 px-6 rounded-full shadow-[0_8px_25px_rgba(249,115,22,0.45)]
            transition-all duration-300 hover:scale-105 active:scale-95
            group overflow-hidden isolate
            ${wiggle? 'animate-bounce' : ''}
          `}
        >
          {/* Halo pulse derrière */}
          <span className="absolute inset-0 -z-10">
            <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>
          </span>

          {/* Shimmer */}
          <span className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></span>

          <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>

          <span>Comment ça marche?</span>

          {/* Badge éducatif */}
          <span className="ml-1 bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Guide</span>
        </button>
      </div>

      <BuyerStepsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
}