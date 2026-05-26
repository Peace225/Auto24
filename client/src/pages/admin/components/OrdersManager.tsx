import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, Check, Truck, X, MessageSquare, Store, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OrdersManager() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderItems = async () => {
    // Jointure complexe pour récupérer le client, le produit et le vendeur
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders(
          created_at,
          status,
          customer_phone,
          delivery_address,
          profiles:user_id(full_name)
        ),
        products(
          name,
          vendor:profiles!vendor_id(store_name, phone)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des commandes");
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrderItems();
    
    // Temps réel sur order_items
    const channel = supabase.channel('realtime-items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrderItems)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) toast.error("Erreur lors de la mise à jour");
    else {
      toast.success("Statut mis à jour !");
      fetchOrderItems();
    }
  };

  if (isLoading) return <div className="grid place-items-center h-64"><Loader2 className="animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase">Gestion des Commandes</h2>
      
      <div className="bg-[#080B12] rounded-3xl border border-white/5 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-6">Client</th>
              <th className="p-6">Vendeur (À contacter)</th>
              <th className="p-6">Produit</th>
              <th className="p-6">Montant</th>
              <th className="p-6">Statut</th>
              <th className="p-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="p-6">
                    <div className="font-bold text-white">{item.orders?.profiles?.full_name || 'Client'}</div>
                    <a href={`tel:${item.orders?.customer_phone}`} className="text-[10px] text-slate-400 underline">{item.orders?.customer_phone}</a>
                </td>
                <td className="p-6">
                    <div className="font-bold text-amber-500 flex items-center gap-2">
                        <Store size={14} /> {item.products?.vendor?.store_name || 'Inconnu'}
                    </div>
                    <a href={`https://wa.me/${item.products?.vendor?.phone}`} target="_blank" className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1 mt-1">
                        <MessageSquare size={10} /> Contacter Vendeur
                    </a>
                </td>
                <td className="p-6 text-slate-300 text-sm">
                    <div className="flex items-center gap-2">
                        <Package size={14} /> {item.product_name} x{item.quantity}
                    </div>
                </td>
                <td className="p-6 text-white font-black">{item.total_price?.toLocaleString()} CFA</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    item.orders?.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                    item.orders?.status === 'preparing' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {item.orders?.status || 'N/A'}
                  </span>
                </td>
                <td className="p-6 flex gap-2">
                  {item.orders?.status === 'pending' && (
                    <button onClick={() => updateOrderStatus(item.order_id, 'preparing')} className="p-2 bg-blue-600 rounded-xl hover:bg-blue-500 text-white">
                      <Truck size={16} title="Préparer la récupération" />
                    </button>
                  )}
                  {item.orders?.status !== 'completed' && (
                    <button onClick={() => updateOrderStatus(item.order_id, 'completed')} className="p-2 bg-emerald-600 rounded-xl hover:bg-emerald-500 text-white">
                      <Check size={16} title="Commande livrée et payée" />
                    </button>
                  )}
                  <button onClick={() => updateOrderStatus(item.order_id, 'cancelled')} className="p-2 bg-red-900/50 rounded-xl hover:bg-red-800 text-red-500">
                    <X size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}