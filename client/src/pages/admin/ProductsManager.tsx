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
  }, []);

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
    <div className="w-full flex flex-col gap-1.5 md:gap-4 animate-in fade-in duration-500 pb-20">
      
      {/* 🔴 MODALE DE SUPPRESSION (Ultra-Compacte) */}
      {itemsToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-[#111625] border border-red-500/20 p-3 rounded-lg w-full max-w-[180px] text-center shadow-2xl">
            <Trash2 className="text-red-500 w-3 h-3 mx-auto mb-1.5" />
            <h3 className="text-[8px] font-black text-white uppercase italic mb-2">Supprimer ?</h3>
            <div className="flex gap-1">
              <button onClick={() => setItemsToDelete(null)} className="flex-1 py-1 bg-white/5 text-white rounded-[2px] font-black text-[7px] uppercase">Non</button>
              <button onClick={confirmDelete} className="flex-1 py-1 bg-red-600 text-white rounded-[2px] font-black text-[7px] uppercase">
                {isDeleting ? <Loader2 className="animate-spin w-2 h-2 mx-auto" /> : "Oui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 HEADER & BARRE DE CATÉGORIES */}
      <div className="w-full bg-[#111625] border border-white/5 rounded-md p-1.5 md:p-4 shadow-xl overflow-hidden">
        <div className="relative z-10 w-full flex flex-col gap-1.5">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-[9px] md:text-sm font-[1000] text-white uppercase italic tracking-tighter flex items-center gap-1">
              <Package className="text-blue-500 w-2.5 h-2.5" /> Stock
            </h2>
            <div className="flex p-0.5 bg-black/40 rounded-sm border border-white/5">
              <button onClick={() => setFilterStatus('pending')} className={`px-1.5 py-0.5 rounded-sm text-[5.5px] md:text-[8px] font-black uppercase transition-all ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Dossiers</button>
              <button onClick={() => setFilterStatus('approved')} className={`px-1.5 py-0.5 rounded-sm text-[5.5px] md:text-[8px] font-black uppercase transition-all ${filterStatus === 'approved' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>En ligne</button>
            </div>
          </div>

          {/* Filtre horizontal scrollable */}
          <div className="w-full overflow-x-auto pt-1 border-t border-white/5 [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1 w-max pb-0.5">
              <div className="bg-blue-500/10 p-0.5 rounded shrink-0">
                <Filter className="w-2 h-2 text-blue-500" />
              </div>
              <button 
                onClick={() => setCategoryFilter(null)} 
                className={`px-1.5 py-0.5 rounded-full text-[6px] md:text-[7px] font-black uppercase whitespace-nowrap transition-all ${!categoryFilter ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 border border-white/5'}`}
              >
                Tout
              </button>
              {CATEGORIES_LIST.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCategoryFilter(cat)} 
                  className={`px-1.5 py-0.5 rounded-full text-[6px] md:text-[7px] font-black uppercase whitespace-nowrap transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/5 text-slate-400 border border-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 GRILLE DE PRODUITS (3 COLONNES SUR MOBILE) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 w-full">
        {displayedProducts.map((p) => {
          const isBattery = p.isBattery || p.categories?.name === "Batteries";
          return (
            <div key={p.id} className="bg-[#111625] border border-white/5 rounded-[3px] overflow-hidden flex flex-col w-full shadow-lg hover:border-blue-500/20 transition-all">
              
              {/* Image Carrée */}
              <div className="w-full aspect-square bg-slate-900/50 flex items-center justify-center p-1 relative shrink-0">
                <img src={p.image_url} alt={p.name} className="max-w-full max-h-full object-contain" />
                <span className={`absolute top-0.5 left-0.5 px-0.5 py-0.2 rounded-[1px] text-[3.5px] md:text-[5px] font-black uppercase border ${isBattery ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                  {isBattery ? "BAT" : "PCS"}
                </span>
              </div>

              <div className="p-1 flex flex-col flex-1 gap-0.5">
                <h3 className="text-[5.5px] md:text-[8px] font-black text-white uppercase italic leading-tight line-clamp-1">
                  {p.name}
                </h3>
                
                <div className="mt-auto pt-0.5 border-t border-white/5 flex items-center justify-between gap-0.5 w-full">
                  <div className="flex flex-col leading-none">
                    <span className="text-[6.5px] md:text-[9px] font-[1000] text-white">
                      {Math.floor(p.price / 1000)}k
                    </span>
                  </div>
                  
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => handleDeletePrepare(p)} className="p-0.5 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors">
                      <Trash2 size={7} />
                    </button>
                    <button className="p-0.5 text-slate-400 bg-white/5 rounded-sm">
                      <Eye size={7} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedProducts.length === 0 && (
        <div className="w-full py-4 text-center bg-[#111625]/50 rounded-md border border-dashed border-white/10">
          <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest">Vide</p>
        </div>
      )}
    </div>
  );
}