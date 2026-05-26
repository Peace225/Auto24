import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Search, Loader2, TrendingUp, Wallet, Clock, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const COMMISSION_RATE = 0.15;

const formatPrice = (price: number = 0) => {
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
       .order('created_at', { ascending: false })
       .limit(200);

      if (error) throw error;

      if (data) {
        setTransactions(data);
        const completedOrders = data.filter(tr => tr.status === 'completed' || tr.status === 'paid' || tr.status === 'delivered');
        const totalCollecte = completedOrders.reduce((sum, tr) => sum + (Number(tr.total_amount) || 0), 0);
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
    const channel = supabase
     .channel('public:orders')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchTransactions())
     .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter(tr =>
    tr.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">

      {/* HEADER & KPIs */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> Flux Financier
          </h2>
          <p className="text- text-slate-500 font-bold uppercase tracking-widest mt-0.5">Commissions & Historique Live</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <KPIMini title="Volume Global" value={totals.collected} color="slate" />
          <KPIMini title="Part Vendeurs (85%)" value={totals.vendorPayouts} color="emerald" icon={Wallet} />
          <KPIMini title={`Commission (${COMMISSION_RATE*100}%)`} value={totals.platformMargin} color="purple" icon={TrendingUp} className="col-span-2 md:col-span-1" />
        </div>
      </div>

      {/* LISTE */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl">

        <div className="p-3 md:p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="RECHERCHER ID OU CLIENT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text- font-bold text-white uppercase bg-black/40 border border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* MOBILE */}
        <div className="md:hidden divide-y divide-slate-800">
          {isLoading? (
            <div className="p-10 text-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" /></div>
          ) : filteredTransactions.length === 0? (
            <div className="p-10 text-center text-slate-500 text-xs uppercase">Aucune transaction</div>
          ) : filteredTransactions.map((tr) => {
            const amount = Number(tr.total_amount) || 0;
            const commission = amount * COMMISSION_RATE;
            const isPaid = ['completed','paid','delivered'].includes(tr.status);
            return (
              <div key={tr.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text- font-black text-white">#{tr.id.substring(0, 8)}</span>
                    <span className="text- text-slate-500 flex items-center gap-1 mt-1"><Clock size={10}/> {formatDate(tr.created_at)}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-md text- font-black uppercase border ${
                    isPaid? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {tr.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={12} className="text-slate-500" />
                  <span className="text- font-bold text-slate-300 uppercase truncate">{tr.profiles?.full_name || 'Invité'}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <p className="text- text-slate-500 uppercase font-bold">Total</p>
                    <p className="text-sm font-black text-white">{formatPrice(amount)} F</p>
                  </div>
                  <div className="text-right">
                    <p className="text- text-purple-400 uppercase font-bold">Commission</p>
                    <p className="text-sm font-black text-purple-400">+{formatPrice(commission)} F</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text- font-black uppercase text-slate-500 tracking-wider bg-black/20">
                <th className="p-5">ID / Date</th>
                <th className="p-5">Client</th>
                <th className="p-5 text-right">Montant</th>
                <th className="p-5 text-right">Part Vendeur</th>
                <th className="p-5 text-right">Marge Admin</th>
                <th className="p-5 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="text-">
              {isLoading? (
                <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filteredTransactions.map((tr) => {
                const amount = Number(tr.total_amount) || 0;
                const vendorPart = amount * (1 - COMMISSION_RATE);
                const adminPart = amount * COMMISSION_RATE;
                const isPaid = ['completed','paid','delivered'].includes(tr.status);
                return (
                  <tr key={tr.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-5">
                      <span className="text-white font-bold">#{tr.id.substring(0, 8)}</span>
                      <span className="block text- text-slate-500">{formatDate(tr.created_at)}</span>
                    </td>
                    <td className="p-5 text-slate-300 font-medium">{tr.profiles?.full_name || 'Invité'}</td>
                    <td className="p-5 text-right text-white font-black">{formatPrice(amount)} F</td>
                    <td className="p-5 text-right text-emerald-400 font-bold">{formatPrice(vendorPart)} F</td>
                    <td className="p-5 text-right text-purple-400 font-bold">+{formatPrice(adminPart)} F</td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text- font-bold uppercase border ${
                        isPaid? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPIMini({ title, value, color, icon: Icon, className = "" }: any) {
  const styles: any = {
    slate: 'bg-slate-800/40 border-slate-700 text-white',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };
  return (
    <div className={`${styles[color]} border p-4 rounded-2xl ${className}`}>
      <p className="text- font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 opacity-80">
        {Icon && <Icon size={12} />} {title}
      </p>
      <p className="text-xl font-black">{formatPrice(value)} <span className="text-xs opacity-60">F</span></p>
    </div>
  );
}