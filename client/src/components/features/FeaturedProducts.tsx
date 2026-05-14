import { useEffect, useState } from 'react';
import {
  ArrowRight, Loader2, Store, CheckCircle2, Heart, TrendingUp,
  ShoppingCart, Star, CarFront, Hash
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../../utils/pricing';

export default function FeaturedProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToCart = useCartStore((state) => state.addToCart);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // --- CHARGEMENT DES PRODUITS ---
  const loadFeatured = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data: supabaseData, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles!vendor_id (store_name, commune, subscription_plan, role),
          reviews (rating)
        `)
        .eq('status', 'approved')
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (supabaseData || []).map((item) => {
        const reviewsArray = item.reviews || [];
        const totalReviews = reviewsArray.length;
        const avgRating = totalReviews > 0 
          ? reviewsArray.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / totalReviews 
          : 0;
        
        const rawPlan = item.vendor?.subscription_plan;
        const vendorPlan = (rawPlan === 'none' || !rawPlan) ? 'standard' : rawPlan;
        const vendorRole = item.vendor?.role || 'vendor';

        // Calcul du prix selon les règles métier (TVA/Commission)
        const basePrice = item.price || 0;
        const finalPrice = getPublicPrice(basePrice, vendorRole);

        return {
          ...item,
          final_price: finalPrice, 
          original_price: basePrice,
          image: item.image_url || item.image || 'https://placehold.co/400x400/f8fafc/94a3b8?text=Sans+Image',
          vendor_name: item.vendor?.store_name || 'Boutique Partenaire',
          vendor_commune: item.vendor?.commune || 'Abidjan',
          vendor_plan: vendorPlan,
          vendor_role: vendorRole,
          avgRating: avgRating,
          totalReviews: totalReviews
        };
      });

      // Priorité aux produits boostés
      setProducts(formattedData.sort((a, b) => (b.is_boosted ? 1 : 0) - (a.is_boosted ? 1 : 0)));
    } catch (error) {
      console.error("Erreur chargement produits:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    if (user) {
      supabase.from('favorites').select('product_id').eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setFavorites(data.map(f => f.product_id));
        });
    }
  }, [user]);

  // --- GESTION DES FAVORIS ---
  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      navigate('/login');
      return;
    }

    const isFavorited = favorites.includes(productId);
    setFavorites(prev => isFavorited ? prev.filter(id => id !== productId) : [...prev, productId]);

    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour des favoris");
    }
  };

  // --- COMPOSANT BADGE ---
  const VendorBadge = ({ name, role, plan }: { name: string, role: string, plan: string }) => {
    const isAdmin = role === 'admin' || role === 'super_admin';
    let style = "bg-white/95 text-slate-700 border-slate-200 shadow-sm";
    let showCert = false;

    if (isAdmin) {
      style = "bg-slate-900 text-blue-400 border-blue-500/30";
      showCert = true;
    } else if (plan === 'premium') {
      style = "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white border-amber-300/50 shadow-amber-500/20";
      showCert = true;
    } else if (plan === 'pro') {
      style = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/50 shadow-blue-500/20";
      showCert = true;
    }

    return (
      <div className={`absolute top-2 right-2 z-20 px-2 py-1 rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 shadow-md ${style}`}>
        <Store size={10} className={isAdmin ? "text-blue-400" : (plan === 'standard' ? "text-blue-600" : "text-white/80")} />
        <span className="truncate max-w-[65px] md:max-w-[90px]">{name}</span>
        {showCert && <CheckCircle2 size={9} className={isAdmin ? "text-blue-400" : "text-white"} />}
      </div>
    );
  };

  // --- THEME DES CARTES ---
  const getCardTheme = (plan: string, role: string) => {
    if (role === 'admin' || role === 'super_admin') return 'border-blue-500/20 shadow-blue-500/5 hover:border-blue-500/50';
    if (plan === 'premium') return 'border-amber-500/30 shadow-amber-500/10 hover:border-amber-500 ring-1 ring-amber-500/5';
    if (plan === 'pro') return 'border-blue-600/20 shadow-blue-600/10 hover:border-blue-600/50';
    return 'border-slate-100 shadow-sm hover:border-slate-300';
  };

  return (
    <section className="bg-[#F8FAFC] py-12 md:py-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-5 md:gap-8">
          <div className="space-y-2 md:space-y-4">
            <div className="flex items-center gap-2 text-blue-600 font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em]">
              <TrendingUp size={12} />
              <span>Sélection Certifiée Abidjan</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
              Le Meilleur <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">du catalogue</span>
            </h2>
          </div>
          
          <Link to="/catalog" className="group bg-slate-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] text-white hover:bg-blue-600 transition-all duration-500 shadow-xl flex items-center justify-center gap-3 w-full md:w-fit active:scale-95">
            Voir tout le stock 
            <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Synchronisation avec Supabase...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((product) => {
              const cardStyles = getCardTheme(product.vendor_plan, product.vendor_role);

              return (
                <div key={product.id} className={`bg-white rounded-2xl border ${cardStyles} transition-all duration-500 overflow-hidden flex flex-col group relative h-full`}>
                  
                  {/* BOUTON FAVORI */}
                  <button
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-2 left-2 z-30 p-2 md:p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md border border-slate-100 hover:scale-110 active:scale-90 transition-all"
                  >
                    <Heart size={12} className={favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'} />
                  </button>

                  <VendorBadge name={product.vendor_name} role={product.vendor_role} plan={product.vendor_plan} />
                  
                  {/* IMAGE PRODUIT */}
                  <Link to={`/product/${product.id}`} className="relative aspect-square bg-slate-50/50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    <img 
                      src={product.image} 
                      className="w-full h-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-700" 
                      alt={product.name} 
                    />
                    {product.vendor_plan === 'premium' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
                    )}
                  </Link>

                  {/* DETAILS */}
                  <div className="p-3 md:p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border truncate max-w-[80px]
                        ${product.vendor_plan === 'premium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {product.brand || 'Premium'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        <span className="text-[8px] md:text-[9px] font-black text-slate-700">{product.avgRating.toFixed(1)}</span>
                      </div>
                    </div>

                    <h3 className="text-[10px] md:text-[11px] font-[1000] text-slate-900 uppercase line-clamp-2 mb-2 leading-tight min-h-[2rem]">
                      {product.name}
                    </h3>

                    <div className="space-y-0.5 mb-4 mt-auto">
                      <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <CarFront size={8} className="text-slate-300" /> <span className="text-slate-600 truncate">{product.model || 'Standard'}</span>
                      </p>
                      <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Hash size={8} className="text-slate-300" /> <span className="text-slate-600 font-mono">{product.reference || 'REF-AUTO'}</span>
                      </p>
                    </div>

                    {/* PRIX ET ACTION */}
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <p className="text-sm md:text-lg font-black text-slate-900 tracking-tighter uppercase">
                        {product.final_price.toLocaleString()} <span className="text-[7px] md:text-[8px] text-blue-600">CFA</span>
                      </p>
                      
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          addToCart({ ...product, price: product.final_price }); 
                          toast.success("Produit ajouté au panier");
                        }}
                        className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all shadow-md active:scale-95 text-white
                          ${product.vendor_plan === 'premium' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-blue-600'}`}
                      >
                        <ShoppingCart size={12} />
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