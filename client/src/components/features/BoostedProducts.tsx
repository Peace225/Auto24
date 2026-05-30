import { useEffect, useState, useRef } from 'react';
import { Loader2, Heart, ShoppingCart, Star, Store, Crown, Award, Zap, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../../utils/pricing';
import VendorBadge from '../features/VendorBadge';

export default function BoostedProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToCart = useCartStore((state) => state.addToCart);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const loadBoostedProducts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles!products_vendor_id_fkey (
            store_name,
            role,
            status,
            subscription_plan
          ),
          reviews (rating)
        `)
        .eq('status', 'approved')
        .gt('stock', 0)
        .eq('is_boosted', true)
        .order('boosted_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formatted = (data || []).map(item => {
        const avg = item.reviews?.length ? item.reviews.reduce((a: number, c: any) => a + c.rating, 0) / item.reviews.length : 0;
        const isAdmin = item.vendor?.role === 'admin' || item.vendor?.role === 'super_admin';
        const activePlan = isAdmin ? 'premium' : (item.vendor?.subscription_plan || 'standard');

        let img = 'https://placehold.co/300x300/e2e8f0/94a3b8?text=Image+Non+Disponible';
        
        if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
          img = item.images[0];
        } 
        else if (typeof item.images === 'string' && item.images.length > 5) {
          try {
            const parsed = JSON.parse(item.images);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) img = parsed[0];
            else img = item.images;
          } catch (e) {
            img = item.images;
          }
        } 
        else if (item.image_url && typeof item.image_url === 'string' && item.image_url.length > 5) {
          img = item.image_url;
        }

        img = img.replace(/^["']|["']$/g, '');

        return {
          ...item,
          final_price: getPublicPrice(item.price || 0),
          image: img,
          vendor_name: isAdmin ? 'SPACEAUTO' : (item.vendor?.store_name || 'Boutique'),
          vendor_status: isAdmin ? 'approved' : (item.vendor?.status || 'standard'),
          vendor_plan: activePlan.toLowerCase(),
          avgRating: avg,
          reviewsCount: item.reviews?.length || 0
        };
      });

      setProducts(formatted);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement des offres sponsorisées");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoostedProducts();
    
    if (user) {
      supabase.from('favorites').select('product_id').eq('user_id', user.id)
        .then(({ data }) => setFavorites(data?.map(f => f.product_id) || []));
    }

    const productsChannel = supabase.channel('public-products-boosted')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadBoostedProducts(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, [user]);

  useEffect(() => {
    if (isHovered || products.length <= 1) return;

    const intervalId = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // On avance un peu moins (environ la taille d'une carte + le gap)
          scrollRef.current.scrollBy({ left: 196, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isHovered, products.length]);

  const toggleFav = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return navigate('/login');
    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(x => x !== id) : [...prev, id]);
    if (isFav) await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
    else await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'premium': return 'text-amber-600';
      case 'pro': return 'text-blue-600';
      default: return 'text-slate-500';
    }
  };

  if (isLoading && products.length === 0) {
     return (
       <div className="py-12 flex justify-center bg-slate-50"><Loader2 className="animate-spin w-8 h-8 text-purple-600" /></div>
     );
  }

  if (products.length === 0) {
      return null;
  }

  return (
    <section className="py-8 bg-slate-50 relative" id="boosted-products-section">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-purple-500/15 blur-[80px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="bg-gradient-to-b from-purple-50/50 to-white rounded-3xl shadow-lg shadow-purple-500/10 border-2 border-purple-200 overflow-hidden mb-8">
          
          <div className="bg-gradient-to-r from-[#6D28D9] via-[#9333EA] to-[#6D28D9] bg-[length:200%_auto] animate-gradient px-5 py-4 flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <h2 className="font-black text-white text-lg sm:text-xl tracking-tight uppercase">
              Offres <span className="text-fuchsia-200">Sponsorisées</span>
            </h2>
            <span className="hidden md:flex ml-auto text-[10px] font-black text-purple-700 bg-white px-3 py-1.5 rounded-full uppercase tracking-widest items-center gap-1 shadow-sm">
              <Zap size={12} className="fill-purple-600" /> Recommandé
            </span>
          </div>

          <div 
            className="p-4 sm:p-5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
          >
            <div 
              ref={scrollRef} 
              className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
              {products.map(p => {
                const plan = p.vendor_plan;
                return (
                  // 🔴 La taille de la carte est réduite ici : w-[140px] sur mobile, sm:w-[160px], md:w-[180px] sur PC
                  <div key={p.id} className="w-[140px] sm:w-[160px] md:w-[180px] flex-shrink-0 snap-start group relative bg-white rounded-2xl border-2 border-purple-100 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col transform hover:-translate-y-1">
                    
                    <div className="absolute top-2 left-2 z-20">
                      <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                        <Zap size={8} fill="currentColor" /> À la une
                      </span>
                    </div>

                    <button onClick={(e) => toggleFav(p.id, e)} className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm hover:scale-110 transition border border-purple-50">
                      <Heart size={12} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                    </button>

                    {/* 🔴 Le padding de l'image est réduit (p-3 au lieu de p-4) */}
                    <Link to={`/product/${p.id}`} className="relative block aspect-square p-3 bg-gradient-to-b from-purple-50/50 to-white rounded-t-2xl">
                      <img src={p.image} className="w-full h-full object-contain mix-blend-darken group-hover:scale-105 transition-transform duration-300" alt={p.name} />
                      <div className="absolute bottom-2 right-2 scale-90 origin-bottom-right">
                        <VendorBadge isVerified={p.vendor_status === 'approved'} planType={plan} type={p.vendor?.role === 'garage' ? 'garage' : 'vendor'} />
                      </div>
                    </Link>

                    {/* 🔴 Le padding du contenu est réduit (p-2.5 au lieu de p-3) */}
                    <div className="p-2.5 flex flex-col flex-1">
                      <div className={`text-[8px] sm:text-[9px] font-bold uppercase mb-1 flex items-center gap-1 truncate ${getPlanBadge(plan)}`}>
                        {plan==='premium'?<Crown size={10}/>:plan==='pro'?<Award size={10}/>:<Store size={10}/>}
                        {p.vendor_name}
                      </div>

                      <h3 className="text-[11px] sm:text-xs font-semibold text-slate-900 line-clamp-2 min-h-[2.6em] leading-snug">{p.name}</h3>

                      <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-slate-500 mt-1">
                        <span className="truncate max-w-[50%]">{p.brand || '—'}</span>•<span className="truncate max-w-[50%]">{p.model || '—'}</span>
                      </div>

                      <div className="mt-2 mb-2.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">{p.final_price.toLocaleString('fr-FR')}</span>
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-500">FCFA</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={8} className={i < Math.round(p.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                          ))}
                          <span className="text-[8px] text-slate-400 ml-1">({p.reviewsCount})</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        {/* 🔴 Bouton moins haut (h-7 ou h-8) et texte plus petit */}
                        <button
                          onClick={(e) => { e.preventDefault(); addToCart({...p, price: p.final_price }); toast.success('Ajouté au panier'); }}
                          className="w-full h-8 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        >
                          <ShoppingCart size={13}/> Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}