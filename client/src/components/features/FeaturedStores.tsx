import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, ArrowRight, ShieldCheck, Loader2, MessageCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorStore {
  id: string;
  store_name: string;
  commune: string;
  avatar_url?: string;
  is_verified: boolean;
  status: string;
}

export default function FeaturedStores() {
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    try {
      setErrorMessage(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, store_name, commune, avatar_url, is_verified, status')
        .eq('role', 'vendor')
        .eq('is_verified', true) 
        .eq('is_featured', true) 
        .not('store_name', 'is', null)
        .limit(4);

      if (error) {
        setErrorMessage(error.message);
        throw error;
      }
      
      if (data) setStores(data as VendorStore[]);
    } catch (error) {
      console.error("Erreur détaillée:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadStores())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStores]);

  return (
    <section className="bg-white py-8 md:py-24 relative border-t border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* --- HEADER COMPACT --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-14 gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 font-black text-[7px] md:text-[9px] uppercase tracking-[0.2em] mb-2 md:mb-4">
              <TrendingUpIcon />
              <span>Réseau Officiel Abidjan</span>
            </div>
            
            <h2 className="text-xl md:text-5xl font-[1000] text-[#111625] tracking-tighter uppercase italic leading-none mb-2">
              BOUTIQUES <br className="hidden sm:block" />
              <span className="text-blue-600">PARTENAIRES</span>
            </h2>
            <p className="text-slate-500 font-bold text-[10px] md:text-sm italic">
              Vendeurs vérifiés par SpaceAuto24
            </p>
          </div>

          <Link 
            to="/stores" 
            className="group flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 md:px-6 py-2.5 md:py-3.5 rounded-full font-[1000] text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#111625] hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm w-full md:w-auto"
          >
            Toutes les boutiques 
            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* --- GRILLE (2 COLONNES MOBILE POUR LA CONSISTANCE) --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-slate-500 font-black text-[7px] uppercase tracking-[0.3em]">Chargement...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {stores.map((store) => (
              <div 
                key={store.id} 
                className="bg-white border border-slate-200 flex flex-col group hover:border-blue-200 hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden"
              >
                <div className="relative h-32 md:h-56 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 overflow-hidden">
                  <div className="absolute bottom-2 left-2 bg-[#FF6B00] text-white px-1.5 py-0.5 flex items-center gap-1 rounded-sm shadow-md z-10">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span className="text-[7px] md:text-[9px] font-black uppercase">PRO</span>
                  </div>

                  {store.avatar_url ? (
                    <img 
                      src={store.avatar_url} 
                      alt={store.store_name} 
                      className="w-16 h-16 md:w-32 md:h-32 object-contain group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <Store className="w-10 h-10 md:w-16 md:h-16 text-slate-300" />
                  )}
                </div>

                <div className="p-3 md:p-5 flex flex-col flex-1">
                  <h3 className="text-[10px] md:text-sm font-[1000] text-[#111625] uppercase tracking-tight mb-4 md:mb-6 line-clamp-1">
                    {store.store_name}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto mb-3">
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-red-500" />
                      <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest truncate max-w-[50px] md:max-w-[100px]">
                        {store.commune || 'Abidjan'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-blue-500" />
                      <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        OK
                      </span>
                    </div>
                  </div>

                  {/* 🟢 BOUTONS PLUS COMPACTS */}
                  <div className="flex gap-1.5">
                    <Link 
                      to={`/store/${store.id}`} 
                      className="flex-1 bg-[#0F172A] text-white py-2 md:py-3 rounded-lg flex items-center justify-center gap-1.5 text-[8px] md:text-[10px] font-[1000] uppercase tracking-[0.1em] hover:bg-blue-600 transition-colors"
                    >
                      <Store className="w-3 h-3 md:w-4 h-4" /> VISITER
                    </Link>
                    <button 
                      className="w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TrendingUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  );
}