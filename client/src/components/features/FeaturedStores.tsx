import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Store, Loader2, ChevronDown, BadgeCheck } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- CHARGEMENT DES DONNÉES ---
  const loadStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, store_name, commune, avatar_url, is_verified, status')
        .eq('role', 'vendor')
        .eq('is_verified', true)
        .not('store_name', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setStores(data || []);
    } catch (e) {
      console.error("Erreur chargement stores:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- AUTO-SCROLL LOGIC ---
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const interval = setInterval(() => {
      if (scrollContainer.scrollLeft + scrollContainer.offsetWidth >= scrollContainer.scrollWidth) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [stores]);

  useEffect(() => {
    loadStores();
    const channel = supabase.channel('public-profiles-validation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadStores)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStores]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>;
  if (!stores.length) return null;

  return (
    <section className="py-10 bg-gray-50 px-4">
      {/* Conteneur principal style "Carte" */}
      <div className="max-w-[1440px] mx-auto bg-white rounded-[2.5rem] shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8 border border-gray-100">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            {/* Icône Boutique */}
            <div className="relative flex items-center justify-center w-14 h-14 bg-sky-50 rounded-2xl">
              <Store className="w-7 h-7 text-blue-600" />
              <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5">
                <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-50" />
              </div>
            </div>
            
            {/* Titre */}
            <div>
              <h2 className="text-2xl md:text-[32px] font-black tracking-tight text-[#1E293B] leading-none mb-1.5">
                Boutiques <span className="text-[#00A8FF]">Officielles</span>
              </h2>
              <p className="text-[11px] font-bold text-gray-400 tracking-[0.15em] uppercase">
                Les plus grandes marques en direct
              </p>
            </div>
          </div>

          {/* Bouton Dropdown */}
          <button className="hidden md:flex items-center gap-3 px-5 py-2.5 border-2 border-gray-100 rounded-2xl text-[13px] font-black text-gray-600 tracking-wider hover:bg-gray-50 transition-colors">
            TOUTES LES BOUTIQUES
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* CARROUSEL DES BOUTIQUES */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {stores.map((store) => (
            <Link 
              key={store.id} 
              to={`/store/${store.id}`}
              className="min-w-[170px] h-[170px] snap-center flex-shrink-0 group"
            >
              <div className="relative w-full h-full bg-white border-[1.5px] border-gray-100 rounded-3xl p-4 flex flex-col items-center justify-center hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/50 transition-all duration-300">
                
                {/* Badge Ouvert */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F8F0]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
                  <span className="text-[9px] font-black tracking-widest text-[#10B981] mt-px">
                    OUVERT
                  </span>
                </div>

                {/* Logo */}
                <div className="w-full h-full flex items-center justify-center mt-5">
                  {store.avatar_url ? (
                    <img 
                      src={store.avatar_url} 
                      alt={store.store_name} 
                      className="max-h-16 max-w-[80%] object-contain group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <Store className="w-12 h-12 text-gray-200" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}