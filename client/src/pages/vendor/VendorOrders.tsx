import { useEffect, useState } from 'react';
import VendorSidebar from './VendorSidebar';
import { supabase } from '../../lib/supabase'; 
import { 
  Package, 
  ExternalLink,
  Search,
  Phone,
  Truck,
  Star,
  MapPin,
  Clock,
  Loader2
} from 'lucide-react';

interface Transaction {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string; // Ajouté
  delivery_address: string; // Ajouté
  total_amount: number;
  status: string;
  rating?: number; // Ajouté
  review_text?: string; // Ajouté
}

export default function VendorOrders() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('vendor_id', user.id) // Filtrage par vendeur
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('vendor_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'livré') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s === 'pending' || s === 'en attente') return 'bg-orange-50 text-orange-600 border-orange-100';
    if (s === 'processing' || s === 'préparation') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const filteredOrders = orders.filter(order => 
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone?.includes(searchTerm) ||
    order.id.includes(searchTerm)
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
      <VendorSidebar />
      
      <main className="flex-1 lg:ml-72 p-8 pt-28">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-[1000] uppercase text-slate-900 tracking-tighter">
              Gestion <span className="text-orange-500 italic">Commandes</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flux Réactif • {filteredOrders.length} commandes</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="CLIENT, TÉLÉPHONE, ID..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl text-[10px] font-black border-none outline-none focus:ring-2 focus:ring-orange-500/20 transition-all uppercase"
            />
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Détails / Client</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact & Livraison</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Statut</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Montant</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Avis</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Synchronisation en cours...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* ID & NOM */}
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black text-slate-400 mb-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs font-[1000] text-slate-900 uppercase tracking-tight">{order.customer_name || 'Client Direct'}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* CONTACT & LIVRAISON */}
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Phone className="w-3 h-3 text-orange-500" />
                          <span className="text-[11px] font-black">{order.customer_phone || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-bold truncate max-w-[150px] uppercase">
                            {order.delivery_address || 'Retrait en magasin'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* STATUT */}
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(order.status)}`}>
                        {order.status || 'En attente'}
                      </span>
                    </td>

                    {/* MONTANT */}
                    <td className="px-8 py-6 font-[1000] text-slate-900 text-sm tracking-tighter">
                      {order.total_amount?.toLocaleString()} <span className="text-[9px] text-slate-400 font-black">CFA</span>
                    </td>

                    {/* AVIS */}
                    <td className="px-8 py-6">
                      {order.rating ? (
                        <div className="flex items-center gap-1 bg-yellow-50 w-fit px-2 py-1 rounded-lg border border-yellow-100">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-black text-yellow-700">{order.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-slate-300 uppercase italic">Aucun avis</span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-8 py-6 text-center">
                      <button className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-orange-500 transition-all shadow-lg shadow-slate-900/10 active:scale-90">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EMPTY STATE */}
          {!loading && filteredOrders.length === 0 && (
            <div className="py-32 text-center">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Aucune transaction à afficher</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}