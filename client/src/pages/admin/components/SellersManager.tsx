import { useState } from 'react';
import { 
  CheckCircle, Ban, FileText, ShieldCheck, BadgeCheck, 
  ExternalLink, ShieldAlert, XCircle, Send, Store, User, Mail, MapPin, Loader2, Trash2, Package, Users, X
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

  // 🟢 NOUVEAUX ÉTATS POUR LA MODALE DE SUPPRESSION DE BOUTIQUE
  const [storeToDelete, setStoreToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDocument = (url: string) => {
    if (url) window.open(url, '_blank');
    else toast.error("Document non fourni");
  };

  // --- APPROBATION ---
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
      toast.success("Boutique certifiée avec succès !");
      onRefresh(); 
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // --- REJET ---
  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Veuillez saisir un motif de rejet");
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          is_verified: false,
          rejection_reason: rejectReason
        })
        .eq('id', rejectingId);

      if (error) throw error;
      toast.error("Demande rejetée.");
      setRejectingId(null);
      setRejectReason("");
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 🟢 ÉTAPE 1 : OUVRE LA MODALE DE SUPPRESSION ---
  const handleDeleteClick = (storeId: string, storeName: string) => {
    setStoreToDelete({ id: storeId, name: storeName });
  };

  // --- 🟢 ÉTAPE 2 : EXÉCUTE LA VRAIE SUPPRESSION ---
  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', storeToDelete.id);

      if (error) throw error;
      toast.success(`La boutique "${storeToDelete.name}" et ses produits ont été supprimés.`);
      setStoreToDelete(null); // Ferme la modale
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage intelligent
  const displayedSellers = sellers.filter(s => {
    if (filter === 'pending') return s.status === 'pending' || (s.role === 'vendor' && !s.is_verified && s.status !== 'rejected');
    return s.status === 'approved' || s.is_verified === true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      
      {/* 🔴 MODALE DE SUPPRESSION DE BOUTIQUE (STYLE PREMIUM) */}
      {storeToDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0B0F1A]/80 backdrop-blur-md">
          <div className="bg-[#111625] border border-red-500/20 p-8 md:p-10 rounded-[2.5rem] w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-inner">
                <Store className="w-10 h-10 text-red-500" />
              </div>
              
              <h3 className="text-2xl font-[1000] uppercase italic tracking-tighter text-white mb-2">
                Supprimer Boutique
              </h3>
              
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed mb-6">
                Êtes-vous sûr de vouloir effacer <br/>
                <span className="text-white bg-white/5 px-2 py-1 rounded-md mx-1 border border-white/10">"{storeToDelete.name}"</span> ? <br/><br/>
                <span className="text-red-400">⚠️ TOUS ses produits seront supprimés.</span>
              </p>

              <div className="flex w-full gap-4 mt-4">
                <button 
                  onClick={() => setStoreToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/5"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDeleteStore}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setStoreToDelete(null)} 
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* MODALE REJET */}
      {rejectingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0B0F1A]/80 backdrop-blur-md">
          <div className="bg-[#111625] border border-red-500/20 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Ban className="w-6 h-6 text-red-500" />
              <h3 className="text-white font-[1000] uppercase italic tracking-tighter text-2xl">Motif du rejet</h3>
            </div>
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez pourquoi le dossier est rejeté..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-red-500/50 h-32 mb-8 resize-none text-xs"
            />
            <div className="flex gap-4">
              <button onClick={() => setRejectingId(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Annuler</button>
              <button onClick={handleReject} disabled={loading} className="flex-1 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER AVEC ONGLETS */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between gap-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-[1000] uppercase tracking-tighter text-white italic">Gestion Partenaires</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] md:ml-9">
            {displayedSellers.length} boutique(s) affichée(s)
          </p>
        </div>

        <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 relative z-10">
          <button onClick={() => setFilter('pending')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
            Dossiers
          </button>
          <button onClick={() => setFilter('approved')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'approved' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
            Actifs
          </button>
        </div>
      </div>

      {/* LISTE DES BOUTIQUES */}
      {displayedSellers.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-24 bg-[#111625]/50 rounded-[3rem] border border-white/5 border-dashed animate-in fade-in duration-500">
           <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-4" />
           <h2 className="text-xl font-[1000] text-slate-400 uppercase italic tracking-tighter">Aucun résultat</h2>
         </div>
      ) : (
        <div className="grid gap-8">
          {displayedSellers.map((s: any) => (
            <div key={s.id} className="bg-[#111625] border border-white/5 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all relative overflow-hidden">
              {processingId === s.id && (
                <div className="absolute inset-0 bg-[#111625]/80 backdrop-blur-sm z-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              )}
              
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex gap-6 items-start">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center font-[1000] text-3xl text-blue-500 uppercase overflow-hidden">
                    {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : <Store />}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-[1000] text-white uppercase italic">{s.store_name || "Boutique"}</h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><User size={12}/> {s.full_name || "Admin"}</span>
                      {s.commune && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> {s.commune || s.city}</span>}
                    </div>
                  </div>
                </div>

                {/* KYC - Uniquement si présent */}
                {(s.id_url || s.rccm_url) && (
                  <div className="grid grid-cols-3 gap-3">
                    <DocPreviewButton label="ID" exists={!!s.id_url} onClick={() => openDocument(s.id_url)} />
                    <DocPreviewButton label="RCCM" exists={!!s.rccm_url} onClick={() => openDocument(s.rccm_url)} />
                  </div>
                )}
              </div>

              <div className="pt-8 mt-8 border-t border-white/5 flex flex-wrap justify-between items-center gap-6">
                 <div className="flex gap-4">
                    <Benefit icon={ShieldCheck} text="Certifié" active={s.is_verified} />
                    <Benefit icon={Package} text="Vendeur VIP" active={s.role === 'vendor'} />
                 </div>

                 <div className="flex gap-4 w-full md:w-auto">
                   {/* 🔴 BOUTON SUPPRIMER (Ouvre la modale au lieu du window.confirm) */}
                   <button 
                    onClick={() => handleDeleteClick(s.id, s.store_name || "Boutique Inconnue")}
                    className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    title="Supprimer la boutique"
                   >
                     <Trash2 size={18} />
                   </button>

                   {filter === 'pending' ? (
                     <button onClick={() => handleApprove(s.id)} className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">
                       Valider Boutique
                     </button>
                   ) : (
                     <button 
                      onClick={() => {
                        localStorage.setItem('admin_product_filter_vendor', s.id);
                        if (setActiveTab) setActiveTab('products');
                      }}
                      className="flex-1 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
                     >
                       Voir Catalogue
                     </button>
                   )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sous-composants
function DocPreviewButton({ label, exists, onClick }: any) {
  return (
    <button onClick={onClick} disabled={!exists} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${exists ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : 'opacity-20'}`}>
      <FileText size={20} />
      <span className="text-[8px] font-black uppercase">{label}</span>
    </button>
  );
}

function Benefit({ icon: Icon, text, active }: any) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-blue-500' : 'text-slate-700'}`}>
      <Icon size={14} />
      <span className="text-[9px] font-black uppercase tracking-widest">{text}</span>
    </div>
  );
}