import { useState, useEffect } from 'react';
import { 
  Package, Check, Ban, Eye, ShieldAlert, 
  Store, Tag, Loader2, CheckCircle2, Trash2, FilterX, AlertTriangle, X, CheckSquare, Square
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ProductsManagerProps {
  products: any[];
  onApprove: () => void;
  onReject: () => void;
}

export default function ProductsManager({ products, onApprove, onReject }: ProductsManagerProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // 🟢 NOUVEAUX ÉTATS POUR LA SÉLECTION MULTIPLE ET LA MODALE
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // itemsToDelete est maintenant un tableau pour gérer 1 ou plusieurs produits
  const [itemsToDelete, setItemsToDelete] = useState<{id: string, name: string}[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasPending = products.some(p => p.status === 'pending');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved'>(
    hasPending ? 'pending' : 'approved'
  );
  
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);

  // 🟢 Vider la sélection si on change d'onglet (sécurité)
  useEffect(() => {
    setSelectedIds([]);
  }, [filterStatus, vendorFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('products-admin-live-updates')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        () => {
          onApprove();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onApprove]);

  useEffect(() => {
    const savedVendorId = localStorage.getItem('admin_product_filter_vendor');
    if (savedVendorId) {
      setVendorFilter(savedVendorId);
      setFilterStatus('approved');
      localStorage.removeItem('admin_product_filter_vendor'); 
    }
  }, []);

  // --- LOGIQUE DE SÉLECTION ---
  const displayedProducts = products.filter(p => {
    const matchesStatus = p.status === filterStatus;
    const matchesVendor = vendorFilter ? p.vendor_id === vendorFilter : true;
    return matchesStatus && matchesVendor;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedProducts.length) {
      setSelectedIds([]); // Tout décocher
    } else {
      setSelectedIds(displayedProducts.map(p => p.id)); // Tout cocher
    }
  };

  // --- ACTIONS ---
  const handleApproveProduct = async (productId: string) => {
    setProcessingId(productId);
    try {
      const { error } = await supabase.from('products').update({ status: 'approved' }).eq('id', productId);
      if (error) throw error;
      toast.success("Produit validé !");
    } catch (error: any) {
      toast.error("Erreur lors de la validation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBanProduct = async (productId: string) => {
    if (!window.confirm("Rejeter ce produit et le renvoyer au vendeur ?")) return;
    setProcessingId(productId);
    try {
      const { error } = await supabase.from('products').update({ status: 'rejected', is_active: false }).eq('id', productId);
      if (error) throw error;
      toast.success("Produit rejeté.");
    } catch (error: any) {
      toast.error("Erreur lors du rejet.");
    } finally {
      setProcessingId(null);
    }
  };

  // 🟢 PRÉPARATION DE LA SUPPRESSION (Simple ou Multiple)
  const handleDeleteSingle = (productId: string, productName: string) => {
    setItemsToDelete([{ id: productId, name: productName }]);
  };

  const handleDeleteBulk = () => {
    const items = displayedProducts
      .filter(p => selectedIds.includes(p.id))
      .map(p => ({ id: p.id, name: p.name }));
    setItemsToDelete(items);
  };

  // 🟢 EXÉCUTION DE LA SUPPRESSION
  const confirmDelete = async () => {
    if (!itemsToDelete || itemsToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      const idsToDelete = itemsToDelete.map(item => item.id);
      
      // La magie Supabase : .in() permet de supprimer plusieurs IDs d'un coup !
      const { error } = await supabase.from('products').delete().in('id', idsToDelete);
      
      if (error) throw error;
      
      toast.success(`${itemsToDelete.length} produit(s) supprimé(s).`);
      setItemsToDelete(null);
      setSelectedIds([]); // On vide la sélection
      onApprove(); // On rafraîchit la liste
    } catch (error: any) {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingCount = products.filter(p => p.status === 'pending').length;
  const approvedCount = products.filter(p => p.status === 'approved').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative pb-24">
      
      {/* 🔴 MODALE DE SUPPRESSION (ADAPTÉE POUR MULTIPLE) */}
      {itemsToDelete && itemsToDelete.length > 0 && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0B0F1A]/80 backdrop-blur-md">
          <div className="bg-[#111625] border border-red-500/20 p-8 md:p-10 rounded-[2.5rem] w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-inner">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              
              <h3 className="text-2xl font-[1000] uppercase italic tracking-tighter text-white mb-2">
                Suppression {itemsToDelete.length > 1 ? 'Multiple' : ''}
              </h3>
              
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed mb-6">
                Êtes-vous sûr de vouloir effacer <br/>
                {itemsToDelete.length === 1 ? (
                   <span className="text-white bg-white/5 px-2 py-1 rounded-md mx-1 border border-white/10">"{itemsToDelete[0].name}"</span>
                ) : (
                   <span className="text-white bg-white/5 px-2 py-1 rounded-md mx-1 border border-white/10">ces {itemsToDelete.length} articles</span>
                )}
                <br/> Cette action est irréversible.
              </p>

              <div className="flex w-full gap-4 mt-4">
                <button 
                  onClick={() => setItemsToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/5"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setItemsToDelete(null)} 
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl flex flex-col gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-[1000] uppercase tracking-tighter text-white italic">Modération Catalogue</h2>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] md:ml-9">
              {displayedProducts.length} article(s) affiché(s) en temps réel
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            {vendorFilter && (
              <button onClick={() => setVendorFilter(null)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all">
                <FilterX size={12} className="mr-2" /> Voir tout le catalogue
              </button>
            )}

            <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md relative z-10">
              <button 
                onClick={() => setFilterStatus('pending')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'pending' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Dossiers 
                {pendingCount > 0 && <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[8px]">{pendingCount}</span>}
              </button>
              <button 
                onClick={() => setFilterStatus('approved')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'approved' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                En Ligne
                {approvedCount > 0 && <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[8px]">{approvedCount}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* 🟢 BARRE D'OUTILS "SÉLECTIONNER TOUT" */}
        {displayedProducts.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.length === displayedProducts.length && displayedProducts.length > 0 ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-black/20'}`}>
                {selectedIds.length === displayedProducts.length && displayedProducts.length > 0 && <Check size={12} className="text-white" />}
              </div>
              Tout Sélectionner
            </button>
          </div>
        )}
      </div>

      {displayedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#111625]/50 rounded-[3rem] border border-white/5 border-dashed animate-in fade-in duration-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-4" />
          <h2 className="text-xl font-[1000] text-slate-400 uppercase italic tracking-tighter">Aucun article ici</h2>
          <p className="text-[10px] text-slate-600 font-black uppercase mt-2 italic tracking-widest">
            {filterStatus === 'pending' ? 'Tous les produits ont été traités' : 'Le catalogue en ligne est vide'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {displayedProducts.map((p: any) => (
            <div 
              key={p.id} 
              onClick={() => toggleSelection(p.id)} // Clic sur la carte sélectionne le produit
              className={`bg-[#111625] border rounded-[2.5rem] overflow-hidden group transition-all duration-300 flex flex-col relative shadow-xl cursor-pointer ${selectedIds.includes(p.id) ? 'border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'border-white/5 hover:border-blue-500/30'}`}
            >
              
              {/* 🟢 CHECKBOX SUR LA CARTE */}
              <div className="absolute top-4 right-4 z-20">
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${selectedIds.includes(p.id) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/50 border-white/20 text-transparent group-hover:border-white/50'}`}>
                  <Check size={14} className={selectedIds.includes(p.id) ? 'opacity-100' : 'opacity-0'} />
                </div>
              </div>

              {processingId === p.id && (
                <div className="absolute inset-0 bg-[#111625]/80 backdrop-blur-sm z-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              )}

              <div className="relative h-56 overflow-hidden bg-slate-900 flex items-center justify-center border-b border-white/5">
                <img 
                  src={p.image_url} 
                  className={`h-full w-full object-cover transition-all duration-700 ${selectedIds.includes(p.id) ? 'opacity-50 scale-105' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'}`} 
                  alt={p.name} 
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[8px] font-black text-white uppercase flex items-center gap-2">
                    <Tag className="w-3 h-3 text-blue-500" /> {p.categories?.name || 'Article'}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4 p-2.5 bg-white/5 border border-white/5 rounded-xl w-fit">
                  <Store className="w-3 h-3 text-purple-400" />
                  <p className="text-[9px] text-slate-300 font-black uppercase truncate max-w-[150px]">
                    {p.profiles?.store_name || 'Vendeur Inconnu'}
                  </p>
                </div>
                
                <h3 className="text-lg font-[1000] text-white uppercase italic tracking-tighter mb-4 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {p.name}
                </h3>
                
                <div className="mt-auto mb-8 flex items-baseline gap-2">
                  <span className="text-2xl font-[1000] text-white italic tracking-tighter">
                    {new Intl.NumberFormat('fr-FR').format(p.price)}
                  </span>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">FCFA</span>
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                  {filterStatus === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleBanProduct(p.id)} 
                        className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                        title="Rejeter"
                      >
                        <Ban size={20}/>
                      </button>
                      <button 
                        onClick={() => handleApproveProduct(p.id)} 
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-[1000] text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                      >
                        Valider la pièce
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleDeleteSingle(p.id, p.name)} 
                        className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg z-10 relative"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={20}/>
                      </button>
                      <button className="flex-1 py-4 bg-white/5 border border-white/5 text-slate-300 rounded-2xl font-[1000] text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 z-10 relative">
                        <Eye size={16} /> Détails
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🟢 BARRE FLOTTANTE D'ACTION MULTIPLE */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-[#111625]/90 backdrop-blur-xl border border-red-500/30 px-6 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center gap-3 pr-4 border-r border-white/10">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
              {selectedIds.length}
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest hidden sm:block">
              Sélectionné(s)
            </span>
          </div>
          
          <button 
            onClick={() => setSelectedIds([])}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Annuler
          </button>
          
          <button 
            onClick={handleDeleteBulk}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}