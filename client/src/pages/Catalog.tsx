import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Settings, AlertCircle, ShoppingCart, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { productService } from '../services/productService'; 
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

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Toutes les pièces';
  const searchTerm = searchParams.get('searchTerm') || '';
  
  const addToCart = useCartStore((state) => state.addToCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [certifiedOnly, setCertifiedOnly] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        // Correction TS2345 : On s'assure que searchTerm est soit string soit undefined, jamais vide
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
  }, [searchTerm, activeCategory]);

  // Correction typage arguments
  const getImageUrl = (filename: string | null | undefined, brand: string | null | undefined) => {
    if (!filename) return `https://placehold.co/400x400/f8fafc/2563eb?text=${brand || 'Piece'}`;
    
    const imagePath = Object.keys(allImages).find(path => 
      path.toLowerCase().endsWith(`/${filename.toLowerCase()}`)
    );
    return imagePath ? allImages[imagePath] : `https://placehold.co/400x400/f8fafc/2563eb?text=${filename}`;
  };

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'Toutes les pièces') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    newParams.delete('searchTerm');
    setSearchParams(newParams);
    setSelectedBrands([]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Sécurisation de l'accès aux catégories
      const catObj = (product as any).categories;
      const catName: string = typeof catObj === 'object' ? catObj?.name : (product as any).category;
      
      const prodCat = (catName || "").trim().toLowerCase();
      const activeCat = activeCategory.trim().toLowerCase();

      const matchCategory = activeCategory === 'Toutes les pièces' || 
        prodCat === activeCat || 
        prodCat.includes(activeCat) || 
        activeCat.includes(prodCat);

      const matchBrand = selectedBrands.length === 0 || 
        (product.brand && selectedBrands.includes(product.brand));
      
      // Utilisation du nullish coalescing pour éviter les erreurs sur les booléens
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
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-slate-900 py-10 md:py-16 border-b border-slate-800">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3">
            <Settings className="w-4 h-4" />
            <span>Rayon Auto</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            {activeCategory}
          </h1>
          <p className="text-slate-400 mt-4 text-sm font-medium">
            {!isLoading && `${filteredProducts.length} produit(s) disponible(s).`}
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm sticky top-28">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Filter className="w-4 h-4 text-blue-600" /> Catégories
            </h3>
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <button 
                onClick={() => handleCategoryChange('Toutes les pièces')}
                className={`text-left text-xs font-bold px-4 py-2.5 rounded-xl transition-colors ${
                  activeCategory === 'Toutes les pièces' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                Toutes les pièces
              </button>
              {CATALOG_CATEGORIES.map((cat, index) => (
                <button 
                  key={index}
                  onClick={() => handleCategoryChange(cat)}
                  className={`text-left text-xs font-bold px-4 py-2.5 rounded-xl transition-colors ${
                    activeCategory.toLowerCase() === cat.toLowerCase() ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
              <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-black uppercase">Aucune pièce trouvée</h3>
              <button onClick={resetAllFilters} className="mt-4 text-blue-600 font-bold text-xs uppercase underline">Réinitialiser</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-slate-100 rounded-[1.5rem] p-4 hover:shadow-xl transition-all group flex flex-col">
                  <Link to={`/product/${product.id}`} className="h-48 flex items-center justify-center mb-4 overflow-hidden rounded-xl bg-slate-50">
                    <img 
                      src={getImageUrl(product.image_url, product.brand)} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                    />
                  </Link>

                  <div className="flex-grow">
                    <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                      {product.brand || 'Générique'}
                    </span>
                    <Link to={`/product/${product.id}`} className="block mt-2">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 line-clamp-2 uppercase leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-lg font-black">
                      {(product.price || 0).toLocaleString()} <span className="text-xs text-slate-500 font-medium">FCFA</span>
                    </p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg active:scale-90"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}