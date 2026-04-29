import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Loader2, Users, Package, 
  Store, RefreshCw, TrendingUp, DollarSign, 
  PlusCircle, ChevronRight, Crown, Database, Bell
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore'; 
import AdminSidebar from "./AdminSidebar";
import AdminBottomBar from "./AdminBottomBar";

// Sous-composants
import GlobalStockManager from "./components/GlobalStockManager";
import MyStoreInventory from "./components/MyStoreInventory"; // 🟢 Importé
import SubscriptionManager from "./components/SubscriptionManager"; // 🟢 Importé
import SellersManager from "./components/SellersManager";
import TransactionsManager from "./components/TransactionsManager";
import DisputesManager from "./components/DisputesManager";
import CreateStore from "./CreateStore";
import AddProductAdmin from "./components/AddProductAdmin"; 
import SettingsManager from "./components/SettingsManager";
import AdminVendors from "./components/AdminVendors"; 
import VehicleManager from "./components/VehicleManager";
import UserManager from "./components/UserManager"; 

const chartData = [
  { name: 'Lun', marketplace: 4000, boutique: 2400 },
  { name: 'Mar', marketplace: 3000, boutique: 1398 },
  { name: 'Mer', marketplace: 2000, boutique: 9800 },
  { name: 'Jeu', marketplace: 2780, boutique: 3908 },
  { name: 'Ven', marketplace: 1890, boutique: 4800 },
  { name: 'Sam', marketplace: 2390, boutique: 3800 },
  { name: 'Dim', marketplace: 3490, boutique: 4300 },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR').format(price);
};

export default function AdminDashboard() {
  const { user } = useAuthStore(); 
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false); 
  
  const [allSellers, setAllSellers] = useState<any[]>([]);
  const [pendingSubsCount, setPendingSubsCount] = useState(0); // 🟢 État abonnements
  
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalProducts: 0,
    totalVehicles: 0,
    dailyRevenue: 0, 
    dailyMargin: 0,
    dailyOrders: 0
  });

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 🟢 Exécution parallèle de toutes les statistiques
      const [productsRes, batteriesRes, sellersRes, vehiclesRes, ordersRes, subsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('batteries').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').eq('role', 'vendor').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').gte('created_at', today.toISOString()).neq('status', 'cancelled'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'pending')
      ]);

      const sellers = sellersRes.data || [];
      const revenue = (ordersRes.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setAllSellers(sellers);
      setPendingSubsCount(subsRes.count || 0); // Maj compteur abonnements
      
      setStats({
        totalSellers: sellers.length,
        totalProducts: (productsRes.count || 0) + (batteriesRes.count || 0),
        totalVehicles: vehiclesRes.count || 0,
        dailyRevenue: revenue,
        dailyMargin: revenue * 0.15,
        dailyOrders: ordersRes.data?.length || 0
      });

    } catch (error) {
      console.error("Erreur Sync Dashboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    setIsChartReady(true);

    // 🟢 Realtime étendu : Écoute les commandes ET les changements de profils (abonnements)
    const channel = supabase.channel('admin-realtime-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchDashboardData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboardData]);

  const renderOverview = () => (
    <div className="space-y-3 md:space-y-10 animate-in fade-in duration-700">
      
      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-6">
        <KPICard title="CA JOUR" value={`${formatPrice(stats.dailyRevenue)} F`} icon={DollarSign} color="gold" />
        <KPICard title="MARGE" value={`${formatPrice(stats.dailyMargin)} F`} icon={TrendingUp} color="orange" />
        <KPICard title="STOCK" value={stats.totalProducts} icon={Package} color="gold" />
        <KPICard title="VÉHICULES" value={stats.totalVehicles} icon={Database} color="metallic" />
      </div>

      <div className="grid lg:grid-cols-12 gap-3 md:gap-8">
        <div className="lg:col-span-8 bg-[#0B0F19] border border-amber-500/10 rounded-xl md:rounded-[2.5rem] p-3 md:p-8 shadow-2xl relative">
          <h3 className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-white mb-3 md:mb-6">Flux des transactions</h3>
          
          <div className="w-full h-[150px] md:h-[300px] min-h-[150px]">
            {isChartReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={10}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 8}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 8}} />
                  <Tooltip contentStyle={{backgroundColor: '#0B0F19', border: '1px solid #ffffff10', fontSize: '10px'}} />
                  <Area type="monotone" dataKey="marketplace" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorGold)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-2.5 md:space-y-4">
          <h2 className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 italic">🚨 Actions Requises</h2>
          
          {/* Alerte abonnements Pro/Premium */}
          <PriorityItem 
            count={pendingSubsCount} 
            label="Abonnements en attente" 
            color="orange" 
            onClick={() => setActiveTab('subscriptions')} 
          />

          <PriorityItem 
            count={allSellers.filter(s => s.status === 'pending').length} 
            label="Boutiques à valider" 
            color="gold" 
            onClick={() => setActiveTab('vendors')} 
          />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <QuickAction label="Ajout" icon={PlusCircle} onClick={() => setActiveTab('add-product')} />
        <QuickAction label="Mon Stock" icon={Store} onClick={() => setActiveTab('my-store')} />
        <QuickAction label="Users" icon={Users} onClick={() => setActiveTab('users')} />
        <QuickAction label="Réglages" icon={ShieldCheck} onClick={() => setActiveTab('settings')} />
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading && activeTab !== 'overview') return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-amber-500 w-8 h-8" />
        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Synchronisation...</p>
      </div>
    );
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'my-store': return <MyStoreInventory />; // 🟢 Inclus
      case 'subscriptions': return <SubscriptionManager />; // 🟢 Inclus
      case 'users': return <UserManager />; 
      case 'vendors': return <AdminVendors />; 
      case 'sellers': return <SellersManager sellers={allSellers} onRefresh={fetchDashboardData} setActiveTab={setActiveTab} />;
      case 'products': return <GlobalStockManager />; 
      case 'ktype': return <VehicleManager />; 
      case 'add-product': return <AddProductAdmin />; 
      case 'payments': return <TransactionsManager />;
      case 'disputes': return <DisputesManager />;
      case 'settings': return <SettingsManager />;
      case 'create-store': return <CreateStore setActiveTab={setActiveTab} />;
      default: return renderOverview();
    }
  };

  return (
    <div className="bg-[#05070B] min-h-screen text-slate-200 flex flex-col font-sans relative overflow-x-hidden">
      <header className="h-[55px] md:h-[75px] border-b border-amber-500/10 bg-[#0B0F19]/90 backdrop-blur-xl sticky top-0 z-[999] px-4 md:px-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-2 md:gap-5">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20 shrink-0">
            <Crown className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[10px] md:text-xs font-[1000] uppercase tracking-wider text-white italic leading-none truncate">SpaceAuto Admin</h1>
            <p className="text-[6px] md:text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1">Dashboard Global</p>
          </div>
        </div>

        <button 
          onClick={fetchDashboardData} 
          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-amber-500/10 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="flex flex-1 items-start w-full min-w-0">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 min-w-0 overflow-x-hidden p-3 md:p-10 pb-24 md:pb-32 w-full">
          <div className="max-w-[1400px] mx-auto w-full">{renderContent()}</div>
        </main>
      </div>
      
      <AdminBottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function KPICard({ title, value, icon: Icon, color }: any) {
  const themes: any = {
    gold: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    orange: 'border-orange-500/20 bg-orange-500/5 text-orange-500',
    metallic: 'border-slate-500/30 bg-slate-500/5 text-slate-300',
  };
  return (
    <div className={`p-3 md:p-6 rounded-xl md:rounded-[2rem] border transition-all shadow-md ${themes[color]}`}>
      <div className="p-1.5 md:p-2.5 bg-black/40 rounded-lg w-fit mb-2 md:mb-4">
        <Icon size={14} className="md:size-5" />
      </div>
      <p className="text-[6px] md:text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{title}</p>
      <span className="text-[11px] md:text-2xl font-[1000] uppercase text-white tracking-tighter italic leading-none">{value}</span>
    </div>
  );
}

function PriorityItem({ count, label, color, onClick }: any) {
  const styles: any = {
    orange: "border-orange-500/20 text-orange-500",
    gold: "border-amber-500/20 text-amber-500",
  };
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center justify-between p-2.5 md:p-5 rounded-xl border bg-white/[0.02] w-full text-left group transition-all duration-300 ${styles[color]} ${count > 0 ? 'animate-pulse border-orange-500/40' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg bg-black/60 flex items-center justify-center font-black text-[10px] md:text-xs border border-white/5">
          {count}
        </div>
        <p className="text-[7px] md:text-[10px] font-[1000] uppercase tracking-widest italic">{label}</p>
      </div>
      <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

function QuickAction({ label, icon: Icon, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className="bg-[#0B0F19] border border-white/[0.03] p-3 md:p-8 rounded-xl md:rounded-[2.5rem] flex flex-col items-center gap-2 md:gap-4 transition-all hover:border-amber-500/40 group w-full"
    >
      <Icon size={16} className="text-slate-600 group-hover:text-amber-500 transition-all md:size-7" />
      <span className="text-[6px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">{label}</span>
    </button>
  );
}