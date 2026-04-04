import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Search, 
  Filter, 
  Wallet, 
  PieChart, 
  History,
  Info,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  commission: number;
  status: 'completed' | 'pending' | 'failed';
  payment_method: string;
  profiles: { full_name: string }; // Client
  vendors: { store_name: string }; // Vendeur (via jointure)
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBrut: 0,
    totalCommissions: 0,
    pendingPayouts: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Note: Assurez-vous que vos tables 'orders' ou 'transactions' ont les bonnes FK
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, created_at, amount, commission, status, payment_method,
          profiles(full_name),
          vendors:vendor_id(store_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const txs = data as any[];
        setTransactions(txs);
        
        // Calcul des stats
        const brut = txs.reduce((acc, curr) => acc + curr.amount, 0);
        const comm = txs.reduce((acc, curr) => acc + curr.commission, 0);
        const pending = txs
          .filter(t => t.status === 'pending')
          .reduce((acc, curr) => acc + curr.amount, 0);

        setStats({ totalBrut: brut, totalCommissions: comm, pendingPayouts: pending });
      }
    } catch (err) {
      console.error("Erreur transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const financeStats = [
    { label: 'Volume Total Brut', value: `${stats.totalBrut.toLocaleString()} FCFA`, icon: Wallet, color: 'text-blue-400' },
    { label: 'Commissions Générées', value: `${stats.totalCommissions.toLocaleString()} FCFA`, icon: PieChart, color: 'text-emerald-400' },
    { label: 'En attente de versement', value: `${stats.pendingPayouts.toLocaleString()} FCFA`, icon: Clock, color: 'text-orange-400' },
  ];

  return (
    <div className="bg-[#0B0F1A] min-h-screen text-slate-200 p-8 lg:p-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-[1000] uppercase tracking-tighter text-white">Flux Financiers</h1>
          <p className="text-emerald-500/60 font-black text-[10px] uppercase tracking-[0.3em] mt-1 italic">
            Taux de commission prélevé : 10%
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-colors shadow-xl">
          <Download className="w-4 h-4" /> Exporter Rapport
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {financeStats.map((stat, i) => (
          <div key={i} className="bg-slate-800/20 border border-slate-800 p-8 rounded-[2.5rem] relative group hover:bg-slate-800/40 transition-all overflow-hidden">
            <div className={`h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 border border-slate-700 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <div className="absolute -right-2 -bottom-2 w-24 h-24 bg-blue-500/5 blur-[40px]" />
          </div>
        ))}
      </div>

      {/* LISTE DES TRANSACTIONS */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" /> Historique
          </h3>
          <div className="flex gap-3">
             <div className="relative hidden md:block">
               <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
               <input type="text" placeholder="Rechercher..." className="bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
             </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800/30">
                  <th className="px-8 py-6">Transaction</th>
                  <th className="px-6 py-6">Parties</th>
                  <th className="px-6 py-6">Montant Brut</th>
                  <th className="px-6 py-6 text-emerald-400">Commission</th>
                  <th className="px-6 py-6 text-center">Méthode</th>
                  <th className="px-8 py-6 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-500/5 transition-all group">
                    <td className="px-8 py-6">
                      <p className="text-white font-black text-sm tracking-tighter">#{trx.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{new Date(trx.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-2">
                          <ArrowDownLeft className="w-3 h-3" /> {trx.profiles?.full_name}
                        </p>
                        <p className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-2">
                          <ArrowUpRight className="w-3 h-3 text-emerald-400" /> {trx.vendors?.store_name || "Garage"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-black text-white">
                      {trx.amount.toLocaleString()} <span className="text-[9px] text-slate-500">CFA</span>
                    </td>
                    <td className="px-6 py-6 bg-emerald-500/[0.02] font-[1000] text-emerald-400">
                      {trx.commission.toLocaleString()} <span className="text-[9px]">CFA</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="text-[9px] font-black text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 uppercase tracking-tighter">
                        {trx.payment_method}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {trx.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-black uppercase text-emerald-500">Réussi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-orange-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase text-orange-500">En attente</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] flex items-start gap-4">
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
          Les commissions sont calculées automatiquement sur le montant total. Les fonds sont débloqués pour les vendeurs après confirmation de réception par le client ou après un délai de 48h sans litige.
        </p>
      </div>
    </div>
  );
}