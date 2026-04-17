import { useState } from 'react';
import { 
  CheckCircle, Ban, FileText, ShieldCheck, BadgeCheck, 
  ExternalLink, ShieldAlert, XCircle, Send, Store, User, Mail, MapPin, Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface SellersManagerProps {
  sellers: any[];
  onRefresh: () => void;
}

export default function SellersManager({ sellers, onRefresh }: SellersManagerProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null); // Pour cibler le loader sur un vendeur précis

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
          rejection_reason: null // Nettoyage du motif si existant
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

  // --- REJET AVEC MOTIF ---
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
      toast.error("Demande rejetée avec notification envoyée.");
      setRejectingId(null);
      setRejectReason("");
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ÉTAT VIDE ---
  if (!sellers || sellers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#111625]/50 border border-white/5 border-dashed rounded-[3rem] animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
          <ShieldCheck className="w-10 h-10 text-emerald-500/50" />
        </div>
        <h3 className="text-2xl font-[1000] text-slate-400 uppercase italic tracking-tighter mb-2">Registre à jour</h3>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Aucune demande de certification en attente</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      
      {/* 🔴 MODALE DE REJET (FLOTTANTE & GLASSMORPHISM) */}
      {rejectingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0B0F1A]/80 backdrop-blur-md">
          <div className="bg-[#111625] border border-red-500/20 p-8 md:p-10 rounded-[2.5rem] w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <Ban className="w-6 h-6 text-red-500" />
              <h3 className="text-white font-[1000] uppercase italic tracking-tighter text-2xl">Motif du rejet</h3>
            </div>
            <p className="text-slate-500 text-[10px] mb-8 uppercase tracking-widest font-black">
              Le vendeur recevra cette notification par email
            </p>
            
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Document RCCM illisible ou expiré. Veuillez fournir un scan de meilleure qualité..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-red-500/50 focus:bg-white/10 transition-all h-32 mb-8 resize-none placeholder:text-slate-600 text-xs"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => { setRejectingId(null); setRejectReason(""); }} 
                className="flex-1 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleReject} 
                disabled={loading}
                className="flex-1 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirmer <Send className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 HEADER SECTION */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-[1000] uppercase tracking-tighter text-white italic">Validation Partenaires</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] md:ml-9">
            {sellers.length} demande(s) d'ouverture de boutique
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <ShieldAlert className="w-4 h-4 text-blue-500" />
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Audit KYC Requis</span>
        </div>
      </div>

      {/* 🔴 LISTE DES VENDEURS */}
      <div className="grid gap-8">
        {sellers.map((s: any) => {
          const isProcessing = processingId === s.id;
          
          return (
            <div key={s.id} className="bg-[#111625] border border-white/5 p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-8 hover:border-blue-500/30 hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] transition-all group relative overflow-hidden">
              
              {/* Overlay de chargement local */}
              {isProcessing && (
                <div className="absolute inset-0 bg-[#111625]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Certification en cours...</span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                
                {/* Infos Vendeur */}
                <div className="flex gap-6 items-start">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center font-[1000] text-3xl text-blue-500 uppercase italic shadow-inner">
                    {s.store_name?.charAt(0) || <Store className="w-8 h-8 text-slate-500" />}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-2xl font-[1000] text-white uppercase tracking-tighter italic leading-none">{s.store_name || 'Boutique sans nom'}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <User className="w-3 h-3 text-slate-500" />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{s.full_name || s.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      {s.phone && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-300">
                          <Phone className="w-3 h-3 text-blue-500" /> {s.phone}
                        </span>
                      )}
                      {s.city && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-300">
                          <MapPin className="w-3 h-3 text-emerald-500" /> {s.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents KYC */}
                <div className="w-full lg:w-auto bg-black/20 p-4 rounded-[1.5rem] border border-white/5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Pièces Justificatives (KYC)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <DocPreviewButton label="Pièce ID" exists={!!s.id_url} onClick={() => openDocument(s.id_url)} />
                    <DocPreviewButton label="RCCM" exists={!!s.rccm_url} onClick={() => openDocument(s.rccm_url)} />
                    <DocPreviewButton label="Local" exists={!!s.loc_url} onClick={() => openDocument(s.loc_url)} />
                  </div>
                </div>
              </div>

              {/* Barre d'Actions Inférieure */}
              <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                
                <div className="flex flex-wrap gap-6">
                  <Benefit icon={ShieldCheck} text="Identité Vérifiée" />
                  <Benefit icon={BadgeCheck} text="Documents Complets" active={!!(s.id_url && s.rccm_url)} />
                </div>

                <div className="flex w-full md:w-auto gap-4">
                  <button 
                    onClick={() => setRejectingId(s.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-center p-4 md:px-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 group"
                    title="Rejeter la demande"
                  >
                    <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden md:inline-block ml-2 text-[9px] font-black uppercase tracking-widest">Rejeter</span>
                  </button>

                  <button 
                    onClick={() => handleApprove(s.id)}
                    disabled={isProcessing || !s.id_url || !s.rccm_url}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-[1000] uppercase text-[10px] tracking-[0.2em] hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none disabled:cursor-not-allowed group"
                  >
                    Certifier Boutique <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS OPTIMISÉS ---

function DocPreviewButton({ label, exists, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={!exists}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all w-20 h-20 md:w-24 md:h-24 ${
        exists 
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
        : 'border-white/5 bg-white/5 text-slate-600 opacity-50 cursor-not-allowed'
      }`}
    >
      <FileText className={`w-5 h-5 mb-2 ${exists ? 'text-emerald-400' : 'text-slate-600'}`} />
      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-center leading-tight">{label}</span>
      {exists && <ExternalLink className="w-3 h-3 absolute top-2 right-2 opacity-40" />}
    </button>
  );
}

function Benefit({ icon: Icon, text, active = true }: any) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
      <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
        <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-500' : 'text-slate-500'}`} />
      </div>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">{text}</span>
    </div>
  );
}