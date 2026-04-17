import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Package, 
  ExternalLink,
  Search,
  Phone,
  MapPin,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: string;
  created_at: string;
  product_name: string;
  quantity: number;
  total_price: number;
  vendor_status: string;
  order: {
    order_number: string;
    client_name: string;
    client_phone: string;
    delivery_city: string;
    delivery_address: string;
  };
}

export default function VendorOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;

    // On récupère les pièces vendues par ce vendeur spécifique
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id, created_at, product_name, quantity, total_price, vendor_status,
        order:orders (order_number, client_name, client_phone, delivery_city, delivery_address)
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // TypeScript a besoin qu'on précise le format retourné par la jointure
      setOrders(data as unknown as OrderItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Écoute en temps réel des nouvelles commandes
    const subscription = supabase
      .channel('vendor_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `vendor_id=eq.${user?.id}` }, 
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'livrée') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (s === 'en attente') return 'bg-orange-50 text-orange-600 border-orange-200';
    if (s === 'validée' || s === 'expédiée') return 'bg-blue-50 text-blue-600 border-blue-200';
    if (s === 'annulée') return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // 🟢 FONCTION DE MISE À JOUR DU STATUT (Pour le bouton Gérer)
  const handleUpdateStatus = async (orderItemId: string, currentStatus: string) => {
    if (!user) return;
    
    // Logique métier simplifiée pour l'exemple (On avance le statut)
    let nextStatus = 'Validée';
    if (currentStatus === 'Validée') nextStatus = 'Expédiée';
    if (currentStatus === 'Expédiée') nextStatus = 'Livrée';
    if (currentStatus === 'Livrée') {
      toast("Cette commande est déjà terminée.", { icon: '✅' });
      return;
    }

    setIsUpdating(orderItemId);
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ vendor_status: nextStatus })
        .eq('id', orderItemId);

      if (error) throw error;
      toast.success(`Statut mis à jour : ${nextStatus}`);
      fetchOrders(); // Rafraîchir la liste
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order?.client_phone?.includes(searchTerm) ||
    order.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-[1000] uppercase text-slate-900 tracking-tighter">
            Mes <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Ventes</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Synchronisation Live • {filteredOrders.length} articles
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="N° CMD, CLIENT, PIÈCE..." 
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-xl text-[10px] md:text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all uppercase placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* RAPPEL GARANTIE */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[10px] md:text-xs font-medium text-blue-800 leading-relaxed">
          <strong className="font-black uppercase">Note importante :</strong> L'argent de ces commandes est sécurisé par SpaceAuto24. Il vous sera reversé dès confirmation de la livraison, déduction faite des frais de service.
        </p>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden w-full">
        {/* Enveloppe scrollable horizontalement pour le mobile */}
        <div className="w-full overflow-x-auto p-0">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-5 py-4 md:px-6 md:py-5">N° Officiel / Article</th>
                <th className="px-5 py-4 md:px-6 md:py-5">Client & Livraison</th>
                <th className="px-5 py-4 md:px-6 md:py-5">Statut</th>
                <th className="px-5 py-4 md:px-6 md:py-5 text-right">Montant Net</th>
                <th className="px-5 py-4 md:px-6 md:py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement de vos ventes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                  
                  {/* N° CMD & ARTICLE */}
                  <td className="px-5 py-4 md:px-6 md:py-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {item.order?.order_number || 'SA24-ERR'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-[1000] text-slate-900 uppercase tracking-tight line-clamp-1">
                      {item.product_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Quantité : {item.quantity}</p>
                  </td>

                  {/* CLIENT & LIVRAISON */}
                  <td className="px-5 py-4 md:px-6 md:py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] md:text-[11px] font-black uppercase">{item.order?.client_name} - {item.order?.client_phone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase leading-tight line-clamp-2 max-w-[200px]">
                          {item.order?.delivery_address}, {item.order?.delivery_city}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* STATUT */}
                  <td className="px-5 py-4 md:px-6 md:py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${getStatusStyle(item.vendor_status)}`}>
                      {item.vendor_status || 'En attente'}
                    </span>
                  </td>

                  {/* MONTANT NET (Sans la commission) */}
                  <td className="px-5 py-4 md:px-6 md:py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-[1000] text-slate-900 text-sm md:text-base tracking-tighter">
                        {item.total_price?.toLocaleString()} <small className="text-[9px] md:text-[10px] text-slate-400 font-black">CFA</small>
                      </span>
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded mt-1 border border-emerald-100">
                        Net Vendeur
                      </span>
                    </div>
                  </td>

                  {/* ACTION */}
                  <td className="px-5 py-4 md:px-6 md:py-5 text-center">
                    <button 
                      onClick={() => handleUpdateStatus(item.id, item.vendor_status)}
                      disabled={isUpdating === item.id || item.vendor_status === 'Livrée'}
                      className="p-2.5 md:p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="Avancer le statut"
                    >
                      {isUpdating === item.id ? (
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-slate-400" />
                      ) : (
                        <ExternalLink className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EMPTY STATE */}
        {!loading && filteredOrders.length === 0 && (
          <div className="py-20 md:py-32 text-center px-4">
            <div className="h-16 w-16 md:h-20 md:w-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight mb-2">Aucune vente pour le moment</h3>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 max-w-sm mx-auto">Quand un client achètera l'une de vos pièces, elle apparaîtra ici avec son statut d'expédition.</p>
          </div>
        )}
      </div>
    </div>
  );
}