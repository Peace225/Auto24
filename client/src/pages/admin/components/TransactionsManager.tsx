import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Search, Loader2, TrendingUp, Wallet } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Taux de commission de la plateforme (15%)
const COMMISSION_RATE = 0.15; 

// Helper pour formater les prix en CFA
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(price));
};

// Helper pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  }).format(date);
};

export default function TransactionsManager() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // KPIs financiers
  const [totals, setTotals] = useState({
    collected: 0,
    platformMargin: 0,
    vendorPayouts: 0
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_amount, 
          status, 
          payment_method,
          profiles:client_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransactions(data);

        // Calcul des totaux uniquement sur les commandes terminées
        const completedOrders = data.filter(tr => tr.status === 'completed' || tr.status === 'paid');
        
        let totalCollecte = 0;
        completedOrders.forEach(tr => {
          totalCollecte += (tr.total_amount || 0);
        });

        const marge = totalCollecte * COMMISSION_RATE;
        const partVendeurs = totalCollecte - marge;

        setTotals({
          collected: totalCollecte,
          platformMargin: marge,
          vendorPayouts: partVendeurs
        });
      }
    } catch (error: any) {
      console.error("Erreur chargement transactions:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();

    // Écoute en temps réel des nouveaux paiements
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER & KPIs */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h2 className="text-xl font-[1000] uppercase tracking-tighter text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" /> Flux Financier
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Historique des paiements & calcul des commissions
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* Bloc Volume Global */}
          <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl min-w-[140px]">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Global</p>
            <p className="text-lg font-black text-white">{formatPrice(totals.collected)} <span className="text-[10px] text-slate-500">CFA</span></p>
          </div>
          
          {/* Bloc Part Vendeurs */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl min-w-[140px]">
            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Wallet className="w-3 h-3" /> À reverser (Pro)
            </p>
            <p className="text-lg font-black text-emerald-400">{formatPrice(totals.vendorPayouts)} <span className="text-[10px]">CFA</span></p>
          </div>

          {/* Bloc Commission Admin */}
          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl min-w-[140px] shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Commission (15%)
            </p>
            <p className="text-lg font-black text-purple-400">{formatPrice(totals.platformMargin)} <span className="text-[10px]">CFA</span></p>
          </div>
        </div>
      </div>

      {/* TABLEAU DES TRANSACTIONS */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* Barre de recherche factice pour le design */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="relative w-full max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Chercher un ID ou un client..." 
              className="w-full pl-10 pr-4 py-2 text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] bg-black/20">
                <th className="p-6">ID / Date</th>
                <th className="p-6">Client</th>
                <th className="p-6 text-right">Montant Total</th>
                <th className="p-6 text-right text-emerald-500/70">Part Vendeur (85%)</th>
                <th className="p-6 text-right text-purple-500/70">Marge Admin (15%)</th>
                <th className="p-6">Méthode</th>
                <th className="p-6 text-center">Statut</th>
              </tr>
            </thead>
            
            <tbody className="text-[11px] font-bold uppercase">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <span className="text-[10px] text-slate-500 tracking-widest">Analyse des flux...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 tracking-widest text-[10px]">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                transactions.map((tr) => {
                  // Calculs pour chaque ligne
                  const amount = tr.total_amount || 0;
                  const commission = amount * COMMISSION_RATE;
                  const vendorShare = amount - commission;
                  const clientName = tr.profiles?.full_name || 'Client Inconnu';

                  return (
                    <tr key={tr.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors group">
                      <td className="p-6 whitespace-nowrap">
                        <span className="text-white block group-hover:text-blue-400 transition-colors">
                          #{tr.id.substring(0, 8)}
                        </span>
                        <span className="text-[9px] text-slate-500">{formatDate(tr.created_at)}</span>
                      </td>
                      
                      <td className="p-6 text-slate-300">{clientName}</td>
                      
                      <td className="p-6 text-right text-white">
                        {formatPrice(amount)} <span className="text-[8px] text-slate-500">CFA</span>
                      </td>
                      
                      <td className="p-6 text-right text-emerald-400">
                        {formatPrice(vendorShare)} <span className="text-[8px] text-emerald-500/50">CFA</span>
                      </td>
                      
                      <td className="p-6 text-right text-purple-400 bg-purple-500/5">
                        + {formatPrice(commission)} <span className="text-[8px] text-purple-500/50">CFA</span>
                      </td>
                      
                      <td className="p-6 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3 opacity-50" />
                          {tr.payment_method || 'Non défini'}
                        </div>
                      </td>
                      
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-[8px] tracking-widest ${
                          tr.status === 'completed' || tr.status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : tr.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {tr.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}