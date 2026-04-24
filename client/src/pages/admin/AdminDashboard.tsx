import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Loader2, Users, Package, 
  CreditCard, Gavel, ShoppingCart, Store, 
  ArrowUpRight, RefreshCw, Zap,
  TrendingUp, DollarSign, PlusCircle, ChevronRight, Crown, Database
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore'; 
import AdminSidebar from "./AdminSidebar";
import AdminBottomBar from "./AdminBottomBar";

// 🟢 Import du gestionnaire de stock global
import GlobalStockManager from "./components/GlobalStockManager";

// Sous-composants
import SellersManager from "./components/SellersManager";
import TransactionsManager from "./components/TransactionsManager";
import DisputesManager from "./components/DisputesManager";
import CreateStore from "./CreateStore";
import AddProductAdmin from "./components/AddProductAdmin"; 
import SettingsManager from "./components/SettingsManager";
import AdminVendors from "./components/AdminVendors"; 
import VehicleManager from "./components/VehicleManager";

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
  
  const [allSellers, setAllSellers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalProducts: 0,
    totalBatteries: 0,
    totalTransactions: 0,
    activeDisputes: 0,
    dailyRevenue: 0, 
    dailyMargin: 0,
    storeSales: 0,
    dailyOrders: 0,
    totalVehicles: 0 
  });

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Produits Standards
      const { data: products } = await supabase
        .from('products')
        .select(`*, profiles:vendor_id (store_name), categories:category_id (name)`) 
        .order('created_at', { ascending: false });

      // 2. Fetch Batteries
      const { data: batteries } = await supabase
        .from('batteries')
        .select('*')
        .order('created_at', { ascending: false });

      // 3. Fetch Vendeurs
      const { data: sellers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false });

      // 4. Fetch Véhicules (K-Type)
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });
        
      // 5. Fetch Commandes du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayOrders } = await supabase
        .from('orders') 
        .select('total_amount, status')
        .gte('created_at', today.toISOString())
        .neq('status', 'cancelled'); 

      let calcRevenue = 0;
      if (todayOrders) {
        calcRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      }

      setAllSellers(sellers || []);
      
      // Fusion pour le state local (utilisé pour les compteurs)
      const formattedBatteries = (batteries || []).map(b => ({
        ...b,
        isBattery: true,
        categories: { name: 'Batteries' }
      }));
      setAllProducts([...(products || []), ...formattedBatteries]); 
      
      setStats(prev => ({
        ...prev,
        totalSellers: sellers?.length || 0,
        totalProducts: (products?.length || 0) + (batteries?.length || 0),
        totalBatteries: batteries?.length || 0,
        totalVehicles: vehicleCount || 0,
        dailyRevenue: calcRevenue,
        dailyMargin: calcRevenue * 0.15,
        dailyOrders: todayOrders?.length || 0
      }));

    } catch (error) {
      console.error("Erreur Dashboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    const channel = supabase
      .channel('admin-realtime-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batteries' }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboardData]);

  const renderOverview = () => (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="CA Aujourd'hui" value={`${formatPrice(stats.dailyRevenue)} F`} icon={DollarSign} color="gold" />
        <KPICard title="Marge Nette" value={`${formatPrice(stats.dailyMargin)} F`} icon={TrendingUp} color="orange" />
        <KPICard title="Inventaire Global" value={stats.totalProducts} icon={Package} color="gold" />
        <KPICard title="Base Véhicules" value={stats.totalVehicles} icon={Database} color="metallic" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#0B0F19] border border-amber-500/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Flux des transactions</h3>
          </div>
          <div className="w-full relative z-10" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip contentStyle={{backgroundColor: '#0B0F19', border: '1px solid #ffffff10', borderRadius: '12px'}} />
                <Area type="monotone" dataKey="marketplace" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorGold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2 italic">🚨 Actions Requises</h2>
          <PriorityItem count={allSellers.filter(s => s.status === 'pending').length} label="Boutiques en attente" color="orange" onClick={() => setActiveTab('vendors')} />
          {/* 🟢 Redirige vers le GlobalStockManager via l'onglet products */}
          <PriorityItem count={stats.totalProducts} label="Gérer l'inventaire complet" color="gold" onClick={() => setActiveTab('products')} />
          <PriorityItem count={stats.totalBatteries} label="Batteries actives" color="metallic" onClick={() => setActiveTab('products')} />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction label="Ajouter Produit" icon={PlusCircle} onClick={() => setActiveTab('add-product')} />
        <QuickAction label="Inventaire" icon={Package} onClick={() => setActiveTab('products')} />
        <QuickAction label="Vendeurs" icon={Users} onClick={() => setActiveTab('sellers')} />
        <QuickAction label="Configuration" icon={ShieldCheck} onClick={() => setActiveTab('settings')} />
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading && activeTab !== 'overview') return (
      <div className="py-40 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-amber-500 w-12 h-12" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Synchronisation...</p>
      </div>
    );
    
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'vendors': return <AdminVendors />; 
      case 'sellers': return <SellersManager sellers={allSellers} onRefresh={fetchDashboardData} setActiveTab={setActiveTab} />;
      
      // 🟢 LOGIQUE CORRIGÉE : Utilise le GlobalStockManager pour voir TOUT le stock
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
    <div className="bg-[#05070B] min-h-screen text-slate-200 flex flex-col font-sans relative">
      {/* HEADER */}
      <div className="h-[75px] border-b border-amber-500/10 bg-[#0B0F19]/90 backdrop-blur-xl sticky top-0 z-[999] px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-[11px] font-[1000] uppercase tracking-[0.25em] text-white italic leading-none">SpaceAuto Admin</h2>
            <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1.5">Tableau de Bord Global</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={fetchDashboardData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-amber-500/10 transition-all">
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-start">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 md:p-10 pb-32">
          <div className="max-w-[1500px] mx-auto">{renderContent()}</div>
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
    <div className={`p-6 rounded-[2rem] border transition-all hover:-translate-y-1 shadow-2xl ${themes[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-black/40 rounded-xl"><Icon className="w-5 h-5" /></div>
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">{title}</p>
      <span className="text-lg md:text-2xl font-[1000] uppercase text-white tracking-tighter italic">{value}</span>
    </div>
  );
}

function PriorityItem({ count, label, color, onClick }: any) {
  const styles: any = {
    orange: "border-orange-500/20 text-orange-500 hover:bg-orange-500/5",
    gold: "border-amber-500/20 text-amber-500 hover:bg-amber-500/5",
    metallic: "border-slate-500/20 text-slate-400 hover:bg-slate-500/5",
  };
  return (
    <div onClick={onClick} className={`flex items-center justify-between p-5 rounded-[1.5rem] border bg-white/[0.02] cursor-pointer ${styles[color]} group transition-all duration-500`}>
      <div className="flex items-center gap-5">
        <div className="w-10 h-10 rounded-2xl bg-black/60 flex items-center justify-center font-black text-sm border border-white/5">{count}</div>
        <p className="text-[10px] font-[1000] uppercase tracking-widest italic">{label}</p>
      </div>
      <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-[#0B0F19] border border-white/[0.03] p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:border-amber-500/40 group relative overflow-hidden">
      <Icon size={28} className="text-slate-600 group-hover:text-amber-500 transition-all duration-500" />
      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}