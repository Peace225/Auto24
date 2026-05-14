import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ShoppingBag, Clock, CheckCircle2, Truck, 
  Loader2, MapPin, User 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VendorOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          created_at,
          product_name,
          quantity,
          total_price,
          vendor_status,
          orders!fk_order (
            id,
            client_name,
            client_phone,
            delivery_city,
            delivery_address,
            status
          )
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Erreur:", error.message);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('vendor-orders-live')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'order_items', 
        filter: `vendor_id=eq.${user?.id}` 
      }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchOrders]);

  const updateStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ vendor_status: newStatus })
        .eq('id', itemId);
      if (error) throw error;
      toast.success("Statut mis à jour");
    } catch (error: any) {
      toast.error("Erreur de mise à jour");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto bg-white min-h-screen">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-4xl font-black uppercase tracking-tight text-slate-950">
          Commandes <span className="text-blue-600">Reçues</span>
        </h1>
        <p className="text-slate-600 font-medium">Gérez vos expéditions et vos ventes en temps réel.</p>
      </header>

      <div className="grid gap-8">
        {orders.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-20 text-center">
            <ShoppingBag className="mx-auto text-slate-400 mb-4" size={60} />
            <p className="text-slate-900 font-bold text-xl uppercase italic">Aucune commande pour le moment</p>
          </div>
        ) : (
          orders.map((item) => (
            <div key={item.id} className="bg-white border-2 border-slate-200 rounded-[2.5rem] overflow-hidden shadow-md group transition-all">
              <div className="flex flex-col lg:flex-row">
                
                {/* Section Détails - Texte Noir profond sur Fond Blanc */}
                <div className="flex-1 p-8 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        Ref: {item.id.split('-')[0]}
                      </span>
                      <h3 className="text-2xl font-black uppercase text-slate-950 mt-3">{item.product_name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-slate-950">{item.total_price.toLocaleString()} <span className="text-sm">CFA</span></p>
                      <p className="text-sm font-bold text-slate-600 uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
                      <User className="text-blue-600" size={24}/>
                      <div>
                        <p className="text-[10px] font-black text-blue-800 uppercase">Client</p>
                        <p className="text-lg font-bold text-slate-950">{item.orders?.client_name || 'N/A'}</p>
                        <p className="text-sm text-slate-700 font-medium">{item.orders?.client_phone}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
                      <MapPin className="text-emerald-600" size={24}/>
                      <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase">Adresse de livraison</p>
                        <p className="text-lg font-bold text-slate-950">{item.orders?.delivery_city}</p>
                        <p className="text-sm text-slate-700 font-medium">{item.orders?.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barre latérale d'actions - Boutons avec textes blancs sur couleurs vives */}
                <div className="lg:w-80 bg-slate-50 border-l border-slate-200 p-8 flex flex-col justify-center gap-4">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest text-center mb-2">Changer le statut</p>
                  
                  {[
                    { id: 'preparing', label: 'Préparation', icon: Clock, active: 'bg-amber-500 text-white', inactive: 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50' },
                    { id: 'ready', label: 'Prêt à livrer', icon: CheckCircle2, active: 'bg-blue-600 text-white', inactive: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50' },
                    { id: 'shipped', label: 'Expédié', icon: Truck, active: 'bg-emerald-600 text-white', inactive: 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50' }
                  ].map((status) => (
                    <button
                      key={status.id}
                      onClick={() => updateStatus(item.id, status.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl text-sm font-black uppercase border-2 transition-all 
                        ${item.vendor_status === status.id ? status.active : status.inactive}`}
                    >
                      {status.label}
                      <status.icon size={20} />
                    </button>
                  ))}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}