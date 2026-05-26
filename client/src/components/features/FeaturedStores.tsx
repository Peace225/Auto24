import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowRight, ShieldCheck, Loader2, Crown, Star, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorStore {
  id: string;
  store_name: string;
  commune: string;
  avatar_url?: string;
  is_verified: boolean;
  status: string;
  subscriptions?: { package_name: string; status: string }[];
  plan?: 'premium' | 'pro' | 'standard';
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
        .select('id, store_name, commune, avatar_url, is_verified, status, subscriptions(package_name, status)')
        .eq('role', 'vendor')
        .eq('is_verified', true)
        .not('store_name', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      const withPlan = (data || []).map((s: any) => {
        const active = s.subscriptions?.find((x: any) => x.status === 'active');
        const plan = (active?.package_name || 'standard').toLowerCase() as VendorStore['plan'];
        return { ...s, plan };
      });

      withPlan.sort((a, b) => {
        const order = { premium: 0, pro: 1, standard: 2 };
        return (order[a.plan!] ?? 2) - (order[b.plan!] ?? 2);
      });

      setStores(withPlan);
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
        scrollContainer.scrollBy({ left: 280, behavior: 'smooth' });
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

  const getCardGlow = (plan?: string) => {
    switch (plan) {
      case 'premium': return 'before:absolute before:inset-0 before:rounded-[1.5rem] before:p-[1.5px] before:bg-gradient-to-b before:from-amber-400/80 before:to-orange-600/80 before:-z-10 hover:shadow-[0_0_40px_-12px_rgba(245,158,11,0.5)]';
      case 'pro': return 'before:absolute before:inset-0 before:rounded-[1.5rem] before:p-[1.5px] before:bg-gradient-to-b before:from-blue-400/70 before:to-indigo-600/70 before:-z-10 hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.4)]';
      default: return 'border border-slate-200/70 rounded-[1.5rem] hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50';
    }
  };

  const getBadge = (plan?: string) => {
    if (plan === 'premium') return { Icon: Crown, label: 'PREMIUM', cls: 'from-amber-500 to-orange-600 text-white' };
    if (plan === 'pro') return { Icon: Star, label: 'PRO', cls: 'from-blue-600 to-indigo-600 text-white' };
    return { Icon: ShieldCheck, label: 'VÉRIFIÉ', cls: 'from-slate-800 to-slate-900 text-white' };
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!stores.length) return null;

  return (
    <section className="relative py-20 overflow-hidden bg-[#FCFCFD]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white mb-5">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Marketplace Premium</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-[0.85] text-slate-900">
              BOUTIQUES D'EXCEPTION
            </h2>
          </div>
          <Link to="/stores" className="inline-flex items-center gap-2.5 h-12 px-7 rounded-full bg-slate-900 text-white font-bold text-xs uppercase hover:bg-blue-600 transition-all">
            Explorer tout <ArrowRight size={16} />
          </Link>
        </div>

        {/* CARROUSEL MOBILE + GRILLE DESKTOP */}
        <div 
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible"
        >
          {stores.map((store) => {
            const { Icon, label, cls } = getBadge(store.plan);
            return (
              <div key={store.id} className="min-w-[260px] snap-center">
                <div className={`group relative ${getCardGlow(store.plan)} rounded-[1.5rem]`}>
                  <div className="relative bg-white rounded-[1.5rem] p-[1.5px] h-full flex flex-col overflow-hidden">
                    <div className="absolute top-3 left-3 z-20">
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${cls} shadow-lg`}>
                        <Icon size={11} />
                        <span className="text-[9px] font-black tracking-widest">{label}</span>
                      </div>
                    </div>

                    <Link to={`/store/${store.id}`} className="flex-1 grid place-items-center aspect-[4/3] p-8">
                      {store.avatar_url ? (
                        <img src={store.avatar_url} alt={store.store_name} className="max-h-20 object-contain transition-transform group-hover:scale-105" />
                      ) : (
                        <Store className="w-14 h-14 text-slate-200" />
                      )}
                    </Link>

                    <div className="px-5 pb-5">
                      <h3 className="font-black text-sm text-slate-900 truncate">{store.store_name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{store.commune || 'Abidjan'}</p>
                      <Link to={`/store/${store.id}`} className="mt-4 w-full h-10 flex justify-center items-center rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase hover:bg-blue-600 transition-all">
                        Visiter <ArrowRight size={14} className="ml-1.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}