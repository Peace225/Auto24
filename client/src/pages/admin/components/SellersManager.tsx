import { useState } from 'react';
import { 
  CheckCircle, Ban, FileText, ShieldCheck, 
  Store, User, MapPin, Loader2, Trash2, Package, Users, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface SellersManagerProps {
  sellers: any[];
  onRefresh: () => void;
  setActiveTab?: (tab: string) => void;
}

export default function SellersManager({ sellers, onRefresh, setActiveTab }: SellersManagerProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');

  const [storeToDelete, setStoreToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          rejection_reason: null 
        })
        .eq('id', sellerId);

      if (error) throw error;
      toast.success("Boutique certifiée !");
      onRefresh(); 
    } catch (error: any) {
      toast.error("Erreur d'approbation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Motif requis");
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected', is_verified: false, rejection_reason: rejectReason })
        .eq('id', rejectingId);

      if (error) throw error;
      toast.error("Demande rejetée.");
      setRejectingId(null);
      setRejectReason("");
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur de rejet");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (storeId: string, storeName: string) => {
    setStoreToDelete({ id: storeId, name: storeName });
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', storeToDelete.id);
      if (error) throw error;
      toast.success("Boutique supprimée");
      setStoreToDelete(null);
      onRefresh();
    } catch (error) {
      toast.error("Erreur de suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedSellers = sellers.filter(s => {
    if (filter === 'pending') return s.status === 'pending' || (s.role === 'vendor' && !s.is_verified && s.status !== 'rejected');
    return s.status === 'approved' || s.is_verified === true;
  });

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 🔴 MODALE SUPPRESSION COMPACTE */}
      {storeToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#111625] border border-red-500/20 p-5 md:p-10 rounded-2xl md:rounded-[2.5rem] w-full max-w-xs md:max-w-md shadow-2xl relative">
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4 md:mb-6 border border-red-500/20">
                <Store className="w-6 h-6 md:w-10 md:h-10 text-red-500" />
              </div>
              <h3 className="text-lg md:text-2xl font-black uppercase italic text-white mb-2">Supprimer ?</h3>
              <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed mb-6">
                Supprimer <span className="text-white">"{storeToDelete.name}"</span> ? <br/>
                <span className="text-red-400">⚠️ Action irréversible.</span>
              </p>
              <div className="flex w-full gap-2 md:gap-4">
                <button onClick={() => setStoreToDelete(null)} className="flex-1 py-2.5 md:py-4 bg-white/5 text-slate-300 rounded-xl font-black uppercase text-[9px] md:text-[10px]">Annuler</button>
                <button onClick={confirmDeleteStore} className="flex-1 bg-red-600 text-white rounded-xl font-black uppercase text-[9px] md:text-[10px] flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER AVEC ONGLETS COMPACTS */}
      <div className="bg-[#111625] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 flex flex-col md:flex-row justify-between gap-4 md:gap-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <Users className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
            <h2 className="text-lg md:text-2xl font-[1000] uppercase tracking-tighter text-white italic">Partenaires</h2>
          </div>
          <p className="text-[7px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest md:ml-9">
            {displayedSellers.length} boutique(s)
          </p>
        </div>

        <div className="flex p-1 bg-black/40 rounded-lg md:rounded-2xl border border-white/5 self-end md:self-auto">
          <button onClick={() => setFilter('pending')} className={`px-3 md:px-6 py-1.5 md:py-3 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
            Dossiers
          </button>
          <button onClick={() => setFilter('approved')} className={`px-3 md:px-6 py-1.5 md:py-3 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'approved' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
            Actifs
          </button>
        </div>
      </div>

      {/* LISTE DES BOUTIQUES (Cartes compactes) */}
      <div className="grid gap-3 md:gap-8">
        {displayedSellers.map((s: any) => (
          <div key={s.id} className="bg-[#111625] border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden group">
            {processingId === s.id && (
              <div className="absolute inset-0 bg-[#111625]/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8">
              <div className="flex gap-4 md:gap-6 items-start">
                <div className="h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center font-[1000] text-lg md:text-3xl text-blue-500 uppercase overflow-hidden">
                  {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : <Store size={20} className="md:size-8" />}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base md:text-2xl font-[1000] text-white uppercase italic truncate max-w-[150px] md:max-w-none">{s.store_name || "Boutique"}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><User size={10}/> {s.full_name || "Admin"}</span>
                    {s.commune && <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><MapPin size={10}/> {s.commune}</span>}
                  </div>
                </div>
              </div>

              {(s.id_url || s.rccm_url) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full md:w-auto">
                  <DocPreviewButton label="ID" exists={!!s.id_url} onClick={() => openDocument(s.id_url)} />
                  <DocPreviewButton label="RCCM" exists={!!s.rccm_url} onClick={() => openDocument(s.rccm_url)} />
                </div>
              )}
            </div>

            <div className="pt-4 md:pt-8 mt-4 md:mt-8 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
               <div className="flex gap-3">
                  <Benefit icon={ShieldCheck} text="Certifié" active={s.is_verified} />
                  <Benefit icon={Package} text="Vendeur" active={s.role === 'vendor'} />
               </div>

               <div className="flex gap-2 w-full md:w-auto">
                 <button 
                  onClick={() => handleDeleteClick(s.id, s.store_name || "Boutique")}
                  className="p-2.5 md:p-4 bg-red-500/10 text-red-500 rounded-xl md:rounded-2xl hover:bg-red-50"
                 >
                   <Trash2 size={16} className="md:size-18" />
                 </button>

                 {filter === 'pending' ? (
                   <button onClick={() => handleApprove(s.id)} className="flex-1 px-4 md:px-8 py-2.5 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest">
                     Valider
                   </button>
                 ) : (
                   <button 
                    onClick={() => {
                      localStorage.setItem('admin_product_filter_vendor', s.id);
                      if (setActiveTab) setActiveTab('products');
                    }}
                    className="flex-1 px-4 md:px-8 py-2.5 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest"
                   >
                     Catalogue
                   </button>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocPreviewButton({ label, exists, onClick }: any) {
  return (
    <button onClick={onClick} disabled={!exists} className={`p-2.5 md:p-4 rounded-lg md:rounded-xl border flex flex-col items-center gap-1 md:gap-2 transition-all ${exists ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : 'opacity-20'}`}>
      <FileText size={16} className="md:size-5" />
      <span className="text-[7px] md:text-[8px] font-black uppercase">{label}</span>
    </button>
  );
}

function Benefit({ icon: Icon, text, active }: any) {
  return (
    <div className={`flex items-center gap-1.5 ${active ? 'text-blue-500' : 'text-slate-700'}`}>
      <Icon size={12} className="md:size-4" />
      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">{text}</span>
    </div>
  );
}