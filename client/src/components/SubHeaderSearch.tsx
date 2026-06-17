import React, { useState, useEffect } from 'react';
import { Search, Loader2, ChevronRight, PackagePlus } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SubHeaderSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('searchTerm') || "");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Recherche automatique
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      setShowDropdown(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, price, image_url, brand, vehicle_model, oem_reference')
        .eq('status', 'approved')
        .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,vehicle_model.ilike.%${searchTerm}%,oem_reference.ilike.%${searchTerm}%`)
        .limit(4);
      
      setResults(data || []);
      setIsSearching(false);
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    navigate(`/catalog?searchTerm=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="w-full bg-[#1e3a8a] border-b border-blue-800 sticky top-0 z-[9998] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
        
        {/* FORMULAIRE DE RECHERCHE - Design "Amazon Style" */}
        <form onSubmit={handleSubmit} className="relative flex w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher sur SpaceAuto24..."
            className="w-full bg-white border-2 border-transparent rounded-l-xl py-3 pl-4 pr-2 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-orange-400 transition-colors"
          />
          <button 
            type="submit" 
            className="bg-[#f3a847] hover:bg-orange-500 text-slate-900 px-5 flex items-center justify-center rounded-r-xl transition-colors border-2 border-transparent focus:border-orange-500"
            aria-label="Rechercher"
          >
            <Search className="w-6 h-6 stroke-[2.5]" />
          </button>
        </form>

        {/* 🟢 BOUTON VENDRE UNE PIÈCE (Placé dans la SubHeaderSearch - Masqué sur PC avec md:hidden) */}
        <Link 
          to="/become-vendor" 
          className="md:hidden flex items-center justify-center gap-2 w-full bg-blue-50/10 hover:bg-blue-50/20 border border-blue-400/30 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <PackagePlus size={14} className="text-blue-300" />
          Vendre une pièce
        </Link>

        {/* DROPDOWN RÉSULTATS DE RECHERCHE */}
        {showDropdown && (
          <div className="absolute left-4 right-4 md:left-[10%] md:right-[10%] top-[calc(100%+8px)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[9999]">
            {isSearching ? (
              <div className="p-8 text-center flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                {results.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/catalog?searchTerm=${encodeURIComponent(product.name)}`} 
                    onClick={() => setShowDropdown(false)} 
                    className="flex items-center gap-4 p-4 hover:bg-blue-50 border-b border-slate-50 last:border-none transition-colors"
                  >
                    <img src={product.image_url} alt={product.name} className="w-12 h-12 object-contain rounded-lg bg-slate-50 p-1" />
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase text-slate-800 line-clamp-1">{product.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.brand || 'Pièce'}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                ))}
                <button 
                  onClick={handleSubmit} 
                  className="p-4 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest text-center transition-colors"
                >
                  Voir tous les résultats
                </button>
              </div>
            ) : (
              <p className="p-8 text-center text-xs font-bold uppercase text-slate-400">Aucune pièce trouvée</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}