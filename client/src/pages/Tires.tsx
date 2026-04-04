import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import pour la navigation
import { 
  ShoppingCart, Filter, ShieldCheck, Loader2, RefreshCw, CircleDashed 
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// 🟢 Importation dynamique des images
const tireImages = import.meta.glob('../assets/tires/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  import: 'default'
}) as Record<string, string>;

export default function Tires() {
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensionFilter, setDimensionFilter] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // 🟢 1. CHARGEMENT DES DONNÉES
  useEffect(() => {
    const loadTires = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories!inner(*)')
          .eq('categories.section', 'pneus');

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Erreur de chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTires();
  }, []);

  // 🟢 2. RÉCUPÉRATION DES FILTRES (Calculé une seule fois)
  const availableDimensions = useMemo(() => {
    return Array.from(new Set(products.map(p => p.dimensions).filter(Boolean))).sort();
  }, [products]);

  const availableBrands = useMemo(() => {
    return Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort();
  }, [products]);

  // 🟢 3. LOGIQUE DE FILTRAGE
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchDim = dimensionFilter === '' || p.dimensions === dimensionFilter;
      const matchBrand = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
      return matchDim && matchBrand;
    });
  }, [products, dimensionFilter, selectedBrands]);

  // 🟢 4. UTILITAIRE IMAGE
  const getImageUrl = (url: string | undefined) => {
    if (!url) return 'https://placehold.co/400x400?text=Pneu';
    const fileName = url.split('/').pop();
    const fullPath = `../assets/tires/${fileName}`;
    return tireImages[fullPath] || 'https://placehold.co/400x400?text=Image+Non+Trouvée';
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setDimensionFilter('');
    setSelectedBrands([]);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* EN-TÊTE */}
      <section className="bg-slate-900 border-b border-slate-800 py-12">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-3">
            <CircleDashed className="w-4 h-4" />
            <span>Centre Pneumatique Abidjan</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8">
            Pneus & Jantes
          </h1>
          
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl max-w-xl">
            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block">
              Recherche par Dimension
            </label>
            <select 
              value={dimensionFilter} 
              onChange={(e) => setDimensionFilter(e.target.value)} 
              className="w-full bg-slate-800/80 border border-slate-700 text-white p-4 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les dimensions</option>
              {availableDimensions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTRES */}
        <aside className="lg:w-80">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 sticky top-28 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" /> Marques
              </h3>
              {(selectedBrands.length > 0 || dimensionFilter) && (
                <button onClick={resetFilters} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase transition-colors flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {availableBrands.map(brand => (
                <label key={brand} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedBrands.includes(brand)} 
                      onChange={() => toggleBrand(brand)} 
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className={`text-sm font-bold ${selectedBrands.includes(brand) ? 'text-blue-600' : 'text-slate-600'}`}>
                      {brand}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* GRILLE PRODUITS */}
        <main className="flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem]">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Vérification des stocks...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200">
              <h3 className="text-xl font-black text-slate-900 uppercase">Aucun article trouvé</h3>
              <button onClick={resetFilters} className="mt-8 bg-blue-50 text-blue-600 px-8 py-4 rounded-xl font-black text-[10px] uppercase">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-4 hover:shadow-xl transition-all flex flex-col group relative">
                  
                  {product.is_certified && (
                    <div className="absolute top-6 left-6 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3 h-3" /> Certifié
                    </div>
                  )}

                  {/* LIEN SUR L'IMAGE */}
                  <Link to={`/product/${product.id}`} className="w-full h-48 bg-slate-50 rounded-[2rem] flex items-center justify-center p-6 mb-6 overflow-hidden">
                    <img 
                      src={getImageUrl(product.image_url)} 
                      className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                      alt={product.name} 
                    />
                  </Link>

                  <div className="flex-grow text-center px-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-lg mb-3 inline-block">
                      {product.brand}
                    </span>
                    
                    {/* LIEN SUR LE TITRE */}
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    {product.dimensions && (
                      <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-black text-slate-700 uppercase inline-block mb-4">
                        {product.dimensions}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-50 pt-6 mt-auto flex flex-col items-center gap-4">
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                      {product.price.toLocaleString()} <small className="text-[10px] text-slate-500">FCFA</small>
                    </p>
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={!product.in_stock}
                      className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        product.in_stock ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" /> {product.in_stock ? 'Ajouter au panier' : 'Rupture'}
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