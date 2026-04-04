import { useState, useEffect } from 'react';
import { 
  Package, ShoppingBag, Receipt, Clock, ChevronRight, 
  CreditCard, MapPin, ExternalLink, Bell, BellDot, Loader2,
  MessageSquare, User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

// Types pour la clarté
interface Order {
  id: string;
  created_at: string;
  status: string;
  amount: number;
  items_count: number;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_read: boolean;
  type: 'success' | 'info' | 'alert';
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // États de données
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    paidInvoices: 0
  });

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }

      // 1. Récupérer le profil réel (Table 'profiles')
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      
      setProfile(profileData);

      // 2. Récupérer les commandes réelles (Table 'orders')
      // Note: Assure-toi que ta table 'orders' utilise 'customer_id'
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (ordersData) {
        setOrders(ordersData as any);
        const paid = ordersData.filter(o => o.status === 'Livré' || o.status === 'Payé' || o.status === 'Terminé').length;
        setStats({ totalOrders: ordersData.length, paidInvoices: paid });
      }

      // 3. Récupérer les notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotifications(notifs || []);

    } catch (error) {
      console.error("Erreur de chargement du dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { label: 'Pièces commandées', value: stats.totalOrders.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Demandes en attente', value: '02', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Factures réglées', value: stats.paidInvoices.toString().padStart(2, '0'), icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement de votre garage...</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative font-sans">
      
      {/* BANNIÈRE PROFIL & NOTIFICATIONS */}
      <div className="bg-white border-b border-slate-100 mb-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-lg shadow-xl relative overflow-hidden group">
               <User className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-transparent transition-colors" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {profile?.full_name?.split(' ')[0] || 'Client'} SpaceAuto
              </h1>
              <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest">
                <MapPin className="w-3 h-3 text-blue-600" /> {profile?.commune || 'Abidjan'}, Côte d'Ivoire
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all relative"
              >
                {notifications.some(n => !n.is_read) ? (
                  <BellDot className="w-5 h-5 text-blue-600 animate-pulse" />
                ) : (
                  <Bell className="w-5 h-5 text-slate-500" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-14 right-0 w-80 bg-white border border-slate-100 shadow-2xl rounded-[1.5rem] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Alertes Récentes</h4>
                    <button className="text-[9px] text-blue-600 font-bold uppercase hover:underline">Tout marquer</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="text-[11px] font-black text-slate-900 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">{n.description}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rien à signaler</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/search" className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95 flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5" /> Chercher une pièce
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* STATISTIQUES RAPIDES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {kpis.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* SECTION COMMANDES RÉCENTES */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Historique de commandes
              </h3>
              <Link to="/orders" className="text-[9px] font-black text-blue-600 uppercase hover:underline">Voir tout</Link>
            </div>

            <div className="space-y-3">
              {orders.length > 0 ? orders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-200 transition-all group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight">COMMANDE #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} • {order.items_count || 1} article(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      order.status === 'En cours' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {order.status}
                    </span>
                    <p className="font-black text-slate-900 text-lg">
                        {order.amount.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span>
                    </p>
                    <button className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-inner">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                  <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Votre historique est vide</p>
                  <Link to="/search" className="mt-4 inline-block text-blue-600 text-[10px] font-black uppercase underline">Commencer vos achats</Link>
                </div>
              )}
            </div>
          </div>

          {/* SECTION DOCUMENTS & SUPPORT */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Mon Portefeuille
            </h3>
            
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Receipt className="w-40 h-40 text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Solde Facturation</p>
                <div className="mb-8">
                    <p className="text-3xl font-black tracking-tighter">
                    {orders[0]?.amount.toLocaleString() || '0'} <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">CFA</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Dernier règlement : Mobile Money</p>
                </div>
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 active:scale-95">
                    Télécharger Reçu <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Assistance 24/7</p>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-6 uppercase tracking-tight">
                Une question sur la compatibilité d'une pièce ? Nos experts ivoiriens vous assistent.
              </p>
              <button className="w-full py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95">
                Ouvrir un ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}