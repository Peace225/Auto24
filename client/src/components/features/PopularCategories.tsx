import React from 'react';
import { Wrench, Settings, Droplets, Hammer, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

// Structure de données typée pour éviter les erreurs TS
interface Category {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  iconClass: string;
  link: string;
}

const CATEGORIES: Category[] = [
  {
    title: "Liaison au sol",
    subtitle: "Suspension, Freinage...",
    icon: <Wrench />,
    iconClass: "text-blue-600 group-hover:text-white",
    colorClass: "bg-blue-50 group-hover:bg-blue-600",
    link: "/catalog?cat=liaison"
  },
  {
    title: "Organes Moteurs",
    subtitle: "Distribution, Injection...",
    icon: <Settings />,
    iconClass: "text-orange-500 group-hover:text-white",
    colorClass: "bg-orange-50 group-hover:bg-orange-500",
    link: "/catalog?cat=moteur"
  },
  {
    title: "Huile Moteur",
    subtitle: "5W30, 10W40, Total...",
    icon: <Droplets />,
    iconClass: "text-red-600 group-hover:text-white",
    colorClass: "bg-red-50 group-hover:bg-red-600",
    link: "/huiles"
  },
  {
    title: "Outillage",
    subtitle: "Cliquets, Levage, Clés...",
    icon: <Hammer />,
    iconClass: "text-emerald-600 group-hover:text-white",
    colorClass: "bg-emerald-50 group-hover:bg-emerald-600",
    link: "/outillage"
  }
];

export default function PopularCategories() {
  return (
    <section className="bg-slate-50/50 py-16 md:py-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 🟢 HEADER STYLE INSTITUTIONNEL */}
        <div className="flex flex-col items-center mb-12 md:mb-20 text-center space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-black text-[9px] md:text-[11px] uppercase tracking-[0.3em] md:tracking-[0.4em]">
            <TrendingUp size={14} className="md:w-4 md:h-4" />
            <span>Catalogue Professionnel</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
            Explorez par <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
              catégories
            </span>
          </h2>
        </div>
        
        {/* 🟢 GRILLE RESPONSIVE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {CATEGORIES.map((cat, index) => (
            <Link 
              key={index} 
              to={cat.link}
              className="group relative bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
            >
              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-slate-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Icône avec animation de levée */}
              <div className={`relative z-10 ${cat.colorClass} w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl md:rounded-3xl mb-4 md:mb-6 transition-all duration-500 transform group-hover:-translate-y-2 shadow-inner group-hover:shadow-lg`}>
                {React.cloneElement(cat.icon as React.ReactElement, { 
                  className: `w-7 h-7 md:w-9 md:h-9 transition-colors duration-500 ${cat.iconClass}` 
                })}
              </div>
              
              {/* Textes alignés sur la charte */}
              <div className="relative z-10 flex-1 flex flex-col justify-center">
                <h3 className="text-[12px] md:text-[16px] font-[1000] text-slate-900 group-hover:text-blue-600 uppercase tracking-tighter italic transition-colors duration-300 leading-tight">
                  {cat.title}
                </h3>
                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 md:mt-2">
                  {cat.subtitle}
                </p>
              </div>

              {/* Barre de soulignement au hover (remplace la flèche pour un look plus pro) */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}