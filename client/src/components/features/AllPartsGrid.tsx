// src/components/features/AllPartsGrid.tsx
import { 
  Settings, Droplets, Gauge, Disc, Zap, 
  Lightbulb, Activity, Wind, ChevronRight, 
  CheckCircle2, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  {
    title: "Moteur & Transmission",
    links: ["Distribution", "Embrayage", "Turbo", "Injection"],
    parentCategory: "Pièces moteur", 
    icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6" />,
    count: "12,450 pièces",
  },
  {
    title: "Freinage & Sécurité",
    links: ["Plaquettes", "Disques", "Étrier", "ABS"],
    parentCategory: "Freinage",
    icon: <Disc className="w-5 h-5 sm:w-6 sm:h-6" />,
    count: "8,120 pièces",
  },
  {
    title: "Suspension & Direction",
    links: ["Amortisseurs", "Bras", "Rotules", "Crémaillère"],
    parentCategory: "Direction / Suspension / Train",
    icon: <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />,
    count: "5,300 pièces",
  },
  {
    title: "Filtration & Huile",
    links: ["Huile moteur", "Filtre air", "Filtre huile", "Vidange"],
    parentCategory: "Filtres et huile",
    icon: <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />,
    count: "3,100 pièces",
  },
  {
    title: "Démarrage & Énergie",
    links: ["Batteries", "Alternateurs", "Bougies", "Démarreurs"],
    parentCategory: "Démarrage électrique",
    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
    count: "4,200 pièces",
  },
  {
    title: "Visibilité & Phares",
    links: ["Phares LED", "Ampoules", "Rétroviseurs", "Essuie-glace"],
    parentCategory: "Optiques / Phares / Ampoules",
    icon: <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />,
    count: "6,700 pièces",
  },
  {
    title: "Pneus & Équipements",
    links: ["Pneus été/4x4", "Jantes", "Valves", "Gonflage"],
    isTireCategory: true,
    parentCategory: "Tous les pneus & jantes",
    icon: <Activity className="w-5 h-5 sm:w-6 sm:h-6" />,
    count: "2,850 pièces",
  },
  {
    title: "Climatisation & Thermique",
    links: ["Compresseur", "Radiateur", "Condenseur", "Sondes"],
    parentCategory: "Chauffage et Climatisation",
    icon: <Wind className="w-5 h-5 sm:w-6 sm:h-6" />,
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
    <section className="bg-slate-50/50 py-12 sm:py-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- HEADER TECHNIQUE --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 pb-6 border-b-2 border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-2 sm:mb-3">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Inventaire certifié SpaceAuto24</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
              Catalogue de pièces
            </h2>
          </div>
          <div className="flex items-center gap-4 sm:gap-8 text-slate-400 mt-2 md:mt-0">
             <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                <span className="text-xs sm:text-sm font-bold">Qualité OEM</span>
             </div>
             <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                <span className="text-xs sm:text-sm font-bold">Garantie 12 mois</span>
             </div>
          </div>
        </div>

        {/* --- GRID PROFESSIONNELLE --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => handleCategoryClick(cat.parentCategory, cat.isTireCategory)}
              className="group bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-5">
                <div className="bg-slate-50 text-blue-600 p-2.5 sm:p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {cat.icon}
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-widest">
                  {cat.count}
                </span>
              </div>
              
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                {cat.title}
              </h3>
              
              {/* --- LISTE DES SOUS-LIENS --- */}
              <ul className="space-y-2 mb-6 flex-grow">
                {cat.links.map((link, i) => (
                  <li 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation(); // Évite que le clic n'ouvre la catégorie parente
                      handleCategoryClick(link, cat.isTireCategory); // Cherche exactement ce mot
                    }}
                    className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                    {link}
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-auto">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Voir le rayon</span>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          ))}
        </div>

        {/* --- BANNIÈRE DE CONFIANCE --- */}
        <div className="mt-8 sm:mt-12 bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6">
             <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 animate-spin-slow" />
             </div>
             <div>
               <h4 className="text-white font-black text-lg sm:text-xl mb-1">Vous ne trouvez pas votre pièce ?</h4>
               <p className="text-blue-200 font-medium text-xs sm:text-sm">Nos experts identifient votre châssis gratuitement par WhatsApp.</p>
             </div>
          </div>
          <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
            Contacter un technicien
          </button>
        </div>

        {/* --- SECTION : CONSTRUCTEURS --- */}
        <div className="mt-12 sm:mt-16 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-8">
            <div className="hidden sm:block w-1.5 h-10 bg-blue-600 rounded-full" />
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Constructeurs populaires
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mt-1">
                Trouvez des pièces par marque de véhicule à Abidjan
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3 sm:gap-x-8 sm:gap-y-4">
            {TOP_BRANDS.map((brand) => (
              <button 
                key={brand} 
                onClick={() => navigate(`/catalog?brand=${brand.toLowerCase()}`)} 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all group py-1 sm:py-2 text-left w-full"
              >
                <ChevronRight className="w-3 h-3 text-slate-200 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                <span className="text-xs sm:text-sm uppercase tracking-tight truncate">{brand}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
            <button className="text-slate-400 hover:text-blue-600 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
              Voir tous les constructeurs <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}