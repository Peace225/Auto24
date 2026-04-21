import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Play, Pause, ExternalLink, MapPin } from 'lucide-react';
import HeroSearch from './HeroSearch';

// 🟢 CONFIGURATION DES BANNIÈRES MISE À JOUR
const BANNERS = [
  {
    id: 1,
    type: "BIENVENUE",
    title: "ACHETEZ ET VENDEZ VOS PIÈCES AUTOMOBILES EN TOUTE CONFIANCE",
    subtitle: "Pièces fiables – Livraison rapide – Vendeurs vérifiés",
    cta: "Explorer le catalogue",
    image: "/images/banner/main-hero.jpg", // Assure-toi d'avoir cette image ou change le nom
    color: "bg-blue-700"
  },
  {
    id: 2,
    type: "PROMO",
    title: "ENTRETIEN ET NETTOYAGE",
    subtitle: "Gardez votre véhicule comme neuf avec nos kits premium.",
    cta: "Voir les produits",
    image: "/images/banner/lavage.jpg", 
    color: "bg-blue-600"
  },
  {
    id: 3,
    type: "MARKETPLACE",
    title: "VENEZ VENDRE AVEC NOUS",
    subtitle: "Rejoignez la plus grande communauté de vendeurs auto à Abidjan.",
    cta: "Devenir partenaire",
    image: "/images/banner/produits.jpg",
    color: "bg-red-500"
  },
  {
    id: 4,
    type: "EXCLUSIVITÉ",
    title: "PIÈCES DE FREINAGE",
    subtitle: "Sécurité maximale : -25% sur les disques et plaquettes ce mois-ci.",
    cta: "Découvrir",
    image: "/images/banner/pieces-freinage.jpg",
    color: "bg-green-600"
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
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* BLOC RECHERCHE : order-2 sur mobile (en bas), lg:order-1 sur ordi (à gauche) */}
        <div className="w-full lg:w-[360px] bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-6 flex flex-col z-20 order-2 lg:order-1">
          <div className="mb-6 text-center lg:text-left">
             <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Identifiez votre véhicule</h2>
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

        {/* CARROUSEL PUBLICITAIRE : order-1 sur mobile (en haut), lg:order-2 sur ordi (à droite) */}
        <div className="flex-1 relative min-h-[350px] sm:min-h-[400px] lg:min-h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 order-1 lg:order-2">
          {BANNERS.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img 
                src={banner.image} 
                alt={banner.title} 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />

              <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 sm:px-16 text-white">
                <span className={`${banner.color} text-[10px] font-black px-4 py-1.5 rounded-full w-fit mb-4 tracking-widest uppercase shadow-lg`}>
                  {banner.type}
                </span>
                
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight max-w-2xl drop-shadow-md uppercase tracking-tighter">
                  {banner.title}
                </h2>
                
                <p className="text-slate-100 text-sm sm:text-lg opacity-90 mb-8 max-w-lg font-medium line-clamp-2 italic">
                  {banner.subtitle}
                </p>
                
                <button className="flex items-center gap-3 w-fit bg-white text-slate-900 px-8 py-4 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 group">
                  {banner.cta}
                  <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination & Contrôles */}
          <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-6">
              <button 
                onClick={() => setIsPaused(!isPaused)} 
                className="text-white/50 hover:text-white transition-colors p-2 bg-black/20 backdrop-blur-md rounded-full"
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              </button>
              
              <div className="flex gap-2.5">
                {BANNERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentSlide(i); setIsPaused(true); }}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === currentSlide ? 'bg-white w-10 shadow-md' : 'bg-white/30 w-2.5 hover:bg-white/60'
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