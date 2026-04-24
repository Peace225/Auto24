import { useState, useEffect } from 'react';
import { 
  Package, Check, Ban, Eye, ShieldAlert, Zap,
  Store, Tag, Loader2, CheckCircle2, Trash2, FilterX, X, CheckSquare, Square, ChevronRight, Filter
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

// 🟢 Liste exacte de vos catégories pour le filtre
const CATEGORIES_LIST = [
  "Pièces moteur", "Filtres et huile", "Direction / Suspension / Train", 
  "Freinage", "Distribution et Accessoires", "Embrayage et Boîte de vitesse", 
  "Démarrage électrique", "Optiques / Phares / Ampoules", "Capteurs et Sondes", 
  "Essuie-glaces et pièces", "Batteries" // Ajout de la catégorie spéciale
];

interface ProductsManagerProps {
  products: any[]; // On attend ici un tableau combiné (Produits + Batteries)
  onRefresh: () => void; // Fonction pour recharger les données du parent
}

export default function ProductsManager({ products, onRefresh }: ProductsManagerProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemsToDelete, setItemsToDelete] = useState<{id: string, name: string, isBattery: boolean}[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FILTRES ---
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved'>('approved');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // 🟢 REAL-TIME : On écoute les DEUX tables
  useEffect(() => {
    const productsChannel = supabase
      .channel('admin-all-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batteries' }, () => onRefresh())
      .subscribe();

    return () => { supabase.removeChannel(productsChannel); };
  }, [onRefresh]);

  // --- LOGIQUE D'AFFICHAGE ---
  const displayedProducts = products.filter(p => {
    // Note: On assume que les batteries arrivent avec un flag "isBattery: true" ou via leur category_name
    const isBattery = p.isBattery || p.categories?.name === "Batteries";
    const matchesStatus = isBattery ? true : p.status === filterStatus; // Les batteries sont tjs approved pour cet exemple
    const matchesCategory = categoryFilter ? (isBattery ? "Batteries" === categoryFilter : p.categories?.name === categoryFilter) : true;
    
    return matchesStatus && matchesCategory;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // --- ACTIONS DE SUPPRESSION ---
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

      // Suppression ciblée dans les bonnes tables
      if (standardIds.length > 0) {
        await supabase.from('products').delete().in('id', standardIds);
      }
      if (batteryIds.length > 0) {
        await supabase.from('batteries').delete().in('id', batteryIds);
      }

      toast.success("Suppression réussie");
      setItemsToDelete(null);
      setSelectedIds([]);
      onRefresh();
    } catch (error) {
      toast.error("Erreur de suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      
      {/* 🔴 MODALE SUPPRESSION */}
      {itemsToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111625] border border-red-500/20 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl scale-in-center">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-500 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white uppercase italic">Confirmer la suppression ?</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 mb-6">
                L'article "{itemsToDelete[0]?.name}" sera définitivement retiré.
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setItemsToDelete(null)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Annuler</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 shadow-lg shadow-red-600/20">
                  {isDeleting ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 NAVIGATION ET FILTRES DES CATÉGORIES */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px]" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter flex items-center gap-3">
                <Package className="text-blue-500" /> Stock Global <span className="text-blue-500">Live</span>
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Gestion toutes catégories confondues</p>
            </div>

            <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
                <button onClick={() => setFilterStatus('pending')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>En attente</button>
                <button onClick={() => setFilterStatus('approved')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === 'approved' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>En ligne</button>
            </div>
          </div>

          {/* BARRE DE FILTRE CATÉGORIES */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide border-t border-white/5 pt-6">
            <Filter className="w-4 h-4 text-blue-500 shrink-0" />
            <button 
              onClick={() => setCategoryFilter(null)}
              className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${!categoryFilter ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 border border-white/5'}`}
            >
              Tout voir
            </button>
            {CATEGORIES_LIST.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 border border-white/5 hover:border-blue-500/30'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔴 GRILLE DE PRODUITS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProducts.map((p) => {
          const isBattery = p.isBattery || p.categories?.name === "Batteries";
          
          return (
            <div key={p.id} className="bg-[#111625] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col relative shadow-xl">
              
              {/* IMAGE SECTION */}
              <div className="h-48 relative overflow-hidden bg-slate-900 flex items-center justify-center">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute top-4 left-4">
                   <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase flex items-center gap-2 backdrop-blur-md border ${isBattery ? 'bg-orange-500/20 text-orange-500 border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                    {isBattery ? <Zap size={10}/> : <Tag size={10}/>} {isBattery ? "Batterie" : (p.categories?.name || "Pièce")}
                   </span>
                </div>
              </div>

              {/* CONTENU SECTION */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{p.profiles?.store_name || "Boutique Partenaire"}</p>
                <h3 className="text-sm font-black text-white uppercase italic leading-tight mb-4 group-hover:text-blue-400 transition-colors line-clamp-2">{p.name}</h3>
                
                {isBattery && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                      <p className="text-[7px] font-bold text-slate-500 uppercase">Capacité</p>
                      <p className="text-[10px] font-black text-white">{p.capacity || 'N/A'}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                      <p className="text-[7px] font-bold text-slate-500 uppercase">CCA</p>
                      <p className="text-[10px] font-black text-white">{p.cca || 'N/A'}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <p className="text-lg font-black text-white tracking-tighter">
                    {p.price.toLocaleString()} <span className="text-[10px] text-blue-500">CFA</span>
                  </p>
                  
                  <div className="flex gap-2">
                    <button onClick={() => handleDeletePrepare(p)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg">
                      <Trash2 size={16} />
                    </button>
                    <button className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 transition-all">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedProducts.length === 0 && (
        <div className="py-24 text-center bg-[#111625]/50 rounded-[3rem] border border-dashed border-white/10">
          <CheckCircle2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Aucun article trouvé dans cette sélection</p>
        </div>
      )}
    </div>
  );
}