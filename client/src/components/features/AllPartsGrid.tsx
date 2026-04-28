import { 
  Settings, Droplets, Gauge, Disc, Zap, 
  Lightbulb, Activity, Wind, ChevronRight, 
  CheckCircle2, Package, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  {
    title: "Moteur & Transmission",
    links: ["Distribution", "Embrayage", "Turbo", "Injection"],
    parentCategory: "Pièces moteur", 
    icon: <Settings className="w-4 h-4 md:w-6 md:h-6" />,
    count: "12,450 pièces",
  },
  {
    title: "Freinage & Sécurité",
    links: ["Plaquettes", "Disques", "Étrier", "ABS"],
    parentCategory: "Freinage",
    icon: <Disc className="w-4 h-4 md:w-6 md:h-6" />,
    count: "8,120 pièces",
  },
  {
    title: "Suspension & Direction",
    links: ["Amortisseurs", "Bras", "Rotules", "Crémaillère"],
    parentCategory: "Direction / Suspension / Train",
    icon: <Gauge className="w-4 h-4 md:w-6 md:h-6" />,
    count: "5,300 pièces",
  },
  {
    title: "Filtration & Huile",
    links: ["Huile moteur", "Filtre air", "Filtre huile", "Vidange"],
    parentCategory: "Filtres et huile",
    icon: <Droplets className="w-4 h-4 md:w-6 md:h-6" />,
    count: "3,100 pièces",
  },
  {
    title: "Démarrage & Énergie",
    links: ["Batteries", "Alternateurs", "Bougies", "Démarreurs"],
    parentCategory: "Démarrage électrique",
    icon: <Zap className="w-4 h-4 md:w-6 md:h-6" />,
    count: "4,200 pièces",
  },
  {
    title: "Visibilité & Phares",
    links: ["Phares LED", "Ampoules", "Rétroviseurs", "Essuie-glace"],
    parentCategory: "Optiques / Phares / Ampoules",
    icon: <Lightbulb className="w-4 h-4 md:w-6 md:h-6" />,
    count: "6,700 pièces",
  },
  {
    title: "Pneus & Équipements",
    links: ["Pneus été/4x4", "Jantes", "Valves", "Gonflage"],
    isTireCategory: true,
    parentCategory: "Tous les pneus & jantes",
    icon: <Activity className="w-4 h-4 md:w-6 md:h-6" />,
    count: "2,850 pièces",
  },
  {
    title: "Climatisation & Thermique",
    links: ["Compresseur", "Radiateur", "Condenseur", "Sondes"],
    parentCategory: "Chauffage et Climatisation",
    icon: <Wind className="w-4 h-4 md:w-6 md:h-6" />,
    count: "3,400 pièces",
  }
];

const TOP_BRANDS = [
  "Toyota", "Hyundai", "Kia", "Suzuki", "Mitsubishi", "Mercedes-Benz",
  "BMW", "Nissan", "Ford", "Mazda", "Peugeot", "Renault",
  "Volkswagen", "Honda", "Chevrolet", "Isuzu", "Lexus", "Land Rover"
];

export default function AllPartsGrid() {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string, isTire = false) => {
    const route = isTire ? '/tires' : '/catalog';
    navigate(`${route}?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="bg-slate-50/50 py-8 md:py-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- HEADER TECHNIQUE COMPACT --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 md:pb-6 border-b-2 border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 font-black text-[8px] md:text-xs uppercase tracking-[0.2em] mb-2">
              <Package className="w-3 h-3 md:w-4 md:h-4" />
              <span>Inventaire certifié SpaceAuto24</span>
            </div>
            <h2 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
              Catalogue de pièces
            </h2>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
             <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-emerald-500" />
                <span className="text-[10px] md:text-sm font-bold">Qualité OEM</span>
             </div>
             <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-emerald-500" />
                <span className="text-[10px] md:text-sm font-bold">Garantie 12 mois</span>
             </div>
          </div>
        </div>

        {/* --- GRID (2 COLONNES SUR MOBILE POUR LA FLUIDITÉ) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {CATEGORIES.map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => handleCategoryClick(cat.parentCategory, cat.isTireCategory)}
              className="group bg-white border border-slate-100 rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-50 text-blue-600 p-2 md:p-3 rounded-lg md:rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {cat.icon}
                </div>
                <span className="text-[7px] md:text-[10px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md uppercase tracking-widest">
                  {cat.count}
                </span>
              </div>
              
              <h3 className="text-sm md:text-lg font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                {cat.title}
              </h3>
              
              <ul className="space-y-1.5 mb-4 flex-grow">
                {cat.links.map((link, i) => (
                  <li 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(link, cat.isTireCategory);
                    }}
                    className="flex items-center gap-2 text-[11px] md:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                    {link}
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-auto">
                <span className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest">Voir le rayon</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
          ))}
        </div>

        {/* --- BANNIÈRE DE CONFIANCE COMPACTE --- */}
        <div className="mt-8 bg-slate-900 rounded-2xl md:rounded-[2rem] p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 md:gap-6">
             <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <Settings className="w-5 h-5 md:w-7 md:h-7" />
             </div>
             <div>
               <h4 className="text-white font-black text-base md:text-xl mb-0.5">Pièce introuvable ?</h4>
               <p className="text-blue-200 font-medium text-[10px] md:text-sm">Nos experts vous répondent par WhatsApp.</p>
             </div>
          </div>
          <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 md:py-4 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
            WhatsApp Technicien
          </button>
        </div>

        {/* --- SECTION : CONSTRUCTEURS COMPACTE --- */}
        <div className="mt-10 md:mt-16 bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] p-6 md:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 mb-6 md:mb-8">
            <div className="hidden sm:block w-1 h-8 bg-blue-600 rounded-full" />
            <div>
              <h3 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Constructeurs populaires
              </h3>
              <p className="text-slate-400 text-[8px] md:text-xs font-black uppercase tracking-widest mt-0.5">
                Recherche par marque à Abidjan
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-2 md:gap-x-8 md:gap-y-4">
            {TOP_BRANDS.map((brand) => (
              <button 
                key={brand} 
                onClick={() => navigate(`/catalog?brand=${brand.toLowerCase()}`)} 
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-bold transition-all group py-1 text-left w-full"
              >
                <ChevronRight className="w-2.5 h-2.5 text-slate-200 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                <span className="text-[10px] md:text-sm uppercase tracking-tight truncate">{brand}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

function TrendingUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  );
}