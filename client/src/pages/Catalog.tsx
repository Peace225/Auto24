import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Filter, Settings, AlertCircle, ShoppingCart, Loader2, 
  Heart, Star, CarFront, Hash, Store 
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { productService } from '../services/productService'; 
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../utils/pricing'; // 🟢 1. Import de la nouvelle logique centralisée
import type { Product } from '../types';

// Typage explicite pour le glob import de Vite
const allImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const CATALOG_CATEGORIES = [
  "Outillage & Atelier", "Pneumatiques", "Huiles & Filtration",
  "Pièces moteur", "Injection", "Turbo",
  "Direction / Suspension / Train", 
  "Freinage", "Distribution et Accessoires", "Embrayage et Boîte de vitesse", 
  "Démarrage électrique", "Optiques / Phares / Ampoules", "Capteurs et Sondes", 
  "Essuie-glaces et pièces", "Echappement", "Carrosserie / Vitres / Peinture", 
  "Pièces Habitacle", "Joints et Étanchéité", "Chauffage et Climatisation"
];

// 🔴 L'ancienne fonction calculateFinalPrice a été définitivement supprimée !

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Toutes les pièces';
  const searchTerm = searchParams.get('searchTerm') || '';
  
  const { user } = useAuthStore();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [certifiedOnly, setCertifiedOnly] = useState(false);

  // 1. Chargement des produits et des favoris
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getProducts({
          searchTerm: searchTerm.trim() !== '' ? searchTerm : undefined
        }); 
        setProducts(data);
      } catch (error) {
        console.error("Erreur de chargement du catalogue:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCatalog();

    if (user) {
      supabase.from('favorites')
        .select('product_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setFavorites(data.map((f: any) => f.product_id));
        });
    }
  }, [searchTerm, activeCategory, user]);

  // 2. Logique du bouton Favori
  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');

    const isFavorited = favorites.includes(productId);
    setFavorites(prev => isFavorited ? prev.filter(id => id !== productId) : [...prev, productId]);

    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      }
    } catch {
      toast.error("Erreur de synchronisation des favoris");
    }
  };

  const getImageUrl = (filename: string | null | undefined, brand: string | null | undefined) => {
    if (!filename) return `https://placehold.co/400x400/f8fafc/2563eb?text=${brand || 'Piece'}`;
    const imagePath = Object.keys(allImages).find(path => path.toLowerCase().endsWith(`/${filename.toLowerCase()}`));
    return imagePath ? allImages[imagePath] : `https://placehold.co/400x400/f8fafc/2563eb?text=${filename}`;
  };

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'Toutes les pièces') newParams.delete('category');
    else newParams.set('category', category);
    newParams.delete('searchTerm');
    setSearchParams(newParams);
    setSelectedBrands([]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const catObj = (product as any).categories;
      const catName: string = typeof catObj === 'object' ? catObj?.name : (product as any).category;
      
      const prodCat = (catName || "").trim().toLowerCase();
      const activeCat = activeCategory.trim().toLowerCase();

      const matchCategory = activeCategory === 'Toutes les pièces' || prodCat === activeCat || prodCat.includes(activeCat) || activeCat.includes(prodCat);
      const matchBrand = selectedBrands.length === 0 || (product.brand && selectedBrands.includes(product.brand));
      const matchStock = !inStockOnly || (product as any).in_stock;
      const matchCertified = !certifiedOnly || (product as any).is_certified;

      return matchCategory && matchBrand && matchStock && matchCertified;
    });
  }, [products, activeCategory, selectedBrands, inStockOnly, certifiedOnly]);

  const resetAllFilters = () => {
    setInStockOnly(false);
    setCertifiedOnly(false);
    setSelectedBrands([]);
    setSearchParams({});
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      {/* HEADER CATALOGUE */}
      <div className="bg-slate-900 py-10 md:py-16 border-b border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3">
            <Settings className="w-4 h-4" />
            <span>Rayon Auto Global</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            {activeCategory}
          </h1>
          <p className="text-slate-400 mt-4 text-[11px] font-bold uppercase tracking-widest">
            {!isLoading && `${filteredProducts.length} produit(s) disponible(s)`}
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTRES */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm sticky top-28">
            <h3 className="text-sm font-[1000] text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Filter className="w-4 h-4 text-blue-600" /> Catégories
            </h3>
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <button 
                onClick={() => handleCategoryChange('Toutes les pièces')}
                className={`text-left text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-colors ${
                  activeCategory === 'Toutes les pièces' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                Toutes les pièces
              </button>
              {CATALOG_CATEGORIES.map((cat, index) => (
                <button 
                  key={index}
                  onClick={() => handleCategoryChange(cat)}
                  className={`text-left text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-colors ${
                    activeCategory.toLowerCase() === cat.toLowerCase() ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT (GRILLE) */}
        <main className="flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement des pièces...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-100">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-sm font-[1000] text-slate-900 uppercase tracking-widest mb-2">Aucune pièce trouvée</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-6">Nous n'avons pas trouvé de pièces correspondant à vos critères.</p>
              <button onClick={resetAllFilters} className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {filteredProducts.map((product) => {
                const prod = product as any;
                
                // 🟢 2. Récupération des données brutes
                const basePrice = product.price || 0;
                
                // 🟢 3. Calcul du prix final avec la fonction globale (Paliers dynamiques de 5% à 12%)
                const finalPrice = getPublicPrice(basePrice);
                
                return (
                  <div key={product.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group relative h-full">
                    
                    {/* BOUTON FAVORI */}
                    <button 
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-2 left-2 z-30 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-slate-100 active:scale-90 transition-transform"
                    >
                      <Heart size={14} className={favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-slate-300 group-hover:text-red-400"} />
                    </button>

                    {/* BADGE MARQUE (TOP RIGHT) */}
                    <div className="absolute top-2 right-2 z-20 bg-white/95 backdrop-blur-md text-slate-700 px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider border border-slate-200 shadow-sm flex items-center gap-1">
                      <Store size={10} className="text-blue-600" />
                      <span className="truncate max-w-[60px]">{product.brand || 'Générique'}</span>
                    </div>

                    {/* IMAGE */}
                    <Link to={`/product/${product.id}`} className="relative h-40 md:h-52 bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
                      <img 
                        src={getImageUrl(product.image_url, product.brand)} 
                        alt={product.name} 
                        className="max-h-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-700" 
                      />
                    </Link>

                    {/* CONTENU */}
                    <div className="p-4 md:p-6 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[100px]">
                          {prod.category?.name || prod.category || 'Pièce Auto'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span className="text-[9px] font-black text-slate-700">5.0</span>
                        </div>
                      </div>

                      <h3 className="text-[11px] font-[1000] text-slate-900 uppercase line-clamp-2 mb-3 leading-tight">
                        {product.name}
                      </h3>

                      <div className="space-y-1 mb-4 mt-auto">
                        <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                          <CarFront size={10} className="text-slate-300 shrink-0" /> Modèle: <span className="text-slate-600 truncate">{prod.model || 'Standard'}</span>
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                          <Hash size={10} className="text-slate-300 shrink-0" /> Réf: <span className="text-slate-600 font-mono tracking-tighter">{prod.reference || 'REF-AUTO'}</span>
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex flex-col">
                          {/* 🟢 4. Affichage du prix d'origine barré s'il y a une commission */}
                          {basePrice !== finalPrice && (
                            <span className="text-[8px] text-slate-300 line-through font-bold mb-0.5">
                              {basePrice.toLocaleString()} CFA
                            </span>
                          )}
                          <p className="text-sm md:text-xl font-[1000] text-slate-900 italic tracking-tighter uppercase leading-none">
                            {finalPrice.toLocaleString()} <span className="text-[9px] text-blue-600 not-italic font-black">CFA</span>
                          </p>
                        </div>
                        
                        {/* 🟢 5. On écrase le prix pour l'affichage TTC mais on GARDE la trace du prix d'origine pour le Checkout */}
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
        </main>
      </div>
    </div>
  );
}