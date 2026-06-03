import { useState, useEffect } from 'react';
import { 
  Search, Filter, Car, CheckCircle2, 
  AlertCircle, ArrowRight, SlidersHorizontal, 
  Zap, ShieldCheck, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Catégories pour le filtre rapide
const CATEGORIES = ["Freinage", "Moteur", "Suspension", "Filtres", "Éclairage", "Échappement"];

export default function SmartSearch({ userVehicles }: { userVehicles: any[] }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🟢 LOGIQUE DE RECHERCHE
  const handleSearch = async () => {
    setLoading(true);
    try {
      let supabaseQuery = supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`);

      if (selectedCategory !== 'Tous') {
        supabaseQuery = supabaseQuery.eq('category', selectedCategory);
      }

      const { data, error } = await supabaseQuery;
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      
      {/* --- BARRE DE RECHERCHE GÉANTE --- */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 md:left-8 flex items-center pointer-events-none">
          <Search className="h-5 w-5 md:h-6 md:w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        </div>
        <input 
          type="text"
          placeholder="RECHERCHER UNE PIÈCE, UNE RÉFÉRENCE..."
          className="w-full pl-12 md:pl-20 pr-10 py-4 md:py-8 bg-white border-2 border-slate-100 rounded-[2rem] md:rounded-[2.5rem] text-xs md:text-sm font-black uppercase tracking-widest focus:border-blue-600 focus:shadow-2xl focus:shadow-blue-100 outline-none transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-4 md:right-8 flex items-center">
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
        
        {/* --- FILTRES LATÉRAUX --- */}
        <div className="space-y-4 md:space-y-8">
          <div className="bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-sm">
            <h3 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
              <Car className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" /> Filtrer par véhicule
            </h3>
            <div className="space-y-2 md:space-y-3">
              <button 
                onClick={() => setSelectedVehicle(null)}
                className={`w-full p-3 md:p-4 rounded-xl md:rounded-2xl text-left text-[9px] md:text-[10px] font-black uppercase tracking-tight border-2 transition-all
                ${!selectedVehicle ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 hover:border-slate-200 text-slate-400'}`}
              >
                Toutes les pièces
              </button>
              {userVehicles.map(v => (
                <button 
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`w-full p-3 md:p-4 rounded-xl md:rounded-2xl text-left border-2 transition-all
                  ${selectedVehicle?.id === v.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:border-blue-200'}`}
                >
                  <p className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase">{v.make} {v.model}</p>
                  <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{v.year}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 text-white">
            <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" /> Catégories
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Tous", ...CATEGORIES].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all
                  ${selectedCategory === cat ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/10 hover:border-white/30 text-white/60'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- RÉSULTATS --- */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {results.map((product) => (
                <div key={product.id} className="bg-white border border-slate-100 rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                  <div className="flex gap-4 md:gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between py-1 flex-1">
                      <div>
                        <p className="text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">{product.brand}</p>
                        <h3 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-2 md:mb-3 italic line-clamp-2">{product.name}</h3>
                        
                        {/* 🟢 LE BADGE DE COMPATIBILITÉ CRITIQUE */}
                        {selectedVehicle && (
                          <div className="inline-flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-emerald-50 text-emerald-600 rounded-full mt-1">
                            <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" />
                            <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest truncate">Compatible {selectedVehicle.model}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <p className="text-base md:text-xl font-[1000] text-slate-900 leading-none">
                          {product.price.toLocaleString()} <span className="text-[8px] md:text-[10px] text-slate-400 uppercase">CFA</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-2 md:gap-3">
                    <button className="w-full sm:flex-1 py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95">
                      Ajouter au panier
                    </button>
                    <button className="w-full sm:w-auto px-4 md:px-6 py-3 md:py-4 border-2 border-slate-100 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-center">
                      Détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl md:rounded-[3rem] p-10 md:p-20 text-center border-2 border-dashed border-slate-100">
               <Zap className="w-8 h-8 md:w-12 md:h-12 text-slate-200 mx-auto mb-3 md:mb-4" />
               <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Démarrer une recherche d'élite</p>
               <p className="text-[10px] md:text-xs text-slate-300 mt-1.5 md:mt-2 font-bold uppercase">Entrez un nom de pièce ou sélectionnez un filtre</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}