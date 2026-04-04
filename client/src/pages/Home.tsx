import { useState, useEffect, useCallback } from 'react';
import HeroSearch from '../components/features/HeroSearch';
import Partners from '../components/features/Partners';
import AllPartsGrid from '../components/features/AllPartsGrid';
import FeaturedProducts from '../components/features/FeaturedProducts';
import { ChevronRight, Play, Pause, ExternalLink } from 'lucide-react';

// 🟢 CONFIGURATION DES BANNIÈRES
// Note : Puisque les images sont dans /public/images/banner/, 
// on utilise des chemins relatifs à la racine du serveur.
const BANNERS = [
  {
    id: 1,
    type: "PROMO",
    title: "ENTRETIEN ET NETTOYAGE",
    subtitle: "Gardez votre véhicule comme neuf avec nos kits premium.",
    cta: "Voir les produits",
    image: "/images/banner/lavage.jpg", 
    color: "bg-blue-600"
  },
  {
    id: 2,
    type: "MARKETPLACE",
    title: "VENEZ VENDRE AVEC NOUS",
    subtitle: "Rejoignez la plus grande communauté de vendeurs auto à Abidjan.",
    cta: "Devenir partenaire",
    image: "/images/banner/produits.jpg",
    color: "bg-red-500"
  },
  {
    id: 3,
    type: "EXCLUSIVITÉ",
    title: "PIÈCES DE FREINAGE",
    subtitle: "Sécurité maximale : -25% sur les disques et plaquettes ce mois-ci.",
    cta: "Découvrir",
    image: "/images/banner/pieces-freinage.jpg",
    color: "bg-green-600"
  }
];

export default function Home() {
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
    <div className="min-h-screen bg-slate-50/50">
      
      {/* 🟢 HERO SECTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          
          {/* GAUCHE : BLOC RECHERCHE */}
          <div className="w-full lg:w-[360px] bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-6 flex flex-col z-20">
            <div className="mb-6 text-center lg:text-left">
               <h2 className="text-xl font-black text-slate-900 tracking-tight">Identifiez votre véhicule</h2>
               <div className="w-10 h-1 bg-blue-600 mt-3 rounded-full mx-auto lg:mx-0"></div>
            </div>
            
            <div className="flex-grow">
              <HeroSearch />
            </div>

            <button className="mt-6 w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-between group hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mes véhicules enregistrés</span>
               <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* DROITE : CARROUSEL PUBLICITAIRE */}
          <div className="flex-1 relative min-h-[300px] sm:min-h-[400px] lg:min-h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900">
            {BANNERS.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Image locale de fond */}
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                
                {/* Overlay sombre pour la lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                {/* Contenu Texte */}
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 sm:px-16 text-white">
                  <span className={`${banner.color} text-[10px] font-bold px-4 py-1.5 rounded-full w-fit mb-4 tracking-widest uppercase shadow-lg`}>
                    {banner.type}
                  </span>
                  
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight max-w-2xl drop-shadow-md">
                    {banner.title}
                  </h2>
                  
                  <p className="text-slate-100 text-sm sm:text-lg opacity-90 mb-8 max-w-lg font-medium line-clamp-2">
                    {banner.subtitle}
                  </p>
                  
                  <button className="flex items-center gap-2 w-fit bg-white text-slate-900 px-8 py-4 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95">
                    {banner.cta}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination style Points */}
            <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-6">
                <button 
                  onClick={() => setIsPaused(!isPaused)} 
                  className="text-white/50 hover:text-white transition-colors"
                  aria-label={isPaused ? "Démarrer" : "Pause"}
                >
                  {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                </button>
                <div className="flex gap-2.5">
                  {BANNERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentSlide(i); setIsPaused(true); }}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i === currentSlide ? 'bg-white w-12 shadow-md' : 'bg-white/30 w-2.5 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
            </div>
          </div>

        </div>
      </section>

      {/* Reste des sections */}
      <Partners />
      <AllPartsGrid />
      <FeaturedProducts />

    </div>
  );
}