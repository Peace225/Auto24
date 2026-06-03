import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, PackageOpen, ArrowRight, Hash, Car, ChevronRight } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="RECHERCHER UNE PIÈCE..."
              className="w-full bg-[#172554] border border-blue-700 rounded-full py-3 pl-12 pr-4 text-xs font-bold text-white placeholder-blue-300 outline-none focus:border-blue-400"
            />
          </div>
          <button type="submit" className="bg-orange-500 text-white px-6 py-3 rounded-full text-xs font-black uppercase hover:bg-orange-600 transition-all">
            GO
          </button>
        </form>

        {/* DROPDOWN - Tous les liens pointent vers CATALOGUE */}
        {showDropdown && (
          <div className="absolute left-4 right-4 md:left-[10%] md:right-[10%] top-[calc(100%+8px)] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[9999]">
            {isSearching ? (
              <div className="p-8 text-center flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                {results.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/catalog?searchTerm=${encodeURIComponent(product.name)}`} 
                    onClick={() => setShowDropdown(false)} 
                    className="flex items-center gap-4 p-4 hover:bg-blue-50 border-b last:border-none"
                  >
                    <img src={product.image_url} className="w-12 h-12 object-contain" />
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase">{product.name}</p>
                      <p className="text-[10px] text-slate-500">{product.brand}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                ))}
                <button 
                  onClick={handleSubmit} 
                  className="p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest text-center"
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