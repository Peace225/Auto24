import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  PlusCircle, 
  ChevronRight, 
  Loader2, 
  PackageOpen, 
  ArrowRight // 🟢 Import désormais présent
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

interface SubHeaderSearchProps {
  onSearch?: (term: string) => void;
}

export default function SubHeaderSearch({ onSearch }: SubHeaderSearchProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || "";
    }
    return "";
  });

  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      setShowDropdown(true);

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, brand')
          .ilike('name', `%${searchTerm}%`)
          .eq('status', 'approved')
          .limit(4);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Erreur de recherche:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timerId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return; 
    setShowDropdown(false);

    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="w-full bg-[#1e3a8a] border-b border-blue-800 sticky top-16 sm:top-20 z-[9998] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-5 relative" ref={dropdownRef}>
        
        <form onSubmit={handleSubmit} className="flex flex-row items-center gap-2 md:gap-4 relative">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.trim() && setShowDropdown(true)}
              placeholder="RECHERCHER UNE PIÈCE, UNE MARQUE..."
              className="w-full bg-[#172554] border border-blue-700/50 rounded-full py-3 md:py-4 pl-9 md:pl-14 pr-3 md:pr-6 text-[10px] md:text-xs font-bold text-white placeholder:text-blue-300/70 outline-none focus:border-blue-400 focus:bg-[#1e3a8a] transition-all shadow-inner"
              autoComplete="off"
            />
            <div className="hidden lg:flex items-center gap-1 absolute right-5 top-1/2 -translate-y-1/2 bg-orange-500 px-3 py-1 rounded-full border border-orange-500">
              <MapPin size={10} className="text-white" />
              <span className="text-[8px] font-black uppercase text-white tracking-widest">Côte d'Ivoire</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 md:gap-3">
            <button type="button" className="flex items-center justify-center bg-[#172554] hover:bg-orange-500 border border-orange-500/50 text-white w-10 h-10 md:w-14 md:h-14 rounded-full transition-all active:scale-95 group">
              <SlidersHorizontal className="text-white group-hover:scale-110 transition-transform w-4 h-4 md:w-[18px] md:h-[18px]" />
            </button>
            <button type="submit" className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-8 h-10 md:h-14 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 border border-orange-500">
              <span className="hidden sm:inline">Rechercher</span>
              <span className="sm:hidden">GO</span>
            </button>
          </div>
        </form>

        {showDropdown && (
          <div className="absolute left-4 right-4 md:left-4 md:right-[150px] top-[calc(100%+8px)] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden z-[9999]">
            {isSearching ? (
              <div className="p-8 flex justify-center items-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recherche en cours...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suggestions</span>
                </div>
                {results.map((product) => (
                  <Link key={product.id} to={`/product/${product.id}`} onClick={() => setShowDropdown(false)} className="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-none group">
                    <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-100 shrink-0">
                      <img src={product.image_url || 'https://via.placeholder.com/100'} alt={product.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col flex-1 truncate">
                      <span className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-blue-600 transition-colors">{product.name}</span>
                      <span className="text-[10px] font-black text-orange-500">{product.price.toLocaleString()} CFA</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                ))}
                <button onClick={() => handleSubmit({ preventDefault: () => {} } as any)} className="w-full p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors flex justify-center items-center gap-2">
                  Tous les résultats pour "{searchTerm}" <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <PackageOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Aucun résultat</p>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="mt-4 flex md:hidden">
            <Link to="/become-vendor" className="w-full flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-white/10 text-white px-5 py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all overflow-hidden relative group">
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2 rounded-[0.6rem]">
                  <PlusCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-white">Vendre sur SpaceAuto24</span>
                  <span className="text-[8px] font-bold text-blue-200 uppercase mt-0.5">Rapide et rentable</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}