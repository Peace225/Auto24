// src/components/search/SearchResults.tsx
import { useEffect, useState } from 'react';
import { productService } from '../services/productService'; // 🟢 CORRECTION: Bon chemin pour remonter à src/services/
import type { Product } from '../../types'; 
import ProductCard from '../components/features/ProductCard'; // 🟢 CORRECTION: Bon chemin vers src/components/features/
import { Loader2, SearchX, Filter, PackageSearch } from 'lucide-react';

interface Props {
  query: string;
}

export default function SearchResults({ query }: Props) {
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      try {
        // 🟢 CORRECTION : Si query est vide, on envoie un objet vide pour afficher TOUT le catalogue
        const filters = query ? { searchTerm: query } : {};
        const data = await productService.getProducts(filters);
        
        setResults(data);
      } catch (error) {
        console.error("Erreur recherche:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 🟢 CORRECTION : On exécute TOUJOURS la recherche (même sans mot clé) 
    // pour éviter que le Loader ne tourne à l'infini sur la page catalogue.
    performSearch();
  }, [query]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* HEADER DE RÉSULTATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">
            {query ? (
              <>Résultats pour : <span className="text-blue-600">"{query}"</span></>
            ) : (
              "Notre Catalogue"
            )}
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            {isLoading ? "Recherche en cours..." : `${results.length} pièce(s) trouvée(s)`}
          </p>
        </div>

        {!isLoading && results.length > 0 && (
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4 text-blue-600" /> Filtrer par marque
          </button>
        )}
      </div>

      {/* ÉTATS DE CHARGEMENT / VIDE / RÉSULTATS */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Scan de la base de données...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200 shadow-sm flex flex-col items-center">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <SearchX className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Aucune pièce trouvée</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto font-medium">
            Nous n'avons pas trouvé de correspondance pour cette référence. Vérifiez l'orthographe ou essayez une marque de véhicule.
          </p>
          <button 
            onClick={() => window.location.href = '/catalog'}
            className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:scale-105 transition-all"
          >
            Voir tout le stock
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* RÉASSURANCE */}
      {!isLoading && results.length > 0 && (
        <div className="mt-20 p-8 bg-slate-900 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
           <div className="flex items-center gap-4 text-white">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <PackageSearch className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-widest text-xs">Vous ne trouvez pas votre pièce ?</h4>
                <p className="text-slate-400 text-[10px] font-bold">Nos experts à la Casse d'Abobo peuvent la chercher pour vous.</p>
              </div>
           </div>
           <button className="w-full md:w-auto bg-white text-slate-900 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95">
             Contacter un conseiller
           </button>
        </div>
      )}
    </div>
  );
}