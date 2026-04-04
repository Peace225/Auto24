import { useState } from 'react';
import { 
  CheckCircle, Ban, FileText, ShieldCheck, BadgeCheck, 
  ExternalLink, ShieldAlert, XCircle, Send 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function SellersManager({ sellers, onRefresh }: any) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  const openDocument = (url: string) => {
    if (url) window.open(url, '_blank');
    else toast.error("Document non fourni");
  };

  // --- APPROBATION ---
  const handleApprove = async (sellerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'approved',
          is_verified: true,
          role: 'vendor',
          rejection_reason: null // On nettoie le motif si existant
        })
        .eq('id', sellerId);

      if (error) throw error;
      toast.success("Boutique certifiée avec succès !");
      onRefresh(); // On rafraîchit la liste des vendeurs
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- REJET AVEC MOTIF ---
  const handleReject = async () => {
    if (!rejectReason) return toast.error("Veuillez saisir un motif de rejet");
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

  if (!sellers || sellers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-[3rem] border border-slate-800 border-dashed">
        <ShieldCheck className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-white font-bold text-lg">Aucune demande en attente</h3>
        <p className="text-slate-500 text-sm mt-2">Le registre est à jour.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* MODALE DE REJET (FLOTTANTE) */}
      {rejectingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-white font-black uppercase text-xl mb-2">Motif du rejet</h3>
            <p className="text-slate-500 text-xs mb-6 uppercase tracking-widest font-bold">Le vendeur recevra ce motif par email</p>
            
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Document RCCM illisible ou expiré..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:border-blue-500 outline-none h-32 mb-6"
            />

            <div className="flex gap-4">
              <button onClick={() => setRejectingId(null)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
              <button 
                onClick={handleReject} 
                disabled={loading}
                className="flex-1 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 transition-colors"
              >
                <Send className="w-4 h-4" /> Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-[1000] uppercase tracking-tighter text-white">Validation & Conformité</h2>
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mt-2">Audit des pièces justificatives</p>
        </div>
      </div>

      {/* LISTE DES VENDEURS */}
      <div className="grid gap-6">
        {sellers.map((s: any) => (
          <div key={s.id} className="bg-slate-900/60 border border-slate-800 p-8 rounded-[3rem] flex flex-col gap-6 hover:border-slate-700 transition-all">
            
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex gap-6">
                <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xl text-blue-500 uppercase">
                  {s.store_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">{s.store_name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Gérant : {s.full_name || s.email}</p>
                </div>
              </div>

              {/* DOCUMENTS */}
              <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
                <DocPreviewButton label="ID" exists={!!s.id_url} onClick={() => openDocument(s.id_url)} />
                <DocPreviewButton label="RCCM" exists={!!s.rccm_url} onClick={() => openDocument(s.rccm_url)} />
                <DocPreviewButton label="LOCAL" exists={!!s.loc_url} onClick={() => openDocument(s.loc_url)} />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-6">
                <Benefit icon={ShieldCheck} text="Vérifié par Admin" />
                <Benefit icon={BadgeCheck} text="Kyc complet" />
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setRejectingId(s.id)}
                  className="p-4 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500/10 transition-all"
                  title="Rejeter la demande"
                >
                  <XCircle className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => handleApprove(s.id)}
                  disabled={loading || !s.id_url || !s.rccm_url}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex-1 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Approuver & Certifier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function DocPreviewButton({ label, exists, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={!exists}
      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all w-24 h-24 ${
        exists 
        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10' 
        : 'border-slate-800 text-slate-700 opacity-50'
      }`}
    >
      <FileText className="w-5 h-5 mb-2" />
      <span className="text-[8px] font-black uppercase tracking-widest text-center">{label}</span>
      {exists && <ExternalLink className="w-3 h-3 absolute top-2 right-2 opacity-50" />}
    </button>
  );
}

function Benefit({ icon: Icon, text }: any) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-blue-500" />
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{text}</span>
    </div>
  );
}