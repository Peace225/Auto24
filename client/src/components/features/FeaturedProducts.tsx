import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Heart, ShoppingCart, Star, Store, Crown, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../../utils/pricing';
import VendorBadge from '../features/VendorBadge';

export default function FeaturedProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToCart = useCartStore((state) => state.addToCart);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadFeatured = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *, 
          vendor:profiles!vendor_id (
            store_name, 
            role, 
            status, 
            subscription_plan
          ), 
          reviews (rating)
        `)
        .eq('status', 'approved')
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) throw error;

      const formatted = (data || []).map(item => {
        const avg = item.reviews?.length ? item.reviews.reduce((a: number, c: any) => a + c.rating, 0) / item.reviews.length : 0;
        const isAdmin = item.vendor?.role === 'admin';

        // 🟢 NOUVEAUTÉ ICI : Si c'est l'admin, on force "premium", sinon on prend le plan du vendeur
        const activePlan = isAdmin ? 'premium' : (item.vendor?.subscription_plan || 'standard');

        let img = 'https://placehold.co/300x300/e2e8f0/94a3b8?text=No+Image';
        try {
          const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
          if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]) img = imgs[0];
          else if (item.image_url) img = item.image_url;
        } catch (e) { if (item.image_url) img = item.image_url; }

        return {
          ...item,
          final_price: getPublicPrice(item.price || 0),
          image: img,
          vendor_name: isAdmin ? 'SPACEAUTO' : (item.vendor?.store_name || 'Boutique'),
          // 🟢 L'admin est considéré comme "approved" par défaut pour forcer l'affichage de son badge
          vendor_status: isAdmin ? 'approved' : (item.vendor?.status || 'standard'),
          vendor_plan: activePlan.toLowerCase(), 
          avgRating: avg,
          reviewsCount: item.reviews?.length || 0
        };
      });

      setProducts(formatted);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement des produits");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    if (user) {
      supabase.from('favorites').select('product_id').eq('user_id', user.id)
        .then(({ data }) => setFavorites(data?.map(f => f.product_id) || []));
    }

    const productsChannel = supabase.channel('public-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadFeatured(true))
      .subscribe();

    const profilesChannel = supabase.channel('public-profiles-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadFeatured(true))
      .subscribe();

    return () => { 
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  const toggleFav = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(x => x !== id) : [...prev, id]);
    if (isFav) await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
    else await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
  };

  const getCardStyle = (plan?: string) => {
    switch (plan) {
      case 'premium':
        return 'bg-gradient-to-b from-[#FFFBF0] to-white border-amber-200 hover:border-amber-400 hover:shadow-amber-500/15';
      case 'pro':
        return 'bg-gradient-to-b from-[#F0F5FF] to-white border-blue-200 hover:border-blue-400 hover:shadow-blue-500/15';
      default:
        return 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-slate-300/50';
    }
  };

  const getStoreTextColor = (plan?: string) => {
    switch (plan) {
      case 'premium': return 'text-amber-600';
      case 'pro': return 'text-blue-600';
      default: return 'text-slate-500';
    }
  };

  const renderStoreIcon = (plan?: string) => {
    switch (plan) {
      case 'premium': return <Crown size={10} className="opacity-80" />;
      case 'pro': return <Award size={10} className="opacity-80" />;
      default: return <Store size={10} className="opacity-80" />;
    }
  };

  return (
    <section className="bg-[#F8FAFC] py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">
            Catalogue <span className="text-blue-600">Validé</span>
          </h2>
          <Link to="/catalog" className="text-xs font-bold uppercase flex items-center gap-1 text-slate-600 hover:text-black">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.map(p => {
              const plan = p.vendor_plan;

              return (
                <div key={p.id} className={`rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${getCardStyle(plan)}`}>
                  <div className="relative aspect-square bg-white/60">
                    <button onClick={(e) => toggleFav(p.id, e)} className="absolute top-2 left-2 z-10 p-1.5 bg-white/90 rounded-full shadow-sm hover:scale-110 transition">
                      <Heart size={14} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                    </button>
                    
                    <div className="absolute top-2 right-2 z-10">
                      <VendorBadge 
                          isVerified={p.vendor_status === 'approved'} 
                          planType={plan} 
                          type={p.vendor?.role === 'garage' ? 'garage' : 'vendor'} 
                      />
                    </div>

                    <Link to={`/product/${p.id}`} className="block w-full h-full p-2">
                      <img src={p.image} className="w-full h-full object-contain mix-blend-darken" alt={p.name} />
                    </Link>
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <div className={`text-[9px] font-black uppercase mb-1 flex items-center gap-1 truncate ${getStoreTextColor(plan)}`}>
                      {renderStoreIcon(plan)}
                      <span>{p.vendor_name}</span>
                    </div>

                    <h3 className="text-[11px] font-bold text-slate-900 line-clamp-2 min-h-[2.5em] mb-2">{p.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] mb-3 text-slate-500 font-medium">
                      <div className="truncate"><b className="text-slate-400">Marque:</b> {p.brand || '-'}</div>
                      <div className="truncate"><b className="text-slate-400">Modèle:</b> {p.model || '-'}</div>
                      <div className="truncate"><b className="text-slate-400">Réf:</b> {p.reference || '-'}</div>
                      <div className="truncate"><b className="text-slate-400">État:</b> {p.condition || 'Neuf'}</div>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < Math.round(p.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                      ))}
                      <span className="text-[9px] text-slate-400 ml-1">({p.reviewsCount})</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-900/5">
                      <span className="text-sm font-black text-slate-900">
                        {p.final_price.toLocaleString('fr-FR')} <span className="text-[9px] font-normal text-slate-500">CFA</span>
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); addToCart({...p, price: p.final_price }); toast.success('Ajouté'); }}
                        className="w-7 h-7 bg-slate-900 rounded-lg grid place-items-center hover:bg-blue-600 transition"
                      >
                        <ShoppingCart size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}