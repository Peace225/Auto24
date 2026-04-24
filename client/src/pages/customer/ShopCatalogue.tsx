import { useState } from 'react';
import { Search, ShoppingCart, ShieldCheck, Car, X } from 'lucide-react';

// --- FAUSSES DONNÉES POUR TESTER L'AFFICHAGE ---
// L'attribut 'compatible_vehicles' simule la matrice de compatibilité
const MOCK_PARTS = [
  { id: 1, name: 'Plaquettes de frein en Céramique', category: 'Freinage', price: 45000, compatible_vehicles: ['v1', 'v3'] },
  { id: 2, name: 'Filtre à Huile Premium Bosch', category: 'Entretien', price: 8500, compatible_vehicles: ['v1', 'v2', 'v3'] },
  { id: 3, name: 'Amortisseur Avant Droit', category: 'Suspension', price: 75000, compatible_vehicles: ['v3'] },
  { id: 4, name: 'Filtre à Air Habitacle', category: 'Entretien', price: 12000, compatible_vehicles: ['v2'] },
  { id: 5, name: 'Kit de Distribution', category: 'Moteur', price: 120000, compatible_vehicles: ['v1'] },
  { id: 6, name: 'Disques de Frein Ventilés', category: 'Freinage', price: 65000, compatible_vehicles: ['v2', 'v3'] },
];

const CATEGORIES = ['Toutes', 'Entretien', 'Freinage', 'Suspension', 'Moteur'];

interface ShopCatalogueProps {
  vehicleFilter: { id: string; name: string } | null;
  clearVehicleFilter: () => void;
}

export default function ShopCatalogue({ vehicleFilter, clearVehicleFilter }: ShopCatalogueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Toutes');

  // --- LE MOTEUR DE FILTRAGE ---
  const filteredParts = MOCK_PARTS.filter(part => {
    // 1. Filtre par recherche textuelle (Nom ou Catégorie)
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          part.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Filtre par catégorie
    const matchesCategory = activeCategory === 'Toutes' || part.category === activeCategory;
    
    // 3. Filtre de COMPATIBILITÉ (Le plus important)
    // Si un véhicule est sélectionné, on vérifie que son ID est dans la liste des véhicules compatibles de la pièce.
    // Si aucun véhicule n'est sélectionné (vehicleFilter est null), on affiche tout (true).
    const matchesVehicle = vehicleFilter ? part.compatible_vehicles.includes(vehicleFilter.id) : true;

    return matchesSearch && matchesCategory && matchesVehicle;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Catalogue Pièces</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Trouvez la pièce parfaite pour votre véhicule
          </p>
        </div>
      </div>

      {/* BANNIÈRE DE COMPATIBILITÉ ACTIVE (Visible uniquement si on vient du Garage) */}
      {vehicleFilter && (
        <div className="bg-blue-600 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-600/20 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4 text-white">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Filtre Garage Actif</p>
              <h3 className="font-bold text-sm sm:text-base">
                Pièces garanties 100% compatibles avec votre <span className="font-[1000] italic">{vehicleFilter.name}</span>
              </h3>
            </div>
          </div>
          <button 
            onClick={clearVehicleFilter}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full sm:w-auto shrink-0"
          >
            <X className="w-4 h-4" /> Retirer le filtre
          </button>
        </div>
      )}

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher une pièce, une référence..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all shadow-sm placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeCategory === cat 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DES PRODUITS */}
      {filteredParts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 sm:p-20 text-center">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-[1000] text-slate-400 uppercase italic tracking-tighter">Aucune pièce trouvée</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            {vehicleFilter 
              ? `Nous n'avons pas trouvé de pièce compatible avec votre ${vehicleFilter.name} pour ces critères.` 
              : "Essayez de modifier vos filtres ou votre recherche."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredParts.map(part => (
            <div key={part.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col group relative overflow-hidden">
              
              {/* Badge Compatibilité (Affiche uniquement si un véhicule du garage est sélectionné) */}
              {vehicleFilter && (
                <div className="absolute top-4 left-4 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 z-10 border border-emerald-100 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Compatible</span>
                </div>
              )}

              {/* Image Produit (Placeholder pour le moment) */}
              <div className="h-40 bg-slate-50 rounded-xl mb-6 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors">
                <Car className="w-16 h-16 text-slate-200 group-hover:text-blue-200 transition-colors transform group-hover:scale-110 duration-500" />
              </div>

              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{part.category}</p>
                <h3 className="font-[1000] text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors">{part.name}</h3>
              </div>

              <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Prix unitaire</p>
                  <p className="text-xl font-[1000] text-blue-600">{part.price.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span></p>
                </div>
                <button className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-orange-500 hover:scale-105 transition-all shadow-md active:scale-95">
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}