import { useState, useEffect } from 'react';
import {
  ShieldCheck, Loader2, Users, Package, RefreshCw,
  Database, DollarSign, MessageSquare, AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';
import AdminSidebar from "./AdminSidebar";

// Composants
import GlobalStockManager from "./components/GlobalStockManager";
import MyStoreInventory from "./components/MyStoreInventory";
import SubscriptionManager from "./components/SubscriptionManager";
import TransactionsManager from "./components/TransactionsManager";
import AddProductAdmin from "./components/AddProductAdmin";
import SettingsManager from "./components/SettingsManager";
import AdminVendors from "./components/AdminVendors";
import UserManager from "./components/UserManager";
import VehicleManager from "./components/VehicleManager";
import DisputesManager from "./components/DisputesManager";
import MessagesComponent from "./components/MessagesComponent";
import OrdersManager from "./components/OrdersManager";
import CreateStore from "./CreateStore";
// 👇 NOUVEL IMPORT POUR LES PROMOS 👇
import AdminPromoManager from "./components/AdminPromoManager"; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState({ products: 0, users: 0, vehicles: 0, dailyRevenue: 0 });
  const [alerts, setAlerts] = useState({ pendingSubs: 0, unreadMsgs: 0, pendingDocs: 0, pendingOrders: 0 });

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setIsRefreshing(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [pRes, uRes, vRes, subRes, msgRes, docRes, revRes, orderRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('vehicles').select('id', { count: 'exact', head: true }),
          supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('document_status', 'pending'),
          supabase.from('transactions').select('amount').eq('status', 'completed').gte('created_at', today),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        const dailyRev = revRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        if (isMounted) {
          setStats({
            products: pRes.count || 0,
            users: uRes.count || 0,
            vehicles: vRes.count || 0,
            dailyRevenue: dailyRev
          });
          setAlerts({
            pendingSubs: subRes.count || 0,
            unreadMsgs: msgRes.count || 0,
            pendingDocs: docRes.count || 0,
            pendingOrders: orderRes.count || 0
          });
        }
      } catch (err) {
        console.error("Erreur Fetch:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchDashboardData();

    const channel = supabase.channel('admin-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboardData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchDashboardData)
    .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="bg-[#05070B] min-h-screen text-slate-200 flex flex-col">
      <header className="h-16 md:h-20 border-b border-white/10 bg-[#080B12]/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 md:px-10">
        <h1 className="text-lg md:text-xl font-black uppercase text-white">SpaceAuto <span className="text-amber-500">Admin</span></h1>
        <button onClick={handleRefresh} disabled={isRefreshing} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50">
          <RefreshCw size={18} className={isRefreshing? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="flex flex-1 min-h-0 min-w-0">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10 overflow-y-auto pb-24 lg:pb-10">
          {isLoading? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-amber-500" size={40}/>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {(alerts.pendingSubs > 0 || alerts.unreadMsgs > 0 || alerts.pendingDocs > 0 || alerts.pendingOrders > 0) && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                  <p className="text-red-400 font-bold text-xs flex items-center gap-2 flex-wrap">
                    <AlertCircle size={16} /> <span>Alertes :</span>
                    {alerts.pendingOrders > 0 && <button onClick={() => setActiveTab('orders')} className="underline">{alerts.pendingOrders} commandes</button>}
                  </p>
                </div>
              )}
              {activeTab === 'overview'? <OverviewSection stats={stats} /> : renderContent(activeTab, setActiveTab)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewSection({ stats }: any) {
  const salesData = [
    { name: 'Lun', val: 4000 }, { name: 'Mar', val: 3000 }, { name: 'Mer', val: 5000 },
    { name: 'Jeu', val: 2780 }, { name: 'Ven', val: 1890 }, { name: 'Sam', val: 3200 }, { name: 'Dim', val: 4100 }
  ];

  return (
    <div className="space-y-6 min-w-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <KPICard title="Produits" value={stats.products} icon={Package} color="blue" />
        <KPICard title="Véhicules" value={stats.vehicles} icon={Database} color="purple" />
        <KPICard title="Utilisateurs" value={stats.users} icon={Users} color="amber" />
        <KPICard title="Revenus" value={`${(stats.dailyRevenue || 0).toLocaleString()} FCFA`} icon={DollarSign} color="amber" />
      </div>

      <div className="bg-[#080B12] p-4 md:p-6 rounded-3xl border border-white/5 min-w-0">
        <h3 className="text-white font-bold mb-4 text-sm">Évolution des Ventes</h3>
        {/* ✅ CORRIGÉ : Hauteur fixée avec h-64 pour que le graphique s'affiche */}
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} width={35} />
              <Tooltip contentStyle={{ backgroundColor: '#05070B', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: any) {
  const colorMap: any = { blue: "text-blue-500", purple: "text-purple-500", amber: "text-amber-500" };
  return (
    <div className="bg-[#080B12] p-4 md:p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
      <Icon className={`${colorMap[color]} mb-3`} size={20} />
      {/* ✅ CORRIGÉ : text-[10px] au lieu du "text-" incomplet */}
      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{title}</p>
      <p className="text-lg md:text-xl font-black mt-1 text-white">{value}</p>
    </div>
  );
}

function renderContent(tab: string, setActiveTab: any) {
  switch (tab) {
    case 'create-store': return <CreateStore setActiveTab={setActiveTab} />;
    case 'my-store': return <MyStoreInventory />;
    case 'products': return <GlobalStockManager />;
    case 'orders': return <OrdersManager />;
    case 'subscriptions': return <SubscriptionManager />;
    case 'users': return <UserManager />;
    case 'vendors': return <AdminVendors />;
    case 'payments': return <TransactionsManager />;
    case 'add-product': return <AddProductAdmin setActiveTab={setActiveTab} />;
    case 'messages': return <MessagesComponent />;
    case 'disputes': return <DisputesManager />;
    case 'ktype': return <VehicleManager />;
    case 'settings': return <SettingsManager />;
    // 👇 NOUVELLE LIGNE POUR CONNECTER LE BOUTON À LA PAGE 👇
    case 'promotions': return <AdminPromoManager />;
    default: return null;
  }
}