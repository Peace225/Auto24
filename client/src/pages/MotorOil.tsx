import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Filter, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 1️⃣ Import pour la navigation
import { useCartStore } from '../store/useCartStore';
import { productService } from '../services/productService'; 
import type { Product } from '../types';
import bannerImage from '../assets/oils/banner.jpg';

const oilImages = import.meta.glob('../assets/oils/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  import: 'default'
}) as Record<string, string>;

export default function MotorOil() {
  const navigate = useNavigate(); // 2️⃣ Initialisation du hook
  const addToCart = useCartStore((state) => state.addToCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [viscosityFilter, setViscosityFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    const loadOils = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getProducts();
        const OIL_CATEGORY_ID = "09163a70-b5f7-4172-b0f0-b7df63f25608";
        const oilData = data.filter(p => p.category_id === OIL_CATEGORY_ID || p.viscosity !== null);
        setProducts(oilData);
      } catch (error) {
        console.error("Erreur Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOils();
  }, []);

  const availableViscosities = useMemo(() => 
    Array.from(new Set(products.map(p => p.viscosity).filter(Boolean))).sort()
  , [products]);

  const availableCapacities = useMemo(() => 
    Array.from(new Set(products.map(p => p.capacity).filter(v => v !== null))).sort((a, b) => Number(a) - Number(b))
  , [products]);

  const availableBrands = useMemo(() => 
    Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()
  , [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchVisco = !viscosityFilter || p.viscosity === viscosityFilter;
      const matchCap = !capacityFilter || p.capacity?.toString() === capacityFilter;
      const matchBrand = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
      return matchVisco && matchCap && matchBrand;
    });
  }, [products, viscosityFilter, capacityFilter, selectedBrands]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      <section className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="relative bg-slate-900 rounded-[1.5rem] p-6 overflow-hidden flex items-center min-h-[160px]">
            <img src={bannerImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Banner" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-transparent" />
            <div className="relative z-10 w-full grid lg:grid-cols-2 gap-6 items-center">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                L'Excellence <span className="text-blue-500">Moteur</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <select value={viscosityFilter} onChange={(e) => setViscosityFilter(e.target.value)} className="bg-slate-800/80 border border-white/10 text-white p-3 rounded-xl text-xs font-bold outline-none cursor-pointer">
                  <option value="">Viscosité</option>
                  {availableViscosities.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} className="bg-slate-800/80 border border-white/10 text-white p-3 rounded-xl text-xs font-bold outline-none cursor-pointer">
                  <option value="">Contenance</option>
                  {availableCapacities.map(c => <option key={c} value={c.toString()}>{c}L</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-60 flex-shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm sticky top-24">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
              <Filter className="w-3 h-3 text-blue-600" /> Marques
            </h3>
            <div className="space-y-1">
              {availableBrands.map(brand => (
                <label key={brand} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  <span className={`text-[11px] font-bold uppercase ${selectedBrands.includes(brand) ? 'text-blue-600' : 'text-slate-500'}`}>{brand}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase px-2">{filteredProducts.length} Produits trouvés</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const dbImgName = product.image_url?.toLowerCase().split('.')[0] || "";
                  const imageKey = Object.keys(oilImages).find(key => key.toLowerCase().includes(dbImgName));
                  const imageUrl = imageKey ? oilImages[imageKey] : null;

                  return (
                    <div 
                      key={product.id} 
                      onClick={() => navigate(`/product/${product.id}`)} // 3️⃣ Navigation au clic sur la carte
                      className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all group flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-square bg-slate-50 rounded-xl flex items-center justify-center p-6 mb-4 overflow-hidden">
                         <img src={imageUrl || 'https://placehold.co/400x400?text=Huile'} className="max-h-full w-auto object-contain group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                         {product.viscosity && (
                           <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black border border-slate-100 shadow-sm">
                             {product.viscosity}
                           </div>
                         )}
                      </div>

                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{product.brand}</span>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                          <p className="text-lg font-black text-slate-950">
                            {product.price.toLocaleString()} <span className="text-xs font-medium">FCFA</span>
                          </p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // 4️⃣ Empêche d'ouvrir la page détail quand on clique sur le panier
                              addToCart(product);
                            }}
                            disabled={!product.in_stock}
                            className={`p-3 rounded-xl transition-all ${product.in_stock ? 'bg-slate-900 text-white hover:bg-blue-600 active:scale-95 shadow-md' : 'bg-slate-100 text-slate-300'}`}
                          >
                            <ShoppingCart className="w-5 h-5" />
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