import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, ArrowRight, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorStore {
  id: string;
  store_name: string;
  commune: string;
  avatar_url?: string;
}

export default function FeaturedStores() {
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      setIsLoading(true);
      try {
        // On récupère uniquement les vendeurs VÉRIFIÉS par l'Admin
        const { data, error } = await supabase
          .from('profiles')
          .select('id, store_name, commune, avatar_url')
          .eq('role', 'vendor')
          .eq('is_verified', true)
          .not('store_name', 'is', null)
          .limit(4);

        if (error) throw error;
        if (data) setStores(data);

      } catch (error) {
        console.error("Erreur lors du chargement des boutiques:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStores();
  }, []);

  // 🟢 LOGIQUE D'AFFICHAGE : Si ce n'est plus en chargement et qu'il n'y a pas de boutique, 
  // on retourne "null" pour masquer totalement cette section de la page d'accueil.
  if (!isLoading && stores.length === 0) {
    return null; 
  }

  return (
    <section className="bg-[#0B0F1A] py-16 md:py-24 relative overflow-hidden">
      {/* Effets lumineux de fond */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* --- HEADER DE LA SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-black text-[8px] md:text-[9px] uppercase tracking-[0.3em] mb-3 md:mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Réseau Officiel</span>
            </div>
            
            {/* 🟢 Polices réduites ici */}
            <h2 className="text-3xl md:text-5xl font-[1000] text-white tracking-tighter uppercase italic leading-none">
              Nos Boutiques <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Partenaires
              </span>
            </h2>
          </div>

          <Link 
            to="/stores" 
            className="group flex items-center justify-center md:justify-start gap-3 bg-white/5 border border-white/10 px-6 py-3.5 md:py-4 rounded-full font-[1000] text-[9px] uppercase tracking-[0.2em] text-white hover:bg-white hover:text-[#0B0F1A] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-95 w-full md:w-auto"
          >
            Voir tous les vendeurs 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* --- CONTENU --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.3em]">Recherche des partenaires...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stores.map((store, index) => (
              <Link 
                to={`/store/${store.id}`} 
                key={store.id} 
                className="group block bg-[#111625] border border-white/5 rounded-[2rem] p-5 md:p-6 hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_15px_50px_rgba(37,99,235,0.15)] animate-in fade-in slide-in-from-bottom-8 relative overflow-hidden"
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
              >
                {/* Glow au survol */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-transparent transition-colors duration-500" />

                <div className="relative z-10">
                  {/* Avatar & Badge */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-900 border border-white/10 rounded-[1.25rem] flex items-center justify-center font-[1000] text-2xl text-white uppercase italic shadow-inner overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      {store.avatar_url ? (
                        <img src={store.avatar_url} alt={store.store_name} className="w-full h-full object-cover" />
                      ) : (
                        store.store_name.charAt(0)
                      )}
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Certifié</span>
                    </div>
                  </div>

                  {/* Infos Boutique - Police réduite */}
                  <h3 className="text-lg md:text-xl font-[1000] text-white uppercase italic tracking-tighter mb-4 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {store.store_name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-white/5 rounded-md border border-white/5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[100px]">
                        {store.commune || 'Abidjan'}
                      </span>
                    </div>
                    
                    <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}