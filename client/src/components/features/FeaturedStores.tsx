import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, ArrowRight, ShieldCheck, Loader2, MessageCircle } from 'lucide-react';
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

  // --- CHARGEMENT DES DONNÉES ---
  const loadStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, store_name, commune, avatar_url, is_verified, status')
        .eq('role', 'vendor')
        .eq('is_verified', true) // Seules les boutiques validées sortent
        .not('store_name', 'is', null)
        .order('updated_at', { ascending: false }) // Les dernières modifications en haut
        .limit(4);

      if (error) throw error;
      setStores(data as VendorStore[] || []);
    } catch (error) {
      console.error("Erreur temps réel:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- TEMPS RÉEL (REALTIME) ---
  useEffect(() => {
    loadStores();

    const channel = supabase
      .channel('public-profiles-validation')
      .on(
        'postgres_changes',
        {
          event: '*', // Écoute INSERT (nouvelle boutique) et UPDATE (boutique validée par admin)
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // On recharge la liste dès qu'un profil change (ex: is_verified passe de false à true)
          loadStores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStores]);

  if (isLoading && stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl mx-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.4em]">Synchronisation live...</p>
      </div>
    );
  }

  // Si aucune boutique n'est validée pour le moment
  if (!isLoading && stores.length === 0) return null;

  return (
    <section className="bg-white py-8 md:py-24 relative border-t border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-14 gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] uppercase tracking-[0.2em] mb-4">
              <TrendingUpIcon />
              <span>Réseau Vérifié Abidjan</span>
            </div>
            
            <h2 className="text-xl md:text-5xl font-[1000] text-[#111625] tracking-tighter uppercase italic leading-none mb-2">
              BOUTIQUES <br className="hidden sm:block" />
              <span className="text-blue-600">CERTIFIÉES</span>
            </h2>
            <p className="text-slate-500 font-bold text-sm italic">
              Approuvées en direct par l'administration SpaceAuto
            </p>
          </div>

          <Link 
            to="/stores" 
            className="group flex items-center justify-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-full font-[1000] text-[10px] uppercase tracking-[0.2em] text-[#111625] hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
          >
            Découvrir tout le réseau 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* GRID DES BOUTIQUES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stores.map((store) => (
            <div 
              key={store.id} 
              className="bg-white border border-slate-200 flex flex-col group hover:border-blue-400 hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden"
            >
              <div className="relative h-32 md:h-56 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4">
                {/* Badge Vérifié dynamique */}
                <div className="absolute top-3 right-3 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-md shadow-lg shadow-blue-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[8px] font-black italic">VÉRIFIÉ</span>
                    </div>
                </div>

                {store.avatar_url ? (
                  <img 
                    src={store.avatar_url} 
                    alt={store.store_name} 
                    className="w-20 h-20 md:w-36 md:h-36 object-contain group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <Store className="w-12 h-12 md:w-20 md:h-20 text-slate-200" />
                )}
              </div>

              <div className="p-4 md:p-6 flex flex-col flex-1">
                <h3 className="text-xs md:text-base font-[1000] text-[#111625] uppercase mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {store.store_name}
                </h3>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase">
                      {store.commune}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link 
                    to={`/store/${store.id}`} 
                    className="flex-1 bg-[#0F172A] text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200"
                  >
                    BOUTIQUE
                  </Link>
                  <a 
                    href={`https://wa.me/YOUR_NUMBER`} // Tu peux dynamiser avec store.phone si dispo
                    className="w-11 h-11 shrink-0 flex items-center justify-center border border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendingUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  );
}