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
          // 🟢 CORRECTION ICI : "flex-row" appliqué partout, même sur mobile.
          className="flex flex-row items-center gap-2 md:gap-4"
        >
          {/* Barre de recherche principale */}
          <div className="relative flex-1 group">
            <Search 
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors w-4 h-4 md:w-5 md:h-5" 
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // J'ai réduit le padding left (pl-10 au lieu de 12) sur mobile pour gagner de la place
              placeholder="RECHERCHER UNE PIÈCE..."
              className="w-full bg-[#172554] border border-blue-700/50 rounded-full py-3 md:py-4 pl-9 md:pl-14 pr-3 md:pr-6 text-[10px] md:text-xs font-bold text-white placeholder:text-blue-300/70 outline-none focus:border-blue-400 focus:bg-[#1e3a8a] transition-all shadow-inner"
            />
            
            <div className="hidden lg:flex items-center gap-1 absolute right-5 top-1/2 -translate-y-1/2 bg-orange-500 px-3 py-1 rounded-full border border-orange-500">
              <MapPin size={10} className="text-white" />
              <span className="text-[8px] font-black uppercase text-white tracking-widest">Côte d'Ivoire</span>
            </div>
          </div>

          {/* Boutons d'action (Alignés sur la même ligne) */}
          <div className="flex shrink-0 gap-2 md:gap-3">
            <button 
              type="button"
              title="Recherche par véhicule (Filtres)"
              // Sur mobile : w-10 h-10 ou w-12 h-12 pour tenir sur la ligne
              className="flex items-center justify-center bg-[#172554] hover:bg-orange-500 border border-orange-500/50 text-white w-10 h-10 md:w-14 md:h-14 rounded-full transition-all active:scale-95 group"
            >
              <SlidersHorizontal className="text-white group-hover:scale-110 transition-transform w-4 h-4 md:w-[18px] md:h-[18px]" />
            </button>
            
            <button 
              type="submit"
              // Sur mobile : on cache le texte, on met juste une icône OU on met un texte très court.
              className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-8 h-10 md:h-14 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-[0.2em] transition-all shadow-lg shadow-orange-500/30 active:scale-95 border border-orange-500"
            >
              <span className="hidden sm:inline">Rechercher</span>
              <span className="sm:hidden">GO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}