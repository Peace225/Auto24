import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, Check, Truck, X, MapPin, Package, Store, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  shop_name: string | null;
  vendor_id: string | null;
};

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  order_number: string | null;
  payment_method: string | null;
  client_name: string | null;
  client_phone: string | null;
  delivery_city: string | null;
  delivery_address: string | null;
  order_items: OrderItem[];
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
    .from('orders')
    .select(`
        id, created_at, status, total_amount, order_number, payment_method,
        client_name, client_phone, delivery_city, delivery_address,
        order_items (
          id, product_name, quantity, total_price, unit_price,
          shop_name, vendor_id
        )
      `)
    .order('created_at', { ascending: false })
    .limit(100);

    if (error) {
      console.error('[ORDERS]', error);
      toast.error(`Erreur chargement: ${error.message}`);
      setOrders([]);
    } else {
      setOrders((data as Order[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
    .channel('admin-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
    .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    if (status === 'cancelled' &&!confirm('Annuler cette commande?')) return;

    setUpdatingId(id);
    const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

    if (error) {
      toast.error('Erreur mise à jour');
    } else {
      toast.success(`Commande ${status}`);
      setOrders(prev => prev.map(o => o.id === id? {...o, status } : o));
    }
    setUpdatingId(null);
  };

  const statusColor = (s: string) =>
    s === 'pending'? 'bg-amber-500/20 text-amber-400' :
    s === 'preparing'? 'bg-blue-500/20 text-blue-400' :
    s === 'completed'? 'bg-emerald-500/20 text-emerald-400' :
    'bg-red-500/20 text-red-400';

  if (isLoading) {
    return <div className="grid place-items-center h-64"><Loader2 className="animate-spin text-amber-500" size={40}/></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-wider">
        Commandes Clients ({orders.length})
      </h2>

      <div className="bg-[#080B12] rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.03] text-slate-400 text- uppercase tracking-widest">
              <tr>
                <th className="p-4 text-left">Commande</th>
                <th className="p-4 text-left">Client</th>
                <th className="p-4 text-left">Produits & Vendeur</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Statut</th>
                <th className="p-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 align-top">
                    <div className="text-white font-bold text-sm">{o.order_number || o.id.slice(0,8).toUpperCase()}</div>
                    <div className="text- text-slate-500 mt-1">{new Date(o.created_at).toLocaleString('fr-FR')}</div>
                    <div className="text- text-amber-400 uppercase font-bold mt-1">{o.payment_method}</div>
                  </td>

                  <td className="p-4 align-top">
                    <div className="text-white text-sm font-medium">{o.client_name || '—'}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Phone size={12}/>{o.client_phone}
                    </div>
                    <div className="text-xs flex items-center gap-1 text-slate-500 mt-1">
                      <MapPin size={12}/>{o.delivery_city}
                    </div>
                  </td>

                  <td className="p-4 align-top max-w-">
                    <div className="space-y-2.5">
                      {o.order_items?.map((it) => (
                        <div key={it.id} className="text-xs">
                          <div className="flex gap-1.5 text-slate-300">
                            <Package size={12} className="mt-0.5 shrink-0"/>
                            <span>{it.product_name} <span className="text-amber-400">x{it.quantity}</span></span>
                          </div>
                          {it.shop_name && (
                            <div className="flex items-center gap-1.5 ml-5 mt-1 text- text-slate-500">
                              <Store size={10}/>
                              <span className="text-slate-400">Boutique:</span>
                              <span className="text-blue-400 font-medium">{it.shop_name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="p-4 align-top">
                    <div className="text-white font-black">{Number(o.total_amount).toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500">CFA</span></div>
                  </td>

                  <td className="p-4 align-top">
                    <span className={`px-2.5 py-1 rounded-lg text- font-bold uppercase tracking-wider ${statusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>

                  <td className="p-4 align-top">
                    {updatingId === o.id? (
                      <Loader2 className="animate-spin text-slate-400" size={18}/>
                    ) : (
                      <div className="flex gap-1.5">
                        {o.status === 'pending' && (
                          <button onClick={() => updateStatus(o.id, 'preparing')} title="Préparer" className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors">
                            <Truck size={14}/>
                          </button>
                        )}
                        {o.status!== 'completed' && o.status!== 'cancelled' && (
                          <button onClick={() => updateStatus(o.id, 'completed')} title="Terminer" className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg transition-colors">
                            <Check size={14}/>
                          </button>
                        )}
                        {o.status!== 'cancelled' && (
                          <button onClick={() => updateStatus(o.id, 'cancelled')} title="Annuler" className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors">
                            <X size={14}/>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">Aucune commande pour le moment...</div>
        )}
      </div>
    </div>
  );
}