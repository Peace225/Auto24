import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { 
  ArrowRight, TrendingUp, Loader2, 
  Crown, Store, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeatured = async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      // 🟢 On demande uniquement à Supabase (fini les doublons !)
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

        // LOGIQUE DE COMMISSION
        let commissionRate = 0.10; 
        
        if (vendorRole === 'admin') {
          commissionRate = 0; 
        } else if (vendorPlan === 'premium') {
          commissionRate = 0.01; 
        } else if (vendorPlan === 'pro') {
          commissionRate = 0.05; 
        }

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

      // Tri pour mettre les produits "boostés" en premier
      const sortedItems = formattedData.sort((a, b) => {
        const aBoost = a.is_boosted ? 1 : 0;
        const bBoost = b.is_boosted ? 1 : 0;
        return bBoost - aBoost;
      });
      
      setProducts(sortedItems);
    } catch (error) {
      console.error("Erreur fatale chargement produits:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    const channel = supabase.channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadFeatured(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, () => loadFeatured(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // 🟢 BADGES VENDEURS COMPACTS (Tailles réduites)
  const VendorBadge = ({ plan, name, role }: { plan: string, name: string, role: string }) => {
    if (role === 'admin') {
      return (
        <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-blue-900 via-slate-900 to-black text-blue-400 px-2 py-0.5 md:py-1 rounded-full text-[6.5px] md:text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-1 shadow-lg border border-blue-500/50">
          <CheckCircle2 className="w-2 md:w-3 h-2 md:h-3" /> 
          OFFICIEL
        </div>
      );
    }

    if (plan === 'premium') {
      return (
        <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-slate-900 to-black text-amber-400 px-2 py-0.5 md:py-1 rounded-full text-[6.5px] md:text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg border border-amber-500/40">
          <span className="truncate max-w-[35px] md:max-w-none">{name}</span> <Crown className="w-2 md:w-3 h-2 md:h-3 fill-amber-400" />
        </div>
      );
    }
    
    return (
      <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-md text-slate-700 px-1.5 py-0.5 md:py-1 rounded-full text-[6.5px] md:text-[7.5px] font-[1000] uppercase tracking-widest border border-slate-200 shadow-sm flex items-center gap-1">
        <Store size={7} className="md:size-9 text-slate-400" /> <span className="truncate max-w-[35px] md:max-w-none">{name}</span>
      </div>
    );
  };

  return (
    <section className="bg-slate-50/50 py-6 md:py-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION (Tailles réduites) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-12 gap-3 md:gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[7px] md:text-[9px] uppercase tracking-[0.2em] mb-1.5 md:mb-4">
              <TrendingUp className="w-2.5 h-2.5 md:w-4 md:h-4" />
              <span>Expertise Automobile Abidjan</span>
            </div>
            <h2 className="text-xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
              Le Meilleur <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                du catalogue
              </span>
            </h2>
          </div>

          <Link to="/catalog" className="group flex items-center justify-center gap-1.5 bg-slate-900 px-3.5 md:px-7 py-2.5 md:py-4 rounded-lg md:rounded-xl font-black text-[9px] md:text-[11px] uppercase tracking-widest text-white hover:bg-blue-600 transition-all shadow-xl self-start md:self-end">
            Voir tout le stock <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* GRILLE PRODUITS (2 COLONNES MOBILE) */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                <VendorBadge 
                  plan={product.vendor_plan} 
                  name={product.vendor_name} 
                  role={product.vendor_role} 
                />
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}