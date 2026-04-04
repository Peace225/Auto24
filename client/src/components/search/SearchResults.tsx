// src/components/search/SearchResults.tsx
import React, { useState, useMemo } from 'react';
import { ShoppingCart, CheckCircle2, AlertCircle, ChevronDown, Filter, Check, Car } from 'lucide-react';

// Fausses données enrichies avec les véhicules compatibles
const MOCK_RESULTS = [
  {
    id: 1,
    name: "Jeu de 4 plaquettes de frein avant",
    brand: "Brembo",
    oemReference: "P 85 075",
    originalOem: "1K0698151F",
    price: 45.90,
    inStock: true,
    image: "https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?q=80&w=500&auto=format&fit=crop", 
    isOem: true,
    vehicles: ["Volkswagen", "Audi"]
  },
  {
    id: 2,
    name: "Injecteur Common Rail",
    brand: "Bosch",
    oemReference: "0 445 110 327",
    originalOem: "03L130277",
    price: 289.50,
    inStock: true,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=500&auto=format&fit=crop", 
    isOem: true,
    vehicles: ["BMW", "Mercedes-Benz"]
  },
  {
    id: 3,
    name: "Kit d'embrayage avec volant moteur",
    brand: "Valeo",
    oemReference: "837316",
    originalOem: "03G105266BN",
    price: 412.00,
    inStock: false,
    image: "https://images.unsplash.com/photo-1590650046537-8bc8e68e4042?q=80&w=500&auto=format&fit=crop", 
    isOem: true,
    vehicles: ["Peugeot", "Toyota"]
  },
  {
    id: 4,
    name: "Filtre à huile",
    brand: "Purflux",
    oemReference: "LS951",
    originalOem: "1109AY",
    price: 8.50,
    inStock: true,
    image: "https://images.unsplash.com/photo-1635788097365-2ed6db11e0dc?q=80&w=500&auto=format&fit=crop", 
    isOem: false,
    vehicles: ["Peugeot", "Volkswagen"]
  }
];

// Données des filtres
const FILTER_VEHICLES = ["Mercedes-Benz", "BMW", "Volkswagen", "Audi", "Peugeot", "Toyota"];
const FILTER_BRANDS = ["Brembo", "Bosch", "Valeo", "Purflux", "Michelin", "Sachs"];

interface SearchResultsProps {
  query?: string;
}

export default function SearchResults({ query = "" }: SearchResultsProps) {
  // États pour les filtres
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onlyOem, setOnlyOem] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Fonction pour ajouter/retirer un élément d'une liste (Marque ou Véhicule)
  const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item)); // Retire si déjà coché
    } else {
      setList([...list, item]); // Ajoute si non coché
    }
  };

  // 🟢 LOGIQUE DE FILTRAGE
  // useMemo permet de ne recalculer cette liste que si les filtres ou la recherche changent
  const filteredResults = useMemo(() => {
    return MOCK_RESULTS.filter(product => {
      // 1. Filtre par recherche texte (Nom, Marque ou Réf OEM)
      const matchesQuery = query 
        ? product.name.toLowerCase().includes(query.toLowerCase()) || 
          product.brand.toLowerCase().includes(query.toLowerCase()) ||
          product.originalOem.toLowerCase().includes(query.toLowerCase())
        : true;

      // 2. Filtre par Véhicule
      const matchesVehicle = selectedVehicles.length === 0 || selectedVehicles.some(v => product.vehicles.includes(v));

      // 3. Filtre par Marque de pièce
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);

      // 4. Filtre Qualité OEM
      const matchesOem = !onlyOem || product.isOem;

      // 5. Filtre En Stock
      const matchesStock = !inStockOnly || product.inStock;

      // Le produit doit valider TOUS les filtres pour être affiché
      return matchesQuery && matchesVehicle && matchesBrand && matchesOem && matchesStock;
    });
  }, [query, selectedVehicles, selectedBrands, onlyOem, inStockOnly]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-screen">
      
      {/* HEADER DES RÉSULTATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Résultats {query ? `pour "${query}"` : 'de recherche'}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {filteredResults.length} pièce{filteredResults.length !== 1 ? 's' : ''} trouvée{filteredResults.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* BOUTONS DE TRI (Mobile) */}
        <div className="flex items-center gap-3">
          <button className="lg:hidden flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm">
            <Filter size={16} /> Filtres
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            Trier par <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex gap-8 relative items-start">
        
        {/* SIDEBAR FILTRES (Desktop) */}
        <div className="hidden lg:block w-72 flex-shrink-0 sticky top-28 space-y-6">
          
          {/* Bloc Véhicule */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <Car size={16} className="text-blue-600" /> Mon Véhicule
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {FILTER_VEHICLES.map((vehicle) => (
                <label 
                  key={vehicle} 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => toggleFilter(selectedVehicles, setSelectedVehicles, vehicle)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedVehicles.includes(vehicle) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                    {selectedVehicles.includes(vehicle) && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                    {vehicle}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Bloc Qualité & Disponibilité */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-600" /> Disponibilité & Qualité
            </h3>
            <div className="space-y-4">
              <label 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setOnlyOem(!onlyOem)}
              >
                <span className="text-sm font-bold text-slate-700">Qualité OEM Uniquement</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${onlyOem ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full transition-all ${onlyOem ? 'left-5' : 'left-1'}`} />
                </div>
              </label>

              <label 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setInStockOnly(!inStockOnly)}
              >
                <span className="text-sm font-bold text-slate-700">En stock uniquement</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${inStockOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full transition-all ${inStockOnly ? 'left-5' : 'left-1'}`} />
                </div>
              </label>
            </div>
          </div>

          {/* Bloc Fabricant */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <Filter size={16} className="text-blue-600" /> Fabricants (Marque)
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {FILTER_BRANDS.map((brand) => (
                <label 
                  key={brand} 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(brand) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                    {selectedBrands.includes(brand) && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* GRILLE DE PRODUITS OU MESSAGE VIDE */}
        <div className="flex-1">
          {filteredResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredResults.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group flex flex-col">
                  {/* ... (Le design des cartes produits reste inchangé) ... */}
                  <div className="relative aspect-square bg-white p-4 flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.isOem && (
                      <span className="absolute top-3 left-3 bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                        Qualité OEM
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {product.brand}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-800 leading-tight mb-3 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors">
                      {product.name}
                    </h3>

                    <div className="bg-slate-50 p-2.5 rounded-lg mb-4 space-y-1 mt-auto">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Réf. Marque:</span>
                        <span className="font-mono font-bold text-slate-700">{product.oemReference}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Réf. Constructeur:</span>
                        <span className="font-mono font-bold text-blue-600">{product.originalOem}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <span className="block text-2xl font-black text-slate-900 tracking-tighter">
                          {product.price.toFixed(2)} €
                        </span>
                        {product.inStock ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
                            <CheckCircle2 size={12} /> En stock
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-1">
                            <AlertCircle size={12} /> Sur commande
                          </span>
                        )}
                      </div>
                      
                      <button 
                        disabled={!product.inStock}
                        className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-sm ${
                          product.inStock 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* MESSAGE SI AUCUN RÉSULTAT */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Aucune pièce ne correspond à vos critères</h2>
              <p className="text-slate-500 mb-6">Essayez de retirer certains filtres ou de modifier votre recherche.</p>
              <button 
                onClick={() => {
                  setSelectedVehicles([]);
                  setSelectedBrands([]);
                  setOnlyOem(false);
                  setInStockOnly(false);
                }}
                className="bg-blue-50 text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}