// src/pages/Accessories.tsx
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // 🟢 1. Import de Link ajouté
import { Filter, Wrench, AlertCircle, ShoppingCart, ShieldCheck, MapPin, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { productService } from '../services/productService'; 
import type { Product } from '../types'; 

// 🟢 LE SCANNER D'IMAGES (Indispensable pour lier BDD et fichiers)
const allImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  import: 'default' 
}) as Record<string, string>;

const ACCESSORIES_CATEGORIES = [
  "Entretien et Nettoyage", "Accessoires Intérieurs", 
  "Accessoires Extérieurs", "Attelage et Portage"
];

export default function Accessories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Tous les accessoires';
  const addToCart = useCartStore((state) => state.addToCart);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const loadAccessories = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Erreur chargement accessoires:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccessories();
  }, []);

  // 🟢 LA FONCTION QUI TROUVE LA BONNE IMAGE
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

  const handleCategoryChange = (category: string) => {
    if (category === 'Tous les accessoires') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
    setSelectedBrands([]); 
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const categoryName = (product as any).categories?.name || (product as any).category?.name || (product as any).category || "";
      const matchCategory = activeCategory === 'Tous les accessoires' 
        ? ACCESSORIES_CATEGORIES.includes(categoryName)
        : categoryName === activeCategory;
      const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand || '');
      const matchStock = !inStockOnly || ((product as any).stock && (product as any).stock > 0); 
      return matchCategory && matchBrand && matchStock;
    });
  }, [products, activeCategory, selectedBrands, inStockOnly]);

  const availableBrands = useMemo(() => {
    return Array.from(new Set(filteredProducts.map(p => p.brand).filter(Boolean)));
  }, [filteredProducts]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="bg-slate-900 py-10 md:py-16 border-b border-slate-800">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center gap-2 text-orange-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3">
            <Wrench className="w-4 h-4" />
            <span>Équipements & Entretien</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            {activeCategory}
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            {isLoading ? "Chargement du stock..." : `${filteredProducts.length} article(s) disponible(s).`}
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTRES */}
        <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm sticky top-28">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Filter className="w-4 h-4 text-orange-500" /> Rayons
            </h3>
            
            <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              <button 
                onClick={() => handleCategoryChange('Tous les accessoires')}
                className={`text-left text-xs font-bold px-4 py-2.5 rounded-xl transition-colors ${
                  activeCategory === 'Tous les accessoires' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-orange-500'
                }`}
              >
                Tous les produits
              </button>
              {ACCESSORIES_CATEGORIES.map((cat, index) => (
                <button 
                  key={index}
                  onClick={() => handleCategoryChange(cat)}
                  className={`text-left text-xs font-bold px-4 py-2.5 rounded-xl transition-colors ${
                    activeCategory === cat ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-orange-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
               <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                 <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">En stock uniquement</span>
               </label>

               {availableBrands.length > 0 && (
                 <div className="pt-4">
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Marques</h4>
                   <div className="space-y-2 max-h-[20vh] overflow-y-auto custom-scrollbar">
                     {availableBrands.map(brand => (
                       <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                         <input type="checkbox" checked={selectedBrands.includes(brand!)} onChange={() => toggleBrand(brand!)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                         <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 uppercase">{brand}</span>
                       </label>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </aside>

        {/* ZONE DES RÉSULTATS */}
        <main className="flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Connexion à l'entrepôt...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 flex flex-col items-center shadow-sm">
              <AlertCircle className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Aucun article</h3>
              <button 
                onClick={() => { setInStockOnly(false); setSelectedBrands([]); handleCategoryChange('Tous les accessoires'); }}
                className="mt-6 bg-orange-50 text-orange-600 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => {
                // ON UTILISE LA FONCTION POUR OBTENIR L'IMAGE FINALE
                const finalImageUrl = getProductImage(product.image_url) || 'https://placehold.co/400x400/f8fafc/f97316?text=SpaceAuto+24';

                return (
                  <div key={product.id} className="bg-white border border-slate-100 rounded-[1.5rem] p-4 flex flex-col hover:shadow-xl hover:border-orange-200 transition-all group shadow-sm">
                    
                    {/* 🟢 2. AJOUT DU LIEN AUTOUR DE L'IMAGE */}
                    <Link to={`/product/${product.id}`} className="block h-32 sm:h-48 bg-white mb-4 relative overflow-hidden flex items-center justify-center rounded-xl">
                       <img 
                         src={finalImageUrl} 
                         alt={product.name}
                         className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply" 
                       />
                       {product.is_boosted && (
                          <div className="absolute top-0 left-0 bg-orange-500 text-white px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                             <ShieldCheck className="w-3 h-3" />
                             <span className="text-[8px] font-black uppercase">Premium</span>
                          </div>
                       )}
                    </Link>

                    <div className="flex-grow flex flex-col">
                      <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md self-start">{product.brand}</span>
                      
                      {/* 🟢 3. AJOUT DU LIEN AUTOUR DU NOM DU PRODUIT */}
                      <Link to={`/product/${product.id}`} className="block mt-2">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-auto pt-3 border-t border-slate-50">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">Cote d'Ivoire</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <p className="text-sm sm:text-lg font-black text-slate-900">{product.price.toLocaleString()} <span className="text-[10px] text-slate-500">FCFA</span></p>
                      <button 
                        onClick={() => addToCart(product)}
                        className="p-3 rounded-xl bg-slate-900 text-white hover:bg-orange-500 transition-all active:scale-95 shadow-sm"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
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