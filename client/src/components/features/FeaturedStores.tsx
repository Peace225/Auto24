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

  // 1. Fonction de chargement (Extraite pour être réutilisable par le Realtime)
  const loadStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, store_name, commune, avatar_url, is_verified, status')
        .eq('role', 'vendor')
        .eq('is_verified', true) // Uniquement les boutiques certifiées
        .eq('status', 'approved') // Et validées par l'admin
        .not('store_name', 'is', null)
        .limit(4);

      if (error) throw error;
      if (data) setStores(data as VendorStore[]);
    } catch (error) {
      console.error("Erreur lors du chargement des boutiques:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 2. Premier chargement
    loadStores();

    // 3. 🟢 LOGIQUE TEMPS RÉEL
    // On écoute tout changement sur la table 'profiles'
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: '*', // Écoute INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Changement détecté sur les boutiques:', payload);
          // Si une boutique est mise à jour par l'admin, on recharge la liste
          loadStores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStores]);

  if (!isLoading && stores.length === 0) {
    return null; 
  }

  return (
    <section className="bg-white py-16 md:py-24 relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase tracking-[0.2em] mb-3">
              <TrendingUpIcon />
              <span>Réseau Officiel Abidjan</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-[1000] text-[#111625] tracking-tighter uppercase italic leading-none mb-3">
              BOUTIQUES <br className="hidden sm:block" />
              <span className="text-blue-600">PARTENAIRES</span>
            </h2>
            <p className="text-slate-500 font-bold text-sm italic">
              Les meilleurs vendeurs de pièces auto vérifiés par notre équipe
            </p>
          </div>

          <Link 
            to="/stores" 
            className="group flex items-center justify-center md:justify-start gap-3 bg-white border border-slate-200 px-6 py-3.5 rounded-full font-[1000] text-[10px] uppercase tracking-[0.2em] text-[#111625] hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm w-full md:w-auto"
          >
            Voir tous les vendeurs 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* --- CONTENU --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.3em]">Mise à jour des partenaires...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-700">
            {stores.map((store) => (
              <div 
                key={store.id} 
                className="bg-white border border-slate-200 flex flex-col group hover:border-blue-200 hover:shadow-xl transition-all duration-300"
              >
                {/* ZONE IMAGE */}
                <div className="relative h-56 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6 overflow-hidden">
                  <div className="absolute bottom-3 left-3 bg-[#FF6B00] text-white px-2 py-1 flex items-center gap-1 rounded-sm shadow-md z-10">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-wider">PRO</span>
                  </div>

                  {store.avatar_url ? (
                    <img 
                      src={store.avatar_url} 
                      alt={store.store_name} 
                      className="w-32 h-32 object-contain group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <Store className="w-16 h-16 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                  )}
                </div>

                {/* ZONE INFOS */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-sm font-[1000] text-[#111625] uppercase tracking-tight mb-6 line-clamp-1">
                    {store.store_name}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto mb-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[100px]">
                        {store.commune || 'Abidjan'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Certifié
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link 
                      to={`/store/${store.id}`} 
                      className="flex-1 bg-[#0F172A] text-white py-3 rounded-sm flex items-center justify-center gap-2 text-[10px] font-[1000] uppercase tracking-[0.1em] hover:bg-blue-600 transition-colors"
                    >
                      <Store className="w-4 h-4" /> VISITER
                    </Link>
                    <button 
                      className="w-10 h-10 shrink-0 flex items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-sm transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
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
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  );
}