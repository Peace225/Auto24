import { ArrowUpRight, ArrowDownLeft, CreditCard, Search } from 'lucide-react';

export default function TransactionsManager() {
  const transactions = [
    { id: 'TR-9021', user: 'Jean Marc', amount: '45.000', status: 'completed', date: 'Hier, 14:20', method: 'Orange Money' },
    { id: 'TR-9022', user: 'Awa Diop', amount: '120.000', status: 'pending', date: 'Aujourd\'hui, 09:15', method: 'Wave' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-[1000] uppercase tracking-tighter text-white">Flux Financier</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Historique des paiements Marketplace</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
            <p className="text-[8px] font-black text-emerald-500 uppercase">Total Collecté</p>
            <p className="text-lg font-black text-white">2.4M CFA</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">
              <th className="p-6">ID / Date</th>
              <th className="p-6">Client</th>
              <th className="p-6">Montant</th>
              <th className="p-6">Méthode</th>
              <th className="p-6">Statut</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-bold uppercase">
            {transactions.map((tr) => (
              <tr key={tr.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition">
                <td className="p-6">
                  <span className="text-white block">{tr.id}</span>
                  <span className="text-[9px] text-slate-500">{tr.date}</span>
                </td>
                <td className="p-6 text-slate-300">{tr.user}</td>
                <td className="p-6 text-emerald-400">{tr.amount} CFA</td>
                <td className="p-6 text-slate-400">{tr.method}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[8px] ${
                    tr.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
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
  );
}