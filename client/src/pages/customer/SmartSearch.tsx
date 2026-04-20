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
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* --- BARRE DE RECHERCHE GÉANTE --- */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        </div>
        <input 
          type="text"
          placeholder="RECHERCHER UNE PIÈCE, UNE RÉFÉRENCE OEM, UN MODÈLE..."
          className="w-full pl-20 pr-10 py-8 bg-white border-2 border-slate-100 rounded-[2.5rem] text-sm font-black uppercase tracking-widest focus:border-blue-600 focus:shadow-2xl focus:shadow-blue-100 outline-none transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* --- FILTRES LATÉRAUX --- */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" /> Filtrer par véhicule
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setSelectedVehicle(null)}
                className={`w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-tight border-2 transition-all
                ${!selectedVehicle ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 hover:border-slate-200 text-slate-400'}`}
              >
                Toutes les pièces
              </button>
              {userVehicles.map(v => (
                <button 
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`w-full p-4 rounded-2xl text-left border-2 transition-all
                  ${selectedVehicle?.id === v.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:border-blue-200'}`}
                >
                  <p className="text-[10px] font-black text-slate-900 uppercase">{v.make} {v.model}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{v.year}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
            <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-orange-500" /> Catégories
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Tous", ...CATEGORIES].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all
                  ${selectedCategory === cat ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/10 hover:border-white/30 text-white/60'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- RÉSULTATS --- */}
        <div className="lg:col-span-3 space-y-6">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((product) => (
                <div key={product.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 bg-slate-50 rounded-3xl overflow-hidden shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">{product.brand}</p>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 italic">{product.name}</h3>
                        
                        {/* 🟢 LE BADGE DE COMPATIBILITÉ CRITIQUE */}
                        {selectedVehicle && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Compatible {selectedVehicle.model}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-[1000] text-slate-900">{product.price.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">CFA</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95">Ajouter au panier</button>
                    <button className="px-6 py-4 border-2 border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Détails</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
               <Zap className="w-12 h-12 text-slate-100 mx-auto mb-4" />
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Démarrer une recherche d'élite</p>
               <p className="text-xs text-slate-300 mt-2 font-bold uppercase">Entrez un nom de pièce ou sélectionnez un filtre</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}