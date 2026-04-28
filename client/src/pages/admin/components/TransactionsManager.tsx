import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Search, Loader2, TrendingUp, Wallet, Clock, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const COMMISSION_RATE = 0.15; 

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(price));
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  }).format(date);
};

export default function TransactionsManager() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [totals, setTotals] = useState({
    collected: 0,
    platformMargin: 0,
    vendorPayouts: 0
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`id, created_at, total_amount, status, payment_method, profiles:client_id (full_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransactions(data);
        const completedOrders = data.filter(tr => tr.status === 'completed' || tr.status === 'paid');
        let totalCollecte = completedOrders.reduce((sum, tr) => sum + (tr.total_amount || 0), 0);
        const marge = totalCollecte * COMMISSION_RATE;

        setTotals({
          collected: totalCollecte,
          platformMargin: marge,
          vendorPayouts: totalCollecte - marge
        });
      }
    } catch (error: any) {
      console.error("Erreur flux:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    const channel = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchTransactions()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter(tr => 
    tr.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tr.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 🟢 HEADER & KPIs MINIATURISÉS */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <h2 className="text-lg md:text-xl font-[1000] uppercase tracking-tighter text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> Flux Financier
          </h2>
          <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Commissions & Historique Live</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          <KPIMini title="Volume Global" value={totals.collected} color="slate" />
          <KPIMini title="Part Vendeurs" value={totals.vendorPayouts} color="emerald" icon={Wallet} />
          <KPIMini title="Commission (15%)" value={totals.platformMargin} color="purple" icon={TrendingUp} className="col-span-2 md:col-span-1" />
        </div>
      </div>

      {/* 🟢 LISTE DES TRANSACTIONS */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        <div className="p-3 md:p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="RECHERCHER..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[9px] md:text-[10px] font-bold text-white uppercase bg-black/40 border border-slate-700 rounded-lg focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* VERSION MOBILE : Cartes compactes */}
        <div className="md:hidden divide-y divide-slate-800">
          {isLoading ? (
            <div className="p-10 text-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" /></div>
          ) : filteredTransactions.map((tr) => (
            <div key={tr.id} className="p-4 space-y-3 bg-slate-900/20">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-white block">#{tr.id.substring(0, 8)}</span>
                  <span className="text-[8px] text-slate-500 flex items-center gap-1 uppercase font-bold"><Clock size={10}/> {formatDate(tr.created_at)}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border ${
                  tr.status === 'completed' || tr.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {tr.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center"><User size={10} className="text-slate-500" /></div>
                <span className="text-[9px] font-bold uppercase truncate">{tr.profiles?.full_name || 'Inconnu'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                <div>
                  <p className="text-[7px] font-black text-slate-500 uppercase">Total</p>
                  <p className="text-[11px] font-black text-white">{formatPrice(tr.total_amount)} <span className="text-[7px]">F</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-purple-400 uppercase">Com. (15%)</p>
                  <p className="text-[11px] font-black text-purple-400">+{formatPrice(tr.total_amount * COMMISSION_RATE)} <span className="text-[7px]">F</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* VERSION DESKTOP : Tableau classique */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] bg-black/20">
                <th className="p-6">ID / Date</th>
                <th className="p-6">Client</th>
                <th className="p-6 text-right">Montant</th>
                <th className="p-6 text-right text-emerald-500/70">Part Vendeur</th>
                <th className="p-6 text-right text-purple-500/70">Marge Admin</th>
                <th className="p-6 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-bold uppercase">
              {filteredTransactions.map((tr) => (
                <tr key={tr.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                  <td className="p-6">
                    <span className="text-white block">#{tr.id.substring(0, 8)}</span>
                    <span className="text-[9px] text-slate-500">{formatDate(tr.created_at)}</span>
                  </td>
                  <td className="p-6 text-slate-300">{tr.profiles?.full_name}</td>
                  <td className="p-6 text-right text-white">{formatPrice(tr.total_amount)} F</td>
                  <td className="p-6 text-right text-emerald-400">{formatPrice(tr.total_amount * 0.85)} F</td>
                  <td className="p-6 text-right text-purple-400 bg-purple-500/5">+{formatPrice(tr.total_amount * COMMISSION_RATE)} F</td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] tracking-widest border ${
                      tr.status === 'completed' || tr.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {tr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

// --- SOUS-COMPOSANT KPI COMPACT ---
function KPIMini({ title, value, color, icon: Icon, className = "" }: any) {
  const styles: any = {
    slate: 'bg-slate-800/30 border-slate-700/50 text-white',
    emerald: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };
  return (
    <div className={`${styles[color]} border p-3 md:p-4 rounded-xl md:rounded-2xl ${className}`}>
      <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 opacity-70">
        {Icon && <Icon size={10} />} {title}
      </p>
      <p className="text-sm md:text-lg font-[1000]">{formatPrice(value)} <span className="text-[8px] md:text-[10px] opacity-50">F</span></p>
    </div>
  );
}