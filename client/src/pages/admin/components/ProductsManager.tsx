import { useState, useEffect } from 'react';
import { 
  Package, Trash2, Eye, Loader2, 
  CheckCircle2, Filter
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
    <div className="w-full flex flex-col gap-2 md:gap-6 animate-in fade-in duration-500 pb-20">
      
      {/* 🔴 MODALE DE SUPPRESSION (Taille Réduite) */}
      {itemsToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-[#111625] border border-red-500/20 p-4 rounded-xl w-full max-w-[240px] text-center shadow-2xl">
            <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 className="text-red-500 w-4 h-4" />
            </div>
            <h3 className="text-[10px] font-black text-white uppercase italic mb-3">Supprimer ?</h3>
            <div className="flex gap-1.5">
              <button onClick={() => setItemsToDelete(null)} className="flex-1 py-1.5 bg-white/5 text-white rounded-md font-black text-[8px] uppercase">Non</button>
              <button onClick={confirmDelete} className="flex-1 py-1.5 bg-red-600 text-white rounded-md font-black text-[8px] uppercase">
                {isDeleting ? <Loader2 className="animate-spin w-2.5 h-2.5 mx-auto" /> : "Oui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 HEADER & BARRE DE CATÉGORIES (Compact) */}
      <div className="w-full bg-[#111625] border border-white/5 rounded-lg md:rounded-2xl p-2 md:p-6 shadow-xl overflow-hidden">
        <div className="relative z-10 w-full flex flex-col gap-2">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-[10px] md:text-xl font-[1000] text-white uppercase italic tracking-tighter flex items-center gap-1">
              <Package className="text-blue-500 w-3 h-3 md:w-5 md:h-5" /> Stock
            </h2>
            <div className="flex p-0.5 bg-black/40 rounded border border-white/5">
              <button onClick={() => setFilterStatus('pending')} className={`px-2 md:px-4 py-1 rounded text-[6px] md:text-[9px] font-black uppercase transition-all ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Dossiers</button>
              <button onClick={() => setFilterStatus('approved')} className={`px-2 md:px-4 py-1 rounded text-[6px] md:text-[9px] font-black uppercase transition-all ${filterStatus === 'approved' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>En ligne</button>
            </div>
          </div>

          <div className="w-full overflow-x-auto pt-1.5 border-t border-white/5 [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1 w-max pb-1">
              <div className="bg-blue-500/10 p-1 rounded shrink-0">
                <Filter className="w-2 h-2 text-blue-500" />
              </div>
              <button 
                onClick={() => setCategoryFilter(null)} 
                className={`px-2 py-1 rounded-full text-[6px] md:text-[8px] font-black uppercase whitespace-nowrap shrink-0 transition-all ${!categoryFilter ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/5 text-slate-400 border border-white/5'}`}
              >
                Tout
              </button>
              {CATEGORIES_LIST.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCategoryFilter(cat)} 
                  className={`px-2 py-1 rounded-full text-[6px] md:text-[8px] font-black uppercase whitespace-nowrap shrink-0 transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/5 text-slate-400 border border-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 GRILLE DE PRODUITS (Cartes plus petites) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-3 w-full">
        {displayedProducts.map((p) => {
          const isBattery = p.isBattery || p.categories?.name === "Batteries";
          return (
            <div key={p.id} className="bg-[#111625] border border-white/5 rounded-lg overflow-hidden flex flex-col w-full shadow-lg hover:border-blue-500/20 transition-all">
              
              <div className="w-full aspect-[4/3] bg-slate-900/50 flex items-center justify-center p-1.5 relative shrink-0">
                <img src={p.image_url} alt={p.name} className="max-w-full max-h-full object-contain" />
                <span className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[4.5px] md:text-[6px] font-black uppercase border ${isBattery ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                  {isBattery ? "BAT" : (p.categories?.name?.substring(0, 4) || "PCS")}
                </span>
              </div>

              <div className="p-1.5 md:p-3 flex flex-col flex-1">
                <h3 className="text-[7.5px] md:text-[11px] font-black text-white uppercase italic leading-tight line-clamp-2 mb-1 min-h-[1.2rem]">
                  {p.name}
                </h3>
                
                <div className="mt-auto pt-1.5 border-t border-white/5 flex items-end justify-between gap-1 w-full">
                  <div className="flex flex-col">
                    <span className="text-[8.5px] md:text-[12px] font-[1000] text-white leading-none">
                      {p.price.toLocaleString()}
                    </span>
                    <span className="text-[5px] md:text-[7px] text-blue-500 font-bold uppercase mt-0.5">CFA</span>
                  </div>
                  
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => handleDeletePrepare(p)} className="p-1 md:p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-600 hover:text-white transition-all">
                      <Trash2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                    </button>
                    <button className="p-1 md:p-1.5 bg-white/5 text-slate-400 rounded">
                      <Eye className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedProducts.length === 0 && (
        <div className="w-full py-8 text-center bg-[#111625]/50 rounded-lg border border-dashed border-white/10">
          <CheckCircle2 className="w-5 h-5 text-slate-700 mx-auto mb-1" />
          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Vide</p>
        </div>
      )}
    </div>
  );
}