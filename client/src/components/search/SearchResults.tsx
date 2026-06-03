import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Search, Package, ShoppingCart, SlidersHorizontal, Hash, X, Car } from 'lucide-react';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || "";
  
  // 🟢 1. ÉTATS DE BASE
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // 🟢 2. ÉTATS DES FILTRES
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(1000000);

  const fallbackImage = "https://placehold.co/400x300/f8fafc/94a3b8?text=Image+Indisponible";

  // --- FETCH INITIAL CORRIGÉ ---
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      const searchQuery = `%${query}%`;

      // 🟢 Requête corrigée avec les vrais noms de colonnes SQL
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'approved')
        .or(`name.ilike.${searchQuery},brand.ilike.${searchQuery},vehicle_model.ilike.${searchQuery},oem_reference.ilike.${searchQuery}`);

      if (error) {
        console.error("Erreur recherche Supabase:", error);
      } else if (data) {
        setAllProducts(data);
        const highestPrice = Math.max(...data.map(p => p.price || 0), 100000);
        setMaxPrice(highestPrice);
      }
      setIsLoading(false);
    };

    if (query) fetchResults();
    else setIsLoading(false);
  }, [query]);

  // 🟢 3. FACETTES DYNAMIQUES
  const availableBrands = useMemo(() => [...new Set(allProducts.map(p => p.brand).filter(Boolean))], [allProducts]);
  const availableCategories = useMemo(() => [...new Set(allProducts.map(p => p.category).filter(Boolean))], [allProducts]);
  const absoluteMaxPrice = useMemo(() => Math.max(...allProducts.map(p => p.price || 0), 100000), [allProducts]);

  // 🟢 4. FILTRAGE INSTANTANÉ (côté client)
  const displayedProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const matchPrice = (p.price || 0) <= maxPrice;
      
      return matchBrand && matchCategory && matchPrice;
    });
  }, [allProducts, selectedBrands, selectedCategories, maxPrice]);

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setMaxPrice(absoluteMaxPrice);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-100 py-6 md:py-10 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
              <Search className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              "{query}"
            </h1>
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
              {displayedProducts.length} résultat{displayedProducts.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">
            <SlidersHorizontal className="w-4 h-4" /> Filtrer
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-col lg:flex-row gap-6 md:gap-10">
        
        {/* SIDEBAR FILTRES */}
        <div className={`lg:w-72 shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-32 space-y-6 md:space-y-8 bg-white p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filtres
              </h2>
              <button onClick={clearFilters} className="text-[9px] font-bold text-red-500 uppercase hover:bg-red-50 px-2 py-1 rounded-md">Reset</button>
            </div>

            {/* Filtre Catégories */}
            <div className="space-y-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase">Catégories</h3>
              {availableCategories.map(cat => (
                <label key={cat} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className="accent-blue-600" />
                    <span className="text-xs font-bold uppercase">{cat}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Filtre Prix */}
            <div className="space-y-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase">Prix Max: {maxPrice.toLocaleString()} CFA</h3>
              <input type="range" min="0" max={absoluteMaxPrice} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>
        </div>
        
        {/* RÉSULTATS */}
        <div className="flex-1">
          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" /></div>
          ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {displayedProducts.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col group hover:shadow-xl transition-all">
                  <Link to={`/product/${p.id}`} className="h-32 mb-4 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                    <img src={p.image_url || fallbackImage} className="max-h-full object-contain" alt={p.name} />
                  </Link>
                  <h3 className="text-xs font-black uppercase line-clamp-2">{p.name}</h3>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
                    <Hash size={10}/> {p.oem_reference || 'N/A'} | <Car size={10} /> {p.vehicle_model || 'N/A'}
                  </p>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-sm font-black italic">{p.price.toLocaleString()} CFA</span>
                    <button className="p-2 bg-slate-900 text-white rounded-lg"><ShoppingCart size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-sm font-black uppercase">Aucun résultat trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}