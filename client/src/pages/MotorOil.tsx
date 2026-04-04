import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Filter, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { productService } from '../services/productService'; 
import type { Product } from '../types';
import bannerImage from '../assets/oils/banner.jpg';

// Scan global des images d'huiles
const oilImages = import.meta.glob('../assets/oils/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  import: 'default'
}) as Record<string, string>;

export default function MotorOil() {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [viscosityFilter, setViscosityFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadOils = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getProducts();
        // ID de catégorie pour les huiles (à vérifier selon ton Supabase)
        const OIL_CATEGORY_ID = "09163a70-b5f7-4172-b0f0-b7df63f25608";
        
        // Filtrage initial : soit par ID, soit par présence de propriétés spécifiques aux huiles
        const oilData = data.filter(p => 
          p.category_id === OIL_CATEGORY_ID || 
          (p as any).viscosity !== null || 
          p.name.toLowerCase().includes('huile')
        );
        
        if (isMounted) setProducts(oilData);
      } catch (error) {
        console.error("Erreur chargement huiles SpaceAuto24:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadOils();
    return () => { isMounted = false; };
  }, []);

  // --- LOGIQUE DE FILTRAGE DYNAMIQUE ---
  const availableViscosities = useMemo(() => 
    Array.from(new Set(products.map(p => (p as any).viscosity).filter(Boolean))).sort()
  , [products]);

  const availableCapacities = useMemo(() => 
    Array.from(new Set(products.map(p => (p as any).capacity).filter(v => v !== null))).sort((a, b) => Number(a) - Number(b))
  , [products]);

  const availableBrands = useMemo(() => 
    Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()
  , [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchVisco = !viscosityFilter || (p as any).viscosity === viscosityFilter;
      const matchCap = !capacityFilter || (p as any).capacity?.toString() === capacityFilter;
      const matchBrand = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
      return matchVisco && matchCap && matchBrand;
    });
  }, [products, viscosityFilter, capacityFilter, selectedBrands]);

  // --- GESTION DES IMAGES ---
  const getOilImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    const dbImgName = imageUrl.toLowerCase().split('.')[0].trim();
    const imageKey = Object.keys(oilImages).find(key => key.toLowerCase().includes(dbImgName));
    return imageKey ? oilImages[imageKey] : null;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      {/* HEADER AVEC FILTRES RAPIDES */}
      <section className="bg-white border-b border-slate-100 py-6 pt-24 md:pt-28">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="relative bg-slate-900 rounded-[2.5rem] p-8 md:p-12 overflow-hidden flex items-center min-h-[220px] shadow-2xl shadow-blue-900/20">
            <img src={bannerImage} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" alt="Motor Oil Banner" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
            
            <div className="relative z-10 w-full flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                  L'Excellence <span className="text-blue-500 italic">Moteur</span>
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Protection maximale & Performance accrue</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <select 
                  value={viscosityFilter} 
                  onChange={(e) => setViscosityFilter(e.target.value)} 
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-2xl text-xs font-black uppercase outline-none cursor-pointer hover:bg-white/20 transition-all min-w-[140px]"
                >
                  <option value="" className="text-slate-900">Toute Viscosité</option>
                  {availableViscosities.map(v => <option key={v} value={v} className="text-slate-900">{v}</option>)}
                </select>
                <select 
                  value={capacityFilter} 
                  onChange={(e) => setCapacityFilter(e.target.value)} 
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-2xl text-xs font-black uppercase outline-none cursor-pointer hover:bg-white/20 transition-all min-w-[140px]"
                >
                  <option value="" className="text-slate-900">Contenance</option>
                  {availableCapacities.map(c => <option key={c} value={c.toString()} className="text-slate-900">{c} Litres</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* SIDEBAR FILTRES */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm sticky top-32">
            <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <Filter className="w-3 h-3 text-blue-600" /> Filtrer par marque
            </h3>
            <div className="space-y-2">
              {availableBrands.map(brand => (
                <label key={brand} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group">
                  <input 
                    type="checkbox" 
                    checked={selectedBrands.includes(brand)} 
                    onChange={() => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])} 
                    className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${selectedBrands.includes(brand) ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'}`}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* GRILLE PRODUITS */}
        <main className="flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Chargement du stock d'huiles...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <span className="h-px w-8 bg-blue-600"></span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {filteredProducts.length} Références Premium
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => {
                  const imageUrl = getOilImageUrl(product.image_url);

                  return (
                    <div 
                      key={product.id} 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group flex flex-col cursor-pointer border-b-4 border-b-transparent hover:border-b-blue-600"
                    >
                      <div className="relative aspect-square bg-slate-50 rounded-[2rem] flex items-center justify-center p-8 mb-6 overflow-hidden transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-50">
                         <img 
                            src={imageUrl || 'https://placehold.co/400x400/f8fafc/1e293b?text=Huile'} 
                            className="max-h-full w-auto object-contain group-hover:scale-110 transition-transform duration-700" 
                            alt={product.name} 
                         />
                         {(product as any).viscosity && (
                           <div className="absolute top-4 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest shadow-xl">
                             {(product as any).viscosity}
                           </div>
                         )}
                      </div>

                      <div className="flex-grow flex flex-col">
                        <div className="mb-4">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.1em] bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                            {product.brand}
                          </span>
                          <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 uppercase">
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                          <div>
                            <p className="text-2xl font-black text-slate-950 leading-none">
                              {product.price.toLocaleString()}
                            </p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FCFA</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Évite la navigation vers le détail
                              addToCart(product);
                            }}
                            disabled={!product.in_stock}
                            className={`p-4 rounded-2xl transition-all duration-300 ${
                              product.in_stock 
                                ? 'bg-slate-900 text-white hover:bg-blue-600 active:scale-90 shadow-lg shadow-slate-900/10' 
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}