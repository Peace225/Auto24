import { useEffect, useState } from 'react';
import {
  ArrowRight, Loader2, Store, CheckCircle2, Heart, TrendingUp,
  ShoppingCart, Star, CarFront, Hash, MapPin
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../../utils/pricing'; // 🟢 1. Import de la fonction globale

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
        const avgRating = totalReviews > 0 ? reviewsArray.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / totalReviews : 0;
        const vendorPlan = item.vendor?.subscription_plan || 'free';
        const vendorRole = item.vendor?.role || 'vendor';

        // 🟢 2. Calcul du prix final avec la fonction globale (Paliers dynamiques)
        const basePrice = item.price || 0;
        const finalPrice = getPublicPrice(basePrice, vendorRole);

        return {
          ...item,
          final_price: finalPrice, 
          original_price: basePrice,
          image: item.image_url || item.image || 'https://via.placeholder.com/400?text=Sans+Image',
          vendor_name: item.vendor?.store_name || 'Boutique Partenaire',
          vendor_commune: item.vendor?.commune || 'Abidjan',
          vendor_plan: vendorPlan,
          vendor_role: vendorRole,
          avgRating: avgRating,
          totalReviews: totalReviews
        };
      });

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

  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      navigate('/login');
      return;
    }

    const isFavorited = favorites.includes(productId);

    setFavorites(prev =>
      isFavorited ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      }
    } catch (error) {
      setFavorites(prev => isFavorited ? [...prev, productId] : prev.filter(id => id !== productId));
      toast.error("Une erreur est survenue");
    }
  };

  const VendorBadge = ({ name, role }: { name: string, role: string }) => {
    const isAdmin = role === 'admin' || role === 'super_admin';
    return (
      <div className={`absolute top-2 right-2 z-20 px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 shadow-sm
        ${isAdmin ? 'bg-blue-900/90 text-blue-400 border-blue-500/30' : 'bg-white/90 text-slate-700 border-slate-200'}`}>
        {isAdmin ? <CheckCircle2 size={10} /> : <Store size={10} className="text-blue-600" />}
        <span className="truncate max-w-[70px]">{name}</span>
      </div>
    );
  };

  return (
    <section className="bg-[#F8FAFC] py-16 md:py-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER LOGO-STYLE */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">
              <TrendingUp size={14} />
              <span>Selection Premium Abidjan</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
              Le Meilleur <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
                du catalogue
              </span>
            </h2>
          </div>
          
          <Link to="/catalog" className="group bg-slate-900 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white hover:bg-blue-600 transition-all duration-500 shadow-2xl shadow-slate-900/20 flex items-center gap-3 w-fit active:scale-95">
            Voir tout le stock 
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Synchronisation...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((product) => {
              const basePrice = product.original_price;
              const finalPrice = product.final_price;

              return (
                <div key={product.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group relative h-full">
                  
                  {/* BOUTON FAVORI */}
                  <button
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-2 left-2 z-30 p-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-100 hover:scale-110 active:scale-90 transition-all duration-300"
                  >
                    <Heart
                      size={14}
                      className={`transition-all duration-500 ${
                        favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-300 group-hover:text-red-400'
                      }`}
                    />
                  </button>

                  <VendorBadge name={product.vendor_name} role={product.vendor_role} />
                  
                  {/* IMAGE */}
                  <Link to={`/product/${product.id}`} className="relative h-40 md:h-52 bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
                    <img src={product.image} className="max-h-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                  </Link>

                  {/* CONTENU DE LA CARTE INLINE */}
                  <div className="p-4 md:p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[100px]">
                        {product.brand || 'Premium'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[9px] font-black text-slate-700">{product.avgRating.toFixed(1)}</span>
                      </div>
                    </div>

                    <h3 className="text-[11px] font-[1000] text-slate-900 uppercase line-clamp-2 mb-3 leading-tight">
                      {product.name}
                    </h3>

                    <div className="space-y-1 mb-4 mt-auto">
                      <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <CarFront size={10} className="text-slate-300 shrink-0" /> Modèle: <span className="text-slate-600 truncate">{product.model || 'Standard'}</span>
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Hash size={10} className="text-slate-300 shrink-0" /> Réf: <span className="text-slate-600 font-mono tracking-tighter">{product.reference || 'REF-AUTO'}</span>
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        {/* 🟢 3. Affichage du prix d'origine barré s'il y a une commission */}
                        {basePrice !== finalPrice && (
                          <span className="text-[8px] text-slate-300 line-through font-bold mb-0.5">
                            {basePrice.toLocaleString()} CFA
                          </span>
                        )}
                        <p className="text-sm md:text-xl font-[1000] text-slate-900 italic tracking-tighter uppercase leading-none">
                          {finalPrice.toLocaleString()} <span className="text-[9px] text-blue-600 not-italic font-black">CFA</span>
                        </p>
                      </div>
                      
                      {/* 🟢 AJOUT AU PANIER AVEC PRIX FINAL SÉCURISÉ */}
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          addToCart({ ...product, price: finalPrice, original_price: basePrice }); 
                          toast.success("Ajouté au panier");
                        }}
                        className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                      >
                        <ShoppingCart size={16} />
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