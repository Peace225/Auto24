import { useState } from 'react';
import {
  CheckCircle, Ban, FileText, ShieldCheck,
  Store, User, MapPin, Loader2, Trash2, Package, X, Eye
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface SellersManagerProps {
  sellers: any[];
  onRefresh: () => void;
  setActiveTab?: (tab: string) => void;
}

const PLANS = {
  standard: { label: 'Standard', color: 'bg-slate-500/20 text-slate-400' },
  pro: { label: 'Pro', color: 'bg-amber-500/20 text-amber-400' },
  premium: { label: 'Premium', color: 'bg-violet-500/20 text-violet-400' },
};

export default function SellersManager({ sellers, onRefresh }: SellersManagerProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const openDocument = (url: string) => {
    if (url) window.open(url, '_blank');
    else toast.error("Document non fourni");
  };

  const handleApprove = async (sellerId: string) => {
    setProcessingId(sellerId);
    try {
      const { error } = await supabase
      .from('profiles')
      .update({
          status: 'approved',
          is_verified: true,
          role: 'vendor',
          rejection_reason: null,
          subscription_plan: 'standard',
          subscription_status: 'active'
        })
      .eq('id', sellerId);
      if (error) throw error;
      toast.success("Boutique certifiée!");
      onRefresh();
    } catch {
      toast.error("Erreur d'approbation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Motif requis");
    setLoading(true);
    try {
      await supabase
      .from('profiles')
      .update({ status: 'rejected', is_verified: false, rejection_reason: rejectReason })
      .eq('id', rejectingId);
      toast.error("Demande rejetée");
      setRejectingId(null);
      setRejectReason("");
      onRefresh();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    try {
      await supabase.from('profiles').delete().eq('id', storeToDelete.id);
      toast.success("Boutique supprimée");
      setStoreToDelete(null);
      onRefresh();
    } catch {
      toast.error("Erreur suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const openStoreProducts = async (store: any) => {
    setSelectedStore(store);
    setLoadingProducts(true);
    const { data } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', store.id)
    .order('created_at', { ascending: false });
    setStoreProducts(data || []);
    setLoadingProducts(false);
  };

  const handleApproveProduct = async (productId: string) => {
    await supabase.from('products').update({ status: 'active', is_official: true }).eq('id', productId);
    toast.success("Produit validé");
    openStoreProducts(selectedStore);
  };

  const handleRejectProduct = async (productId: string) => {
    await supabase.from('products').update({ status: 'rejected' }).eq('id', productId);
    toast.error("Produit rejeté");
    openStoreProducts(selectedStore);
  };

  const pendingSellers = sellers.filter(s => s.status === 'pending' || (s.role === 'vendor' &&!s.is_verified && s.status!== 'rejected'));
  const approvedSellers = sellers.filter(s => s.status === 'approved' || s.is_verified);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">

      {/* MODALE PRODUITS */}
      {selectedStore && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl w-full max-w-5xl max-h- overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Store className="text-amber-500" size={24} />
                <div>
                  <h3 className="text-xl font-black text-white">{selectedStore.store_name}</h3>
                  <p className="text-xs text-slate-500">{storeProducts.length} produits</p>
                </div>
                <span className={`text- px-2 py-1 rounded-lg font-bold ${PLANS[selectedStore.subscription_plan as keyof typeof PLANS]?.color || PLANS.standard.color}`}>
                  {PLANS[selectedStore.subscription_plan as keyof typeof PLANS]?.label || 'Standard'}
                </span>
              </div>
              <button onClick={() => setSelectedStore(null)} className="p-2 hover:bg-white/10 rounded-xl"><X size={20} className="text-white" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {loadingProducts? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
              ) : storeProducts.length === 0? (
                <p className="text-center text-slate-500 py-20">Aucun produit</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {storeProducts.map(p => (
                    <div key={p.id} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-black">
                        <img src={p.images?.[0] || '/placeholder.png'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <p className="text-xs font-bold truncate text-white mb-1">{p.name}</p>
                      <p className="text-sm text-amber-500 font-black mb-3">{Number(p.price)?.toLocaleString()} F</p>
                      <div className="flex gap-1.5">
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveProduct(p.id)} className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text- font-black text-white">Valider</button>
                            <button onClick={() => handleRejectProduct(p.id)} className="px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"><Ban size={14} /></button>
                          </>
                        )}
                        {p.status === 'active' && <span className="text- text-emerald-400 font-bold">✓ Actif</span>}
                        {p.status === 'rejected' && <span className="text- text-red-400 font-bold">✗ Rejeté</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE REJET */}
      {rejectingId && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111625] border border-white/10 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-white font-black mb-4">Motif du rejet</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" placeholder="Documents illisibles..." />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectingId(null)} className="flex-1 py-2.5 bg-white/10 rounded-xl text-white font-bold">Annuler</button>
              <button onClick={handleReject} disabled={loading} className="flex-1 py-2.5 bg-red-600 rounded-xl text-white font-bold">{loading? '...' : 'Rejeter'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION */}
      {storeToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
          <div className="bg-[#111625] border border-red-500/20 p-8 rounded-3xl w-full max-w-sm text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">Supprimer?</h3>
            <p className="text-sm text-slate-400 mb-6">"{storeToDelete.name}" sera définitivement supprimée</p>
            <div className="flex gap-3">
              <button onClick={() => setStoreToDelete(null)} className="flex-1 py-3 bg-white/10 rounded-xl text-white font-bold">Annuler</button>
              <button onClick={confirmDeleteStore} disabled={isDeleting} className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                {isDeleting? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOUTIQUES EN ATTENTE */}
      <div className="bg-[#0B0F19] border border-amber-500/20 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-black text-amber-500 uppercase">En attente ({pendingSellers.length})</h2>
        </div>
        <div className="space-y-3">
          {pendingSellers.length === 0 && <p className="text-slate-500 text-center py-8 text-sm">Aucune demande</p>}
          {pendingSellers.map((s: any) => (
            <div key={s.id} className="bg-black/40 border border-white/10 p-4 rounded-2xl hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center cursor-pointer flex-1" onClick={() => openStoreProducts(s)}>
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                    {s.avatar_url? <img src={s.avatar_url} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-amber-500" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{s.store_name || 'Sans nom'}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1"><User size={12}/> {s.full_name} • <MapPin size={12}/> {s.commune || 'Abidjan'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openDocument(s.id_card_url || s.business_license_url)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl" title="Documents"><FileText size={16} className="text-slate-400" /></button>
                  <button onClick={() => setRejectingId(s.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl" title="Rejeter"><Ban size={16} className="text-red-400" /></button>
                  <button onClick={() => handleApprove(s.id)} disabled={processingId === s.id} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black text-white uppercase flex items-center gap-1.5">
                    {processingId === s.id? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Valider
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOUTIQUES VALIDÉES */}
      <div className="bg-[#0B0F19] border border-emerald-500/20 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-black text-emerald-500 uppercase">Validées ({approvedSellers.length})</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {approvedSellers.map((s: any) => (
            <div key={s.id} className="bg-black/40 border border-white/10 p-4 rounded-2xl hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => openStoreProducts(s)}>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                    {s.avatar_url? <img src={s.avatar_url} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{s.store_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text- px-2 py-0.5 rounded font-bold ${PLANS[s.subscription_plan as keyof typeof PLANS]?.color || PLANS.standard.color}`}>
                        {PLANS[s.subscription_plan as keyof typeof PLANS]?.label || 'Standard'}
                      </span>
                      <span className="text- text-slate-500">{s.product_count || 0} produits</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(s.id, s.store_name); }} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                  <Eye size={16} className="text-slate-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}