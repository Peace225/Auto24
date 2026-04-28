import { useState } from 'react';
import { 
  MessageSquare, AlertCircle, Gavel, 
  Scale, Clock, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function DisputesManager({ disputes = [], onRefresh }: any) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

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
      
      toast.success(`Litige ${decision === 'resolved' ? 'réglé' : 'fermé'}.`);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error("Erreur d'arbitrage");
    } finally {
      setIsProcessing(null);
    }
  };

  const displayDisputes = disputes.length > 0 ? disputes : [
    { id: 'LIT-04', shop: 'Auto-Parts CI', issue: 'Produit non conforme', severity: 'High', date: 'Il y a 2h' },
    { id: 'LIT-07', shop: 'MecaPro', issue: 'Retard livraison > 48h', severity: 'Medium', date: 'Il y a 5h' }
  ];

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 🟢 HEADER STATUTAIRE COMPACT */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 md:mb-2">
            <Scale className="w-3.5 h-3.5 md:w-5 md:h-5 text-red-500" />
            <span className="text-[7px] md:text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Arbitrage Haute Cour</span>
          </div>
          <h2 className="text-lg md:text-3xl font-[1000] uppercase tracking-tighter text-white">Centre de Litiges</h2>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6 px-4 py-2 md:px-6 md:py-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl self-start md:self-auto">
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">En attente</span>
            <span className="text-sm md:text-xl font-black text-white">{displayDisputes.length}</span>
          </div>
          <div className="h-6 md:h-8 w-px bg-white/10" />
          <div className="flex flex-col text-right">
            <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Délai moyen</span>
            <span className="text-sm md:text-xl font-black text-emerald-500">4.2h</span>
          </div>
        </div>
      </div>

      {/* 🟢 LISTE DES LITIGES (CARTES MINIATURISÉES) */}
      <div className="grid gap-3 md:gap-6">
        {displayDisputes.map((dispute) => (
          <div 
            key={dispute.id} 
            className="group relative bg-[#111625] border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[3rem] overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full transition-all ${
              dispute.severity === 'High' ? 'bg-red-600' : 'bg-amber-600'
            }`} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8 relative z-10">
              
              <div className="flex gap-3 md:gap-6">
                {/* Icône de sévérité réduite */}
                <div className={`h-10 w-10 md:h-16 md:w-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center border shrink-0 ${
                  dispute.severity === 'High' 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                }`}>
                  <AlertCircle className="w-5 h-5 md:w-8 md:h-8" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] md:text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-md tracking-wider">
                      {dispute.id}
                    </span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      <span className="text-[7px] md:text-[9px] font-bold uppercase">{dispute.date}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors line-clamp-1">
                    {dispute.issue}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldAlert className="w-2.5 h-2.5 text-slate-500" />
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                      Vendeur : <span className="text-blue-500">{dispute.shop}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTIONS BOUTONS COMPACTS */}
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center justify-center gap-2">
                  <MessageSquare className="w-3 h-3 md:w-4 md:h-4" /> 
                  Chat
                </button>

                <button 
                  onClick={() => handleResolveDispute(dispute.id, 'resolved')}
                  disabled={isProcessing === dispute.id}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-red-600 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] text-white flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Gavel className={`w-3.5 h-3.5 ${isProcessing === dispute.id ? 'animate-bounce' : ''}`} /> 
                  Trancher
                </button>
              </div>

            </div>

            {/* Barre de statut fine */}
            <div className="mt-4 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className={`h-full rounded-full ${dispute.severity === 'High' ? 'bg-red-600' : 'bg-amber-500'} w-1/4 opacity-40`} />
            </div>
          </div>
        ))}

        {displayDisputes.length === 0 && (
          <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl bg-slate-900/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-30" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-[9px] italic">Aucun litige actif</p>
          </div>
        )}
      </div>
    </div>
  );
}