import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import { ShoppingCart, Loader2, ChevronRight, LayoutGrid, ArrowLeft } from 'lucide-react';
import type { Product, Category } from '../types';

// Scan global des images avec typage strict
const allImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  import: 'default' 
}) as Record<string, string>;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search'); 
  
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(false);
      try {
        // 1. Récupération de la catégorie
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (catError || !catData) {
          setError(true);
          return;
        }
        setCategory(catData);

        // 2. Construction de la requête produits
        let query = supabase
          .from('products')
          .select('*')
          .eq('category_id', catData.id);

        if (searchQuery && searchQuery.trim() !== '') {
          const cleanSearch = searchQuery.trim().replace(/\s+/g, '%');
          query = query.ilike('name', `%${cleanSearch}%`);
        }

        const { data: prodData, error: prodError } = await query;
        if (prodError) throw prodError;
        
        setProducts(prodData || []);
      } catch (err) {
        console.error("Erreur de chargement SpaceAuto24:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, searchQuery]);

  // Optimisation de la recherche d'image
  const getProductImage = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    
    // Extraction du nom de fichier sans extension
    const fileName = imagePath.split('/').pop()?.toLowerCase().replace(/\.[^/.]+$/, "").trim();
    if (!fileName) return null;

    const matchingKey = Object.keys(allImages).find(key => {
      const assetFileName = key.split('/').pop()?.toLowerCase().replace(/\.[^/.]+$/, "").trim();
      return assetFileName === fileName;
    });

    return matchingKey ? allImages[matchingKey] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chargement de l'univers...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h2 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Rayon introuvable</h2>
        <p className="text-slate-500 mt-4 font-medium">Ce secteur technique n'est pas encore répertorié.</p>
        <Link to="/" className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/10">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* HEADER PREMIUM */}
      <div className="bg-white border-b border-slate-100 pt-32 pb-16">
        <div className="max-w-[1440px] mx-auto px-6">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
            <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-blue-600">{category.name}</span>
          </nav>
          
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.8] mb-6">
            {searchQuery ? searchQuery : category.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-blue-600"></span>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
              {products.length} Pièces certifiées disponibles
            </p>
          </div>
        </div>
      </div>

      {/* GRILLE PRODUITS XXL */}
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
            <LayoutGrid className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h2 className="text-xl font-black text-slate-900 uppercase">Stock épuisé</h2>
            <p className="text-slate-400 mt-2 mb-10 font-medium italic">Aucun résultat pour cette recherche dans ce rayon.</p>
            <Link to="/" className="inline-flex items-center gap-3 bg-slate-50 text-slate-900 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">
              <ArrowLeft className="w-4 h-4" /> Explorer d'autres rayons
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
            {products.map((product) => {
              const imgSrc = getProductImage(product.image_url);
              return (
                <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-5 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group flex flex-col">
                  <Link to={`/product/${product.id}`} className="block mb-6 relative">
                    <div className="aspect-square bg-slate-50 rounded-[2rem] flex items-center justify-center p-8 overflow-hidden group-hover:bg-white transition-colors duration-500 border border-transparent group-hover:border-slate-100">
                      {imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={product.name}
                          className="max-h-full w-auto object-contain group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="text-[8px] text-slate-300 font-black text-center uppercase tracking-widest opacity-50">
                          No Visual<br/>{product.brand}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-grow px-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                        {product.brand || 'Original'}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors line-clamp-2 h-10 uppercase">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-auto px-2 pt-5 border-t border-slate-50">
                    <div className="flex flex-col">
                      <p className="text-xl font-black text-slate-900 leading-none">
                        {(product.price || 0).toLocaleString()}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FCFA</span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-90"
                      aria-label="Ajouter au panier"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}