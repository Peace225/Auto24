import React, { useState, useEffect } from 'react';
import { Search, Loader2, ChevronRight, PackagePlus } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function SubHeaderSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('searchTerm') || "");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

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
      <div className="max-w-7xl mx-auto px-3 py-3 flex flex-col gap-3">
        
        {/* Barre de recherche */}
        <form onSubmit={handleSubmit} className="relative flex w-full h-12">
          <input
            type="text"
            inputMode="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une pièce..."
            className="w-full bg-white rounded-l-xl py-2 pl-4 pr-2 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-400 transition-all"
          />
          <button 
            type="submit" 
            className="bg-[#f3a847] hover:bg-orange-500 text-slate-900 px-5 flex items-center justify-center rounded-r-xl transition-all active:scale-95 shadow-md"
            aria-label="Rechercher"
          >
            <Search className="w-5 h-5 stroke-[3]" />
          </button>
        </form>

        {/* Bouton Vendre (Visible uniquement si non connecté) */}
        {!session && (
          <Link 
            to="/become-vendor" 
            className="md:hidden flex items-center justify-center gap-2 w-full bg-orange-600 border border-orange-500 text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-md"
          >
            <PackagePlus size={16} />
            Vendre une pièce
          </Link>
        )}

        {/* Résultats Dropdown */}
        {showDropdown && (
          <div className="absolute left-2 right-2 top-[calc(100%+8px)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[9999] max-h-[70vh] overflow-y-auto">
            {isSearching ? (
              <div className="p-8 text-center flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                {results.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/catalog?searchTerm=${encodeURIComponent(product.name)}`} 
                    onClick={() => setShowDropdown(false)} 
                    className="flex items-center gap-3 p-3 hover:bg-blue-50 border-b border-slate-50 last:border-none transition-colors active:bg-blue-100"
                  >
                    <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase text-slate-800 truncate">{product.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{product.brand || 'Pièce'}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
                  </Link>
                ))}
                <button 
                  onClick={handleSubmit} 
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest text-center transition-colors"
                >
                  Voir tous les résultats
                </button>
              </div>
            ) : (
              <p className="p-6 text-center text-[11px] font-bold uppercase text-slate-400">Aucune pièce trouvée</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}