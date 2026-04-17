import React, { useState } from 'react';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubHeaderSearchProps {
  onSearch?: (term: string) => void;
}

export default function SubHeaderSearch({ onSearch }: SubHeaderSearchProps) {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || "";
    }
    return "";
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return; 

    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="w-full bg-[#1e3a8a] border-b border-blue-800 sticky top-16 z-[80] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-5">
        <form 
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row items-center gap-2 md:gap-4"
        >
          {/* Barre de recherche principale */}
          <div className="relative flex-1 w-full group">
            <Search 
              className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors w-4 h-4 md:w-5 md:h-5" 
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="RECHERCHER UNE PIÈCE, RÉFÉRENCE OEM, MODÈLE..."
              className="w-full bg-[#172554] border border-blue-700/50 rounded-full py-3 md:py-4 pl-10 md:pl-14 pr-4 md:pr-6 text-[10px] md:text-xs font-bold text-white placeholder:text-blue-300/70 outline-none focus:border-blue-400 focus:bg-[#1e3a8a] transition-all shadow-inner"
            />
            
            <div className="hidden lg:flex items-center gap-1 absolute right-5 top-1/2 -translate-y-1/2 bg-orange-500 px-3 py-1 rounded-full border border-orange-500">
              <MapPin size={10} className="text-white" />
              <span className="text-[8px] font-black uppercase text-white tracking-widest">Côte d'Ivoire</span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex w-full md:w-auto gap-2 md:gap-3">
            <button 
              type="button"
              title="Recherche par véhicule (Filtres)"
              className="flex shrink-0 items-center justify-center bg-[#172554] hover:bg-orange-500 border border-orange-500/50 text-white w-12 h-12 md:w-14 md:h-14 rounded-full transition-all active:scale-95 group"
            >
              <SlidersHorizontal className="text-white group-hover:scale-110 transition-transform w-4 h-4 md:w-[18px] md:h-[18px]" />
            </button>
            
            <button 
              type="submit"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 h-12 md:h-14 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-orange-500/30 active:scale-95 border border-orange-500"
            >
              Rechercher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}