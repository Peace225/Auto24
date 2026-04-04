import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import { ShoppingCart, Loader2, ChevronRight, LayoutGrid, ArrowLeft } from 'lucide-react';
import type { Product, Category } from '../types';

// 1. Scan global des dossiers d'images
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
      setIsLoading(true);
      setError(false);
      try {
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

        let query = supabase
          .from('products')
          .select('*')
          .eq('category_id', catData.id);

        if (searchQuery) {
          const cleanSearch = searchQuery.trim().replace(/\s+/g, '%');
          query = query.ilike('name', `%${cleanSearch}%`);
        }

        const { data: prodData, error: prodError } = await query;
        if (prodError) throw prodError;
        
        setProducts(prodData || []);
      } catch (err) {
        console.error("Erreur de chargement:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchCategoryData();
  }, [slug, searchQuery]);

  const getProductImage = (imagePath: string | undefined) => {
    if (!imagePath) return null;
    const cleanSearchName = imagePath.split('/').pop()?.toLowerCase().replace(/\.[^/.]+$/, "").trim();
    if (!cleanSearchName) return null;

    const matchingKey = Object.keys(allImages).find(key => {
      const fileNameInAssets = key.split('/').pop()?.toLowerCase().replace(/\.[^/.]+$/, "").trim();
      return fileNameInAssets === cleanSearchName;
    });

    return matchingKey ? allImages[matchingKey] : null;
  };

  // --- SÉCURITÉS ÉCRAN DE CHARGEMENT ET ERREUR ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Empêche le rendu si la catégorie n'est pas chargée (évite la page blanche)
  if (error || !category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h2 className="text-2xl font-black text-slate-900 uppercase italic">Univers introuvable</h2>
        <Link to="/tools" className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest">
          Retour à l'atelier
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 pt-32 pb-12">
        <div className="max-w-[1440px] mx-auto px-6">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Link to="/" className="hover:text-blue-600 font-black">Accueil</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link to="/tools" className="hover:text-blue-600 font-black">Outillage</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-blue-600 font-black">{category.name}</span>
          </nav>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">
            {searchQuery ? searchQuery : category.name}
          </h1>
          <p className="text-slate-400 text-sm font-bold italic">
            {products.length} référence(s) professionnelle(s) trouvée(s)
          </p>
        </div>
      </div>

      {/* GRILLE PRODUITS */}
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
            <LayoutGrid className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-slate-900 uppercase">Aucun article</h2>
            <p className="text-slate-500 mt-2 mb-8 font-medium italic">Vérifiez vos filtres ou revenez plus tard.</p>
            <Link to="/tools" className="inline-flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Voir d'autres rayons
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const imgSrc = getProductImage(product.image_url);
              return (
                <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-5 hover:shadow-2xl transition-all group flex flex-col">
                  <Link to={`/product/${product.id}`} className="block mb-6 relative">
                    <div className="aspect-square bg-slate-50 rounded-[2rem] flex items-center justify-center p-8 overflow-hidden group-hover:bg-blue-50 transition-colors">
                      {imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={product.name}
                          className="max-h-full w-auto object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-[9px] text-slate-300 font-black text-center uppercase tracking-tighter px-4 leading-tight">
                          Image manquante<br/>({product.image_url})
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-grow px-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{product.brand}</p>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors line-clamp-2 h-10">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-auto px-2 pt-5 border-t border-slate-50">
                    <p className="text-xl font-black text-slate-900">
                      {product.price?.toLocaleString()} <small className="text-[10px] font-bold">F</small>
                    </p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-90"
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