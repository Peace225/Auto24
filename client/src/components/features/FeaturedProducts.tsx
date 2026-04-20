import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { ArrowRight, Sparkles, TrendingUp, Loader2, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { supabase } from '../../lib/supabase'; // 🟢 Import de supabase pour le Realtime
import type { Product } from '../../types';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fonction pour charger les données (extraite pour être réutilisable)
  const loadFeatured = async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts();
      
      const boostedItems = data.filter(p => p.is_boosted);
      const itemsToDisplay = boostedItems.length > 0 
        ? boostedItems.slice(0, 4) 
        : data.slice(0, 4);
      
      setProducts(itemsToDisplay);
    } catch (error) {
      console.error("Erreur lors du chargement des produits à la une:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 2. Chargement initial
    loadFeatured();

    // 3. 🟢 LOGIQUE REALTIME : Écouter les nouveautés dans la base de données
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // On écoute uniquement les nouveaux produits insérés
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Un nouveau produit a été détecté !', payload);
          // 4. Si un produit est inséré (et qu'il est potentiellement 'approved' grâce à ton form),
          // on recharge silencieusement la liste pour le faire apparaître instantanément.
          // On ne remet pas setIsLoading(true) pour éviter que ça clignote.
          loadFeaturedSilently();
        }
      )
      .subscribe();

    // Fonction de rechargement "silencieux" pour le realtime
    const loadFeaturedSilently = async () => {
        try {
          const data = await productService.getProducts();
          const boostedItems = data.filter(p => p.is_boosted);
          const itemsToDisplay = boostedItems.length > 0 
            ? boostedItems.slice(0, 4) 
            : data.slice(0, 4);
          
          setProducts(itemsToDisplay);
        } catch (error) {
           // On ignore silencieusement
        }
    };

    // 5. Nettoyage de l'abonnement quand on quitte la page
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="bg-slate-50/50 py-12 md:py-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- HEADER STYLE LUXE --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div className="relative">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-3 md:mb-4">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Sélection Premium Abidjan</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Produits <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                à la une
              </span>
            </h2>
            
            <div className="mt-3 md:mt-4 flex items-center gap-3">
               <div className="hidden sm:block h-1 w-12 bg-blue-600 rounded-full" />
               <p className="text-slate-500 text-xs sm:text-sm md:text-lg font-medium italic">
                 {isLoading ? "Recherche des meilleures offres..." : "Les dernières pépites de nos vendeurs partenaires"}
               </p>
            </div>
          </div>

          <Link 
            to="/catalog" 
            className="group flex items-center justify-center md:justify-start gap-3 bg-white border border-slate-200 px-6 py-3.5 md:px-8 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm hover:shadow-xl active:scale-95 w-full md:w-auto"
          >
            Voir tout le catalogue 
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {/* --- ÉTAT DE CHARGEMENT --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Mise à jour du stock...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <PackageOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Le showroom est en cours de préparation.
            </p>
          </div>
        ) : (
          /* --- GRILLE DE PRODUITS --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in duration-700">
            {products.map((product) => (
              <div key={product.id} className="relative group h-full">
                 <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 bg-white/90 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1 rounded-full border border-white shadow-sm flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Sparkles className={`w-3 h-3 ${product.is_boosted ? 'text-orange-500' : 'text-blue-500'}`} />
                    <span className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                      {product.is_boosted ? "Coup de cœur" : "Nouveau"}
                    </span>
                 </div>
                 <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
        
        {/* BANNIÈRE DE RÉASSURANCE MOBILE */}
        <div className="mt-8 md:hidden bg-blue-600 p-6 rounded-[2rem] text-center text-white shadow-lg">
           <p className="font-bold text-sm mb-4 leading-snug">Livraison rapide sur tout Abidjan en 24h/48h</p>
           <Link to="/catalog" className="inline-block w-full bg-white text-blue-600 px-6 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-md">
              Explorer les pièces
           </Link>
        </div>

      </div>
    </section>
  );
}