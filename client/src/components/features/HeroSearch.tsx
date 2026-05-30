import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, CarFront, Calendar, Wrench, Settings2 } from 'lucide-react';

const VEHICLE_DATA: Record<string, string[]> = {
  toyota: ["Hilux", "Corolla", "Land Cruiser", "Prado", "Rav4", "Yaris"],
  hyundai: ["Tucson", "Santa Fe", "Accent", "Elantra", "I10"],
  suzuki: ["Swift", "Vitara", "Jimny", "S-Cross", "Alto"],
  kia: ["Sportage", "Picanto", "Sorento", "Rio", "Cerato"],
  mercedes: ["Classe C", "Classe E", "Classe G", "ML", "Sprinter"]
};

const PART_CATEGORIES = [
  "Liaison au sol",
  "Organes Moteurs",
  "Électronique",
  "Carrosserie",
  "Huiles & Filtration",
  "Pneumatiques"
];

export default function HeroSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    year: '',
    motorisation: '',
    category: '',
    location: ''
  });

  const handleChange = (field: string, value: string) => {
    if (field === 'brand') {
      setFilters(prev => ({ ...prev, brand: value, model: '' }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    navigate(`/catalog?${params.toString()}`);
  };

  // Style commun pour réduire la répétition et la hauteur
  const selectStyle = "w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none text-[11px] font-bold text-slate-800 appearance-none cursor-pointer transition-all";
  const labelStyle = "text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1";

  return (
    <form onSubmit={handleSearch} className="space-y-3">
      
      {/* 🟢 LIGNE 1 : MARQUE & MODÈLE */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelStyle}><CarFront className="w-3 h-3" /> Marque</label>
          <div className="relative">
            <select required className={selectStyle} value={filters.brand} onChange={(e) => handleChange('brand', e.target.value)}>
              <option value="">Sélectionner</option>
              {Object.keys(VEHICLE_DATA).map(brand => (
                <option key={brand} value={brand} className="capitalize">{brand}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelStyle}>Modèle</label>
          <div className="relative">
            <select 
              className={`${selectStyle} ${!filters.brand ? 'opacity-50' : ''}`}
              value={filters.model}
              onChange={(e) => handleChange('model', e.target.value)}
              disabled={!filters.brand}
            >
              <option value="">{filters.brand ? "Tous" : "--"}</option>
              {filters.brand && VEHICLE_DATA[filters.brand].map(model => (
                <option key={model} value={model.toLowerCase()}>{model}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 🟢 LIGNE 2 : ANNÉE & TRANSMISSION */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelStyle}><Calendar className="w-3 h-3" /> Année</label>
          <input 
            type="number" placeholder="Ex: 2015" className={selectStyle}
            value={filters.year} onChange={(e) => handleChange('year', e.target.value)}
          />
        </div>

        <div>
          <label className={labelStyle}><Settings2 className="w-3 h-3" /> Boite</label>
          <div className="relative">
            <select className={selectStyle} value={filters.motorisation} onChange={(e) => handleChange('motorisation', e.target.value)}>
              <option value="">Toutes</option>
              <option value="manuelle">Manuelle</option>
              <option value="automatique">Automatique</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>
      {/* BOUTON RECHERCHER COMPACT */}
      <button 
        type="submit"
        className="w-full mt-2 bg-slate-900 hover:bg-blue-600 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-[10px] tracking-widest shadow-lg"
      >
        <Search className="w-4 h-4" />
        TROUVER MA PIÈCE
      </button>

    </form>
  );
}