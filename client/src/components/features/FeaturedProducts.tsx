import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { 
  ArrowRight, Sparkles, TrendingUp, Loader2, 
  PackageOpen, Star, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { supabase } from '../../lib/supabase';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeatured = async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      // A. Récupération des données locales (Fallback)
      const localData = await productService.getProducts();

      // B. Récupération Supabase avec jointure explicite
      const { data: supabaseData, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles!vendor_id (store_name, commune),
          reviews (rating) 
        `)
        .eq('status', 'approved')
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // C. 🟢 FORMATAGE SÉCURISÉ
      const formattedSupabaseData = (supabaseData || []).map((item) => {
        // Sécurité : on s'assure que reviews est au moins un tableau vide
        const reviewsArray = item.reviews || [];
        const totalReviews = reviewsArray.length;
        
        // Calcul de la moyenne avec sécurité Division par Zéro
        const avgRating = totalReviews > 0 
          ? reviewsArray.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / totalReviews 
          : 0;

        return {
          ...item,
          image: item.image_url || item.image || 'https://via.placeholder.com/400?text=Sans+Image',
          vendor_name: item.vendor?.store_name || 'Boutique Partenaire',
          avgRating: avgRating, // On injecte la moyenne calculée
          totalReviews: totalReviews // On injecte le nombre total
        };
      });

      // D. Fusion : Les données Supabase écrasent ou complètent le local
      const combinedData = [...formattedSupabaseData, ...localData];
      
      // E. Tri par Boosted
      const sortedItems = combinedData.sort((a, b) => {
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

    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadFeatured(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, () => loadFeatured(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 🟢 Helper de rendu des étoiles (Plus robuste)
  const RenderStars = ({ rating }: { rating: number }) => {
    const roundedRating = Math.round(rating || 0);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            size={10} 
            className={`${s <= roundedRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <section className="bg-slate-50/50 py-12 md:py-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
              <TrendingUp className="w-4 h-4" />
              <span>Expertise Automobile Abidjan</span>
            </div>
            <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
              Le Meilleur <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                du catalogue
              </span>
            </h2>
          </div>

          <Link 
            to="/catalog" 
            className="group flex items-center justify-center gap-3 bg-slate-900 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white hover:bg-blue-600 transition-all shadow-xl"
          >
            Voir tout le stock
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {/* GRILLE PRODUITS */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col h-full group">
                <div className="relative flex-1">
                  {/* Badge Confiance (Affiché si note >= 4) */}
                  {(product.avgRating >= 4) && (
                    <div className="absolute top-3 left-3 z-20 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg animate-in fade-in zoom-in">
                      <ShieldCheck className="w-3 h-3" /> Certifié
                    </div>
                  )}
                  
                  <ProductCard product={product} />
                </div>

                {/* 🟢 BLOC NOTATION (Juste sous la carte) */}
                <div className="mt-3 px-2 flex items-center justify-between min-h-[20px]">
                  {product.totalReviews > 0 ? (
                    <>
                      <RenderStars rating={product.avgRating} />
                      <span className="text-[9px] font-black text-slate-400 uppercase">
                        {product.totalReviews} avis
                      </span>
                    </>
                  ) : (
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">
                      Aucune note pour le moment
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}