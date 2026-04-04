import { useState } from 'react';
import { 
  MessageSquare, AlertCircle, Gavel, 
  ExternalLink, Scale, Clock, 
  ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function DisputesManager({ disputes = [], onRefresh }: any) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // --- LOGIQUE GOD MODE : TRANCHER LE LITIGE ---
  const handleResolveDispute = async (disputeId: string, decision: 'resolved' | 'closed') => {
    if (!window.confirm(`Voulez-vous marquer ce litige comme ${decision === 'resolved' ? 'résolu' : 'classé'} ?`)) return;

    setIsProcessing(disputeId);
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ 
          status: decision,
          resolved_at: new Date().toISOString(),
          admin_action: true 
        })
        .eq('id', disputeId);

      if (error) throw error;
      
      toast.success(`Litige ${decision === 'resolved' ? 'réglé' : 'fermé'} avec succès.`);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error("Erreur d'arbitrage : " + error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  // Mock data si la liste est vide (pour le développement)
  const displayDisputes = disputes.length > 0 ? disputes : [
    { id: 'LIT-04', shop: 'Auto-Parts CI', issue: 'Produit non conforme', severity: 'High', date: 'Il y a 2h' },
    { id: 'LIT-07', shop: 'MecaPro', issue: 'Retard livraison > 48h', severity: 'Medium', date: 'Il y a 5h' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header Statutaire */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-red-500" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Arbitrage Haute Cour</span>
          </div>
          <h2 className="text-3xl font-[1000] uppercase tracking-tighter text-white">Centre de Litiges</h2>
        </div>
        
        <div className="flex items-center gap-6 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">En attente</span>
            <span className="text-xl font-black text-white">{displayDisputes.length}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col text-right">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Délai moyen</span>
            <span className="text-xl font-black text-emerald-500">4.2h</span>
          </div>
        </div>
      </div>

      {/* Liste des Litiges */}
      <div className="grid gap-6">
        {displayDisputes.map((dispute) => (
          <div 
            key={dispute.id} 
            className="group relative bg-[#111625] border border-white/5 p-8 rounded-[3rem] hover:border-red-500/30 transition-all duration-500"
          >
            {/* Lueur de sévérité en background */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 rounded-full transition-all group-hover:opacity-20 ${
              dispute.severity === 'High' ? 'bg-red-600' : 'bg-amber-600'
            }`} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
              
              <div className="flex gap-6">
                {/* Icone Sévérité */}
                <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center border transition-transform group-hover:scale-105 ${
                  dispute.severity === 'High' 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                }`}>
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-white bg-white/10 px-3 py-1 rounded-lg tracking-widest">
                      {dispute.id}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-tight">{dispute.date}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                    {dispute.issue}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center">
                      <ShieldAlert className="w-2.5 h-2.5 text-slate-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                      Dossier ouvert contre : <span className="text-blue-500">{dispute.shop}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Super Admin */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {/* Chat avec les parties */}
                <button className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  <MessageSquare className="w-4 h-4" /> 
                  Ouvrir le Chat
                </button>

                {/* Trancher (Arbitrage) */}
                <button 
                  onClick={() => handleResolveDispute(dispute.id, 'resolved')}
                  disabled={isProcessing === dispute.id}
                  className="flex-1 md:flex-none px-8 py-4 bg-red-600 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  <Gavel className={`w-4 h-4 ${isProcessing === dispute.id ? 'animate-bounce' : ''}`} /> 
                  Trancher
                </button>
              </div>

            </div>

            {/* Barre de progression/status discrète */}
            <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className={`h-full rounded-full ${dispute.severity === 'High' ? 'bg-red-600' : 'bg-amber-500'} w-1/3 opacity-30`} />
            </div>
          </div>
        ))}

        {displayDisputes.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-20" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Paix totale : Aucun litige en cours</p>
          </div>
        )}
      </div>
    </div>
  );
}