import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import {
  ArrowRight, Loader2,
  Store, CheckCircle2, Heart, TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function FeaturedProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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

        let commissionRate = 0.10;
        if (vendorRole === 'admin') commissionRate = 0;
        else if (vendorPlan === 'premium') commissionRate = 0.01;
        else if (vendorPlan === 'pro') commissionRate = 0.05;

        const basePrice = item.price || 0;
        const finalPrice = Math.round(basePrice + (basePrice * commissionRate));

        return {
          ...item,
          price: finalPrice,
          original_price: basePrice,
          image: item.image_url || item.image || 'https://via.placeholder.com/400?text=Sans+Image',
          vendor_name: item.vendor?.store_name || 'Boutique Partenaire',
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
      isFavorited
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
        toast.success("Retiré des favoris");
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
        toast.success("Ajouté aux favoris !");
      }
    } catch (error) {
      setFavorites(prev => isFavorited ? [...prev, productId] : prev.filter(id => id !== productId));
      toast.error("Une erreur est survenue");
    }
  };

  const VendorBadge = ({ plan, name, role }: { plan: string, name: string, role: string }) => {
    if (role === 'admin' || role === 'super_admin') return (
      <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-blue-900 to-slate-900 text-blue-400 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl border border-blue-500/30 backdrop-blur-sm">
        <CheckCircle2 size={10} className="text-blue-400" /> OFFICIEL
      </div>
    );
    return (
      <div className="absolute top-2 right-2 z-20 bg-white/95 backdrop-blur-md text-slate-700 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border border-slate-200 shadow-sm flex items-center gap-1.5">
        <Store size={10} className="text-blue-600" /> 
        <span className="truncate max-w-[60px] md:max-w-[100px]">{name}</span>
      </div>
    );
  };

  return (
    <section className="bg-slate-50/50 py-16 md:py-28 overflow-hidden">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {products.map((product) => (
              <div key={product.id} className="relative group perspective-1000">
                {/* FAVORITE BUTTON */}
                <button
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className="absolute top-2 left-2 z-30 p-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-100 hover:scale-110 active:scale-90 transition-all duration-300 group/heart"
                >
                  <Heart
                    size={15}
                    className={`transition-all duration-500 ${
                      favorites.includes(product.id) 
                        ? 'fill-red-500 text-red-500 scale-110' 
                        : 'text-slate-400 group-hover/heart:text-red-400'
                    }`}
                  />
                </button>

                <VendorBadge 
                  plan={product.vendor_plan} 
                  name={product.vendor_name} 
                  role={product.vendor_role} 
                />
                
                <div className="transition-all duration-500 hover:translate-y-[-8px]">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}