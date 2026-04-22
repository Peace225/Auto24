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
  AlertCircle,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: string;
  created_at: string;
  product_name: string;
  quantity: number;
  total_price: number;
  vendor_status: string;
  orders: { // 🟢 Nom de la relation corrigé pour correspondre à Supabase par défaut
    id: string;
    client_name: string;
    client_phone: string;
    delivery_city: string;
    delivery_address: string;
    status: string;
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

    // 🟢 Requête optimisée pour récupérer les infos du client et le statut global
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id, created_at, product_name, quantity, total_price, vendor_status,
        orders (id, client_name, client_phone, delivery_city, delivery_address, status)
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur chargement commandes:", error);
    } else if (data) {
      // @ts-ignore - Supabase renvoie orders comme un objet simple ici
      setOrders(data as OrderItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // 🟢 TEMPS RÉEL DOUBLE : On écoute les produits ET la commande globale
    const subscription = supabase
      .channel('vendor_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `vendor_id=eq.${user?.id}` }, 
        () => fetchOrders()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
        () => fetchOrders() // Si le statut de livraison global change, on rafraîchit
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // 🟢 SYSTÈME DE BADGE INTELLIGENT
  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'en attente';
    
    if (s === 'livrée' || s === 'completed') return (
      <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5" /> Livrée
      </span>
    );
    if (s === 'expédiée' || s === 'shipped') return (
      <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200 shadow-sm">
        <Truck className="w-3.5 h-3.5" /> Expédiée
      </span>
    );
    if (s === 'annulée' || s === 'cancelled') return (
      <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 shadow-sm">
        <XCircle className="w-3.5 h-3.5" /> Annulée
      </span>
    );
    
    // Par défaut : En attente / Validée
    return (
      <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-200 shadow-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {s === 'validée' ? 'Préparation' : 'En attente'}
      </span>
    );
  };

  const handleUpdateStatus = async (orderItemId: string, currentStatus: string) => {
    if (!user) return;
    
    let nextStatus = 'Validée'; // Étape 1 : Validation vendeur
    if (currentStatus === 'Validée') nextStatus = 'Expédiée'; // Étape 2 : Remise au livreur
    if (currentStatus === 'Expédiée') nextStatus = 'Livrée'; // Étape 3 : Confirmée
    
    if (currentStatus === 'Livrée' || currentStatus === 'completed') {
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
      fetchOrders(); 
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter(item => 
    item.orders?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.orders?.client_phone?.includes(searchTerm) ||
    item.orders?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION (Style Vendeur) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm w-full relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-[1000] uppercase text-[#111625] tracking-tighter italic">
                Mes Commandes
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Live • {filteredOrders.length} article(s) vendu(s)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full lg:w-96 z-10">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="N° CMD, CLIENT, PIÈCE..." 
            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl text-[10px] md:text-xs font-black border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase placeholder:text-slate-400 shadow-inner"
          />
        </div>
      </div>

      {/* RAPPEL GARANTIE */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-100 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
        <div className="bg-blue-100 p-2 rounded-lg shrink-0">
          <AlertCircle className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-[10px] md:text-xs font-bold text-blue-900/80 leading-relaxed pt-0.5 max-w-3xl">
          <strong className="font-black uppercase text-blue-700 tracking-wider">Sécurité des paiements :</strong> L'argent de ces commandes est sécurisé par SpaceAuto24. Il vous sera reversé sur votre portefeuille dès confirmation de la livraison au client, déduction faite des frais de service.
        </p>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="w-full overflow-x-auto p-0">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-6 py-5">N° Officiel / Article</th>
                <th className="px-6 py-5">Client & Expédition</th>
                <th className="px-6 py-5">Statut actuel</th>
                <th className="px-6 py-5 text-right">Gain Net Vendeur</th>
                <th className="px-6 py-5 text-center">Mise à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement de vos ventes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  
                  {/* N° CMD & ARTICLE */}
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-white bg-[#111625] px-2.5 py-1 rounded-md shadow-sm border border-slate-800">
                        #{item.orders?.id?.substring(0, 8) || 'ERR'}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-[1000] text-[#111625] uppercase tracking-tight line-clamp-2 max-w-[250px] leading-tight">
                      {item.product_name}
                    </p>
                    <p className="text-[10px] font-black text-blue-600 uppercase mt-1 tracking-widest">
                      Qté : {item.quantity}
                    </p>
                  </td>

                  {/* CLIENT & LIVRAISON */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-200">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-tight">
                          {item.orders?.client_name || 'Client'} - {item.orders?.client_phone || 'Non renseigné'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-500 pl-1 max-w-[220px]">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase leading-relaxed line-clamp-2">
                          <strong className="text-slate-700">{item.orders?.delivery_city || 'Ville'}</strong> <br/>
                          {item.orders?.delivery_address || 'Adresse non renseignée'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* STATUT (Badge intelligent) */}
                  <td className="px-6 py-5">
                    {getStatusBadge(item.vendor_status)}
                  </td>

                  {/* MONTANT NET */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-[1000] text-[#111625] text-lg md:text-xl tracking-tighter italic">
                        {item.total_price?.toLocaleString()} <small className="text-[10px] text-slate-400 font-black ml-0.5">CFA</small>
                      </span>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1">
                        Montant Net
                      </span>
                    </div>
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => handleUpdateStatus(item.id, item.vendor_status)}
                      disabled={isUpdating === item.id || item.vendor_status?.toLowerCase() === 'livrée'}
                      className={`px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 w-full max-w-[140px] mx-auto ${
                        item.vendor_status?.toLowerCase() === 'livrée' 
                          ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                          : 'bg-[#111625] text-white hover:bg-blue-600 shadow-md active:scale-95 border border-[#111625]'
                      }`}
                      title={item.vendor_status?.toLowerCase() === 'livrée' ? "Commande terminée" : "Avancer à l'étape suivante"}
                    >
                      {isUpdating === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                      ) : item.vendor_status?.toLowerCase() === 'livrée' ? (
                        <>Terminée <CheckCircle2 className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Avancer <ExternalLink className="w-3.5 h-3.5" /></>
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
          <div className="py-20 md:py-32 text-center px-4 bg-slate-50/50">
            <div className="h-16 w-16 md:h-20 md:w-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm transform rotate-12">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight mb-2">Aucune vente pour le moment</h3>
            <p className="text-[10px] md:text-[11px] font-bold text-slate-400 max-w-sm mx-auto leading-relaxed">
              Quand un client achètera l'une de vos pièces, elle apparaîtra ici. Assurez-vous d'avoir un catalogue bien rempli !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}