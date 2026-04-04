import { Wrench, Settings, Droplets, Hammer } from 'lucide-react';
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
    iconClass: "text-green-600 group-hover:text-white",
    colorClass: "bg-green-50 group-hover:bg-green-600",
    link: "/outillage"
  }
];

export default function PopularCategories() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-12">
      <div className="flex flex-col items-center mb-12">
        <span className="text-blue-600 font-bold text-sm uppercase tracking-[0.2em] mb-3">
          Catalogue Pro
        </span>
        <h2 className="text-4xl font-black text-slate-900 text-center tracking-tight">
          Explorez par catégories populaires
        </h2>
        <div className="h-1.5 w-20 bg-blue-600 rounded-full mt-4"></div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
        {CATEGORIES.map((cat, index) => (
          <Link 
            key={index} 
            to={cat.link}
            className="group relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
          >
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className={`relative z-10 ${cat.colorClass} w-20 h-20 flex items-center justify-center rounded-3xl mb-6 transition-all duration-500 transform group-hover:rotate-6 group-hover:scale-110 shadow-inner`}>
              {/* On clone l'icône pour lui injecter les classes dynamiquement */}
              {React.cloneElement(cat.icon as React.ReactElement, { 
                className: `w-10 h-10 transition-colors duration-500 ${cat.iconClass}` 
              })}
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                {cat.title}
              </h3>
              <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">
                {cat.subtitle}
              </p>
            </div>

            {/* Petite flèche discrète qui apparaît au hover */}
            <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
               <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

import React from 'react'; // Nécessaire pour React.cloneElement