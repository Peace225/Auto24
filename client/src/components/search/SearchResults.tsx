import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import Sidebar from './Sidebar'; // Ton nouveau composant sidebar

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || "";
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      const searchQuery = `%${query}%`;

      // 1. Même requête que ton SubHeaderSearch
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .eq('status', 'approved')
        .or(`name.ilike.${searchQuery},brand.ilike.${searchQuery},model.ilike.${searchQuery},reference.ilike.${searchQuery}`);

      const { data, error } = await queryBuilder;

      if (!error && data) {
        setProducts(data);
        // 2. Extraire les marques dynamiquement pour la Sidebar
        const brands = [...new Set(data.map(p => p.brand).filter(Boolean))];
        setAvailableBrands(brands as string[]);
      }
      setIsLoading(false);
    };

    fetchResults();
  }, [query]);

  // Filtrage local basé sur les marques sélectionnées dans la Sidebar
  const displayedProducts = selectedBrands.length > 0 
    ? products.filter(p => selectedBrands.includes(p.brand))
    : products;

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
      <Sidebar 
        availableBrands={availableBrands} 
        selectedBrands={selectedBrands} 
        onFilterChange={(brand) => {
          setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
        }}
      />
      
      <div className="flex-1">
        <h1 className="text-2xl font-black mb-6">Résultats pour "{query}"</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedProducts.map(p => (
            <div key={p.id} className="border p-4 rounded-xl shadow-sm bg-white">
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-orange-500 font-black">{p.price.toLocaleString()} CFA</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}