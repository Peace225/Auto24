import { useEffect, useState, useRef } from 'react';
import { Loader2, Heart, ShoppingCart, Star, Store, Crown, Award, Zap, Sparkles, PackageCheck, AlertCircle } from 'lucide-react';
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

        let compat = item.compatibility || '';
        if (Array.isArray(item.compatibility)) compat = item.compatibility.join(', ');

        return {
          ...item,
          final_price: getPublicPrice(item.price || 0),
          image: img,
          vendor_name: isAdmin ? 'SPACEAUTO' : (item.vendor?.store_name || 'Boutique'),
          vendor_status: isAdmin ? 'approved' : (item.vendor?.status || 'standard'),
          vendor_plan: activePlan.toLowerCase(),
          avgRating: avg,
          reviewsCount: item.reviews?.length || 0,
          compatibility_text: compat,
          safe_reference: item.reference || item.oem_reference || 'N/A',
          safe_model: item.model || item.vehicle_model || 'Générique',
          safe_stock: item.stock !== undefined ? item.stock : (item.stock_quantity || 0),
          safe_condition: item.condition || 'Neuf',
          safe_year: item.year || ''
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
            <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
              <Sparkles className="text-white" size={20} />
            </div>
            <h2 className="font-black text-white text-lg sm:text-xl tracking-tight uppercase truncate">
              Offres <span className="text-fuchsia-200">Sponsorisées</span>
            </h2>
            <span className="hidden md:flex ml-auto text-[10px] font-black text-purple-700 bg-white px-3 py-1.5 rounded-full uppercase tracking-widest items-center gap-1 shadow-sm shrink-0">
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
                const isOutOfStock = p.safe_stock <= 0;
                const isConditionNeuf = p.safe_condition?.toLowerCase().includes('neuf');

                return (
                  // Ajustement de la largeur pour mobile
                  <div key={p.id} className="w-[150px] sm:w-[160px] md:w-[180px] flex-shrink-0 snap-start group relative bg-white rounded-2xl border-2 border-purple-100 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col transform hover:-translate-y-1">
                    
                    <div className="absolute top-2 left-2 z-20">
                      <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                        <Zap size={8} fill="currentColor" /> À la une
                      </span>
                    </div>

                    <button onClick={(e) => toggleFav(p.id, e)} className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm hover:scale-110 transition border border-purple-50">
                      <Heart size={12} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                    </button>

                    <Link to={`/product/${p.id}`} className="relative block aspect-square p-3 bg-gradient-to-b from-purple-50/50 to-white rounded-t-2xl">
                      <img src={p.image} className={`w-full h-full object-contain mix-blend-darken transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} alt={p.name} />
                      <div className="absolute bottom-2 right-2 scale-90 origin-bottom-right">
                        <VendorBadge isVerified={p.vendor_status === 'approved'} planType={plan} type={p.vendor?.role === 'garage' ? 'garage' : 'vendor'} />
                      </div>
                    </Link>

                    <div className="p-2 sm:p-2.5 flex flex-col flex-1">
                      <div className={`text-[8px] sm:text-[9px] font-bold uppercase mb-1 flex items-center gap-1 truncate ${getPlanBadge(plan)}`}>
                        {plan==='premium'?<Crown size={10} className="shrink-0"/>:plan==='pro'?<Award size={10} className="shrink-0"/>:<Store size={10} className="shrink-0"/>}
                        <span className="truncate">{p.vendor_name}</span>
                      </div>

                      <h3 className="text-[10px] sm:text-xs font-semibold text-slate-900 line-clamp-2 min-h-[2.6em] leading-snug" title={p.name}>{p.name}</h3>

                      {/* --- ÉTAT & STOCK (Responsive) --- */}
                      <div className="flex flex-wrap items-center justify-between gap-1 mt-1.5">
                        <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md truncate max-w-[55%] ${isConditionNeuf ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`} title={p.safe_condition}>
                          {p.safe_condition}
                        </span>
                        <span className={`text-[7px] sm:text-[8px] font-black uppercase flex items-center gap-0.5 shrink-0 ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                          {isOutOfStock ? <AlertCircle size={8} /> : <PackageCheck size={8} />}
                          {isOutOfStock ? 'Rupture' : `${p.safe_stock} Dispo`}
                        </span>
                      </div>

                      {/* --- MARQUE, MODÈLE, ANNÉE, RÉFÉRENCE (Responsive) --- */}
                      <div className="flex flex-col gap-0.5 text-[7px] sm:text-[8px] text-slate-500 mt-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1 truncate w-full">
                          <span className="font-bold text-slate-700 truncate" title={p.brand}>{p.brand || '—'}</span>
                          <span>•</span>
                          <span className="truncate" title={`${p.safe_model} ${p.safe_year}`}>
                            {p.safe_model} {p.safe_year ? `(${p.safe_year})` : ''}
                          </span>
                        </div>
                        <div className="truncate w-full text-[7px] text-slate-400" title={`Réf: ${p.safe_reference}`}>
                          Réf: {p.safe_reference}
                        </div>
                      </div>

                      {/* --- COMPATIBILITÉ --- */}
                      {p.compatibility_text && (
                        <div className="mt-1.5 text-[7px] sm:text-[8px] text-slate-600 line-clamp-1 border-t border-slate-100 pt-1" title={p.compatibility_text}>
                          <span className="font-bold text-slate-800">Comp. :</span> {p.compatibility_text}
                        </div>
                      )}

                      <div className="mt-2 mb-2.5">
                        <div className="flex items-baseline gap-1 truncate w-full">
                          <span className="text-[11px] sm:text-[13px] font-black text-slate-900 tracking-tight">{p.final_price.toLocaleString('fr-FR')}</span>
                          <span className="text-[7px] sm:text-[8px] font-bold text-slate-500 shrink-0">FCFA</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={7} className={i < Math.round(p.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                          ))}
                          <span className="text-[7px] text-slate-400 ml-1 shrink-0">({p.reviewsCount})</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <button
                          disabled={isOutOfStock}
                          onClick={(e) => { e.preventDefault(); addToCart({...p, price: p.final_price }); toast.success('Ajouté au panier'); }}
                          className={`w-full h-7 sm:h-8 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                            isOutOfStock 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-[#2563EB] hover:bg-blue-700 text-white active:scale-95'
                          }`}
                        >
                          <ShoppingCart size={12}/> {isOutOfStock ? 'Indisponible' : 'Ajouter'}
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