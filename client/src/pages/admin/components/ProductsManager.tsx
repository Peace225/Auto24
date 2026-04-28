import { useState, useEffect } from 'react';
import { 
  Package, Trash2, Eye, Zap, Tag, Loader2, 
  CheckCircle2, Filter, ChevronRight, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

const CATEGORIES_LIST = [
  "Pièces moteur", "Filtres et huile", "Direction / Suspension / Train", 
  "Freinage", "Distribution et Accessoires", "Embrayage et Boîte de vitesse", 
  "Démarrage électrique", "Optiques / Phares / Ampoules", "Capteurs et Sondes", 
  "Essuie-glaces et pièces", "Batteries"
];

interface ProductsManagerProps {
  products: any[];
  onRefresh: () => void;
}

export default function ProductsManager({ products, onRefresh }: ProductsManagerProps) {
  const [itemsToDelete, setItemsToDelete] = useState<{id: string, name: string, isBattery: boolean}[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved'>('approved');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const productsChannel = supabase.channel('admin-all-live').subscribe();
    return () => { supabase.removeChannel(productsChannel); };
  }, [onRefresh]);

  const displayedProducts = products.filter(p => {
    const isBattery = p.isBattery || p.categories?.name === "Batteries";
    const matchesStatus = isBattery ? true : p.status === filterStatus;
    const matchesCategory = categoryFilter ? (isBattery ? "Batteries" === categoryFilter : p.categories?.name === categoryFilter) : true;
    return matchesStatus && matchesCategory;
  });

  const handleDeletePrepare = (product: any) => {
    setItemsToDelete([{ 
      id: product.id, 
      name: product.name, 
      isBattery: product.isBattery || product.categories?.name === "Batteries" 
    }]);
  };

  const confirmDelete = async () => {
    if (!itemsToDelete) return;
    setIsDeleting(true);
    try {
      const batteryIds = itemsToDelete.filter(i => i.isBattery).map(i => i.id);
      const standardIds = itemsToDelete.filter(i => !i.isBattery).map(i => i.id);
      if (standardIds.length > 0) await supabase.from('products').delete().in('id', standardIds);
      if (batteryIds.length > 0) await supabase.from('batteries').delete().in('id', batteryIds);
      toast.success("Supprimé");
      setItemsToDelete(null);
      onRefresh();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3 md:space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* 🔴 MODALE DE SUPPRESSION (RÉDUITE) */}
      {itemsToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-[#111625] border border-red-500/20 p-5 rounded-2xl w-full max-w-[260px] text-center shadow-2xl">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="text-red-500 w-5 h-5" />
            </div>
            <h3 className="text-xs font-black text-white uppercase italic mb-4">Supprimer l'article ?</h3>
            <div className="flex gap-2">
              <button onClick={() => setItemsToDelete(null)} className="flex-1 py-2 bg-white/5 text-white rounded-lg font-black text-[9px] uppercase">Non</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase shadow-lg shadow-red-600/20">
                {isDeleting ? <Loader2 className="animate-spin w-3 h-3 mx-auto" /> : "Oui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 HEADER & BARRE DE CATÉGORIES (RESPONSIVE OPTIMISÉ) */}
      <div className="bg-[#111625] border border-white/5 rounded-xl md:rounded-[2.5rem] p-3 md:p-8 shadow-2xl overflow-hidden relative">
        <div className="relative z-10 space-y-3 md:space-y-6">
          
          {/* Titre + Switch État */}
          <div className="flex justify-between items-center">
            <h2 className="text-sm md:text-2xl font-[1000] text-white uppercase italic tracking-tighter flex items-center gap-2">
              <Package className="text-blue-500 w-3.5 h-3.5 md:w-6 md:h-6" /> Stock
            </h2>
            <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5">
              <button onClick={() => setFilterStatus('pending')} className={`px-3 md:px-6 py-1.5 md:py-2.5 rounded-md text-[7px] md:text-[10px] font-black uppercase transition-all ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Dossiers</button>
              <button onClick={() => setFilterStatus('approved')} className={`px-3 md:px-6 py-1.5 md:py-2.5 rounded-md text-[7px] md:text-[10px] font-black uppercase transition-all ${filterStatus === 'approved' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>En ligne</button>
            </div>
          </div>

          {/* 🟢 BARRE DE FILTRE CATÉGORIES (Miniaturisée pour le pouce) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide border-t border-white/5 pt-3">
            <div className="bg-blue-500/10 p-1.5 rounded-lg shrink-0">
              <Filter className="w-2.5 h-2.5 text-blue-500" />
            </div>
            <button 
              onClick={() => setCategoryFilter(null)} 
              className={`px-2.5 py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase whitespace-nowrap shrink-0 transition-all ${!categoryFilter ? 'bg-white text-slate-900 shadow-lg' : 'bg-white/5 text-slate-400 border border-white/5'}`}
            >
              Tout
            </button>
            {CATEGORIES_LIST.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoryFilter(cat)} 
                className={`px-2.5 py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase whitespace-nowrap shrink-0 transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white/5 text-slate-400 border border-white/5'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔴 GRILLE DE PRODUITS (2 COLONNES) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
        {displayedProducts.map((p) => {
          const isBattery = p.isBattery || p.categories?.name === "Batteries";
          return (
            <div key={p.id} className="bg-[#111625] border border-white/5 rounded-lg md:rounded-[2rem] overflow-hidden flex flex-col relative shadow-xl hover:border-blue-500/30 transition-all">
              
              <div className="h-24 md:h-48 bg-slate-900/50 flex items-center justify-center p-2 relative">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                <span className={`absolute top-1.5 left-1.5 px-1 py-0.5 rounded-md text-[5.5px] md:text-[8px] font-black uppercase border ${isBattery ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                  {isBattery ? "BAT" : (p.categories?.name?.substring(0, 4) || "PC")}
                </span>
              </div>

              <div className="p-2 md:p-6 flex flex-col flex-1">
                <h3 className="text-[8px] md:text-sm font-black text-white uppercase italic leading-tight mb-2 line-clamp-2 min-h-[1rem]">
                  {p.name}
                </h3>
                
                <div className="mt-auto pt-1.5 border-t border-white/5 flex items-center justify-between gap-1">
                  <div className="flex flex-col">
                    <span className="text-[7px] md:text-[10px] font-[1000] text-white truncate max-w-[45px] md:max-w-none">
                      {p.price.toLocaleString()}
                    </span>
                    <span className="text-[5px] text-blue-500 font-bold uppercase -mt-0.5">CFA</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button onClick={() => handleDeletePrepare(p)} className="p-1.5 md:p-3 bg-red-500/10 text-red-500 rounded-md md:rounded-xl hover:bg-red-600 transition-all">
                      <Trash2 size={10} className="md:size-4" />
                    </button>
                    <button className="p-1.5 md:p-3 bg-white/5 text-slate-400 rounded-md md:rounded-xl">
                      <Eye size={10} className="md:size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedProducts.length === 0 && (
        <div className="py-10 text-center bg-[#111625]/50 rounded-xl border border-dashed border-white/10 mx-2">
          <CheckCircle2 className="w-5 h-5 text-slate-700 mx-auto mb-2" />
          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Aucun produit</p>
        </div>
      )}
    </div>
  );
}