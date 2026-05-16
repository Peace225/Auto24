import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, ExternalLink } from 'lucide-react';
import HeroSearch from './HeroSearch';

const BANNERS = [
  {
    id: 1,
    type: "BIENVENUE",
    title: "VOS PIÈCES AUTO EN UN CLIC",
    subtitle: "Fiabilité certifiée – Livraison partout à Abidjan",
    cta: "Catalogue",
    image: "/images/banner/main-hero.jpg", 
    color: "bg-blue-700"
  },
  {
    id: 2,
    type: "PROMO",
    title: "KIT ENTRETIEN PREMIUM",
    subtitle: "Gardez votre moteur comme neuf.",
    cta: "Découvrir",
    image: "/images/banner/lavage.jpg", 
    color: "bg-blue-600"
  },
  {
    id: 3,
    type: "MARKETPLACE",
    title: "VENDRE VOS PIÈCES",
    subtitle: "Rejoignez nos vendeurs partenaires dès aujourd'hui.",
    cta: "Vendre",
    image: "/images/banner/produits.jpg",
    color: "bg-red-500"
  }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === BANNERS.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      {/* flex-col-reverse gère l'inversion sur mobile */}
      <div className="flex flex-col-reverse lg:flex-row gap-4 items-stretch">
        
        {/* 🔍 BLOC RECHERCHE RECTANGLE VERTICAL */}
        {/* Correction : z-index abaissé à lg:z-20 pour ne pas écraser le carrousel sur mobile */}
        <div className="w-full lg:w-[300px] bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-col z-10 lg:z-20">
          <div className="mb-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Trouver une pièce</h2>
              <div className="w-8 h-0.5 bg-blue-600 mt-1"></div>
          </div>
          <HeroSearch />
        </div>

        {/* 🎡 CARROUSEL */}
        {/* Correction : Changement de h-[180px] à min-h-[200px] pour éviter que le bloc ne s'écrase sur petit écran */}
        <div className="flex-1 relative min-h-[200px] sm:h-[220px] lg:h-[280px] w-full rounded-xl overflow-hidden bg-slate-900 shadow-sm border border-slate-100 z-20 lg:z-10">
          {BANNERS.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Image avec arrière-plan de secours (si l'image n'est pas trouvée) */}
              <div className="absolute inset-0 bg-slate-800" />
              <img 
                src={banner.image} 
                alt={banner.title} 
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={(e) => {
                  // Optionnel : remplace par un placeholder si l'image locale crache
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Overlay dégradé */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 z-10" />

              {/* Contenu textuel */}
              <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12 text-white">
                <span className={`${banner.color} text-[8px] font-black px-2 py-0.5 rounded w-fit mb-2 tracking-widest uppercase`}>
                  {banner.type}
                </span>
                
                <h2 className="text-base md:text-2xl lg:text-3xl font-black mb-1 leading-tight max-w-sm lg:max-w-md uppercase">
                  {banner.title}
                </h2>
                
                <p className="text-slate-200 text-[10px] md:text-xs opacity-90 mb-4 max-w-xs font-medium hidden sm:block">
                  {banner.subtitle}
                </p>
                
                <button className="flex items-center gap-2 w-fit bg-white text-slate-900 px-4 py-1.5 rounded-md font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 group">
                  {banner.cta}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="absolute bottom-3 right-6 z-30 flex items-center gap-3 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <button 
                onClick={() => setIsPaused(!isPaused)} 
                className="text-white/60 hover:text-white transition-colors"
              >
                {isPaused ? <Play size={10} className="fill-current" /> : <Pause size={10} className="fill-current" />}
              </button>
              
              <div className="flex gap-1">
                {BANNERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentSlide(i); setIsPaused(true); }}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === currentSlide ? 'bg-white w-4' : 'bg-white/20 w-1'
                    }`}
                  />
                ))}
              </div>
          </div>
        </div>

      </div>
    </section>
  );
}