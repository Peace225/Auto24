import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Loader2, Users, Package, 
  CreditCard, Gavel, ShoppingCart, Store, 
  ArrowUpRight, RefreshCw,
  TrendingUp, DollarSign, PlusCircle, ChevronRight, Crown
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
import SellersManager from "./components/SellersManager";
import ProductsManager from "./components/ProductsManager";
import TransactionsManager from "./components/TransactionsManager";
import DisputesManager from "./components/DisputesManager";
import CreateStore from "./CreateStore";
import AddProductAdmin from "./components/AddProductAdmin"; 
import SettingsManager from "./components/SettingsManager";
import AdminVendors from "./components/AdminVendors"; 

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
    totalTransactions: 0,
    activeDisputes: 0,
    dailyRevenue: 0, 
    dailyMargin: 0,
    storeSales: 0,
    dailyOrders: 0
  });

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: products } = await supabase
        .from('products')
        .select(`*, profiles:vendor_id (store_name)`) 
        .order('created_at', { ascending: false });

      const { data: sellers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false });
        
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
      setAllProducts(products || []); 
      
      setStats(prev => ({
        ...prev,
        totalSellers: sellers?.length || 0,
        totalProducts: products?.length || 0,
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
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboardData]);

  const pendingProductsCount = allProducts.filter(p => p.status === 'pending').length;
  const pendingVendorsCount = allSellers.filter(s => s.status === 'pending').length;

  const renderOverview = () => (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Total Aujourd'hui" value={`${formatPrice(stats.dailyRevenue)} F`} icon={DollarSign} color="gold" />
        <KPICard title="Marge Nette" value={`${formatPrice(stats.dailyMargin)} F`} icon={TrendingUp} color="orange" />
        <KPICard title="Ventes Boutique" value={`${formatPrice(stats.storeSales)} F`} icon={Store} color="metallic" />
        <KPICard title="Commandes" value={stats.dailyOrders} icon={ShoppingCart} color="gold" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#0B0F19] border border-amber-500/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="w-full mt-10 relative z-10" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip />
                <Area type="monotone" dataKey="marketplace" stroke="#f59e0b" fillOpacity={0.1} fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2 italic">🚨 Zone d'urgence</h2>
          
          <div onClick={() => setActiveTab('vendors')} className="cursor-pointer">
             <PriorityItem count={pendingVendorsCount} label="Boutiques à valider" color="orange" />
          </div>
          
          <div onClick={() => setActiveTab('products')} className="cursor-pointer">
             <PriorityItem count={pendingProductsCount} label="Produits à valider" color="gold" />
          </div>
          
          <PriorityItem count={0} label="Litiges à régler" color="red" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction label="Ajouter Produit" icon={PlusCircle} color="gold" onClick={() => setActiveTab('add-product')} />
        <QuickAction label="Gérer Stock" icon={Package} color="metallic" onClick={() => setActiveTab('products')} />
        <QuickAction label="Certifier Vendeur" icon={ShieldCheck} color="gold" onClick={() => setActiveTab('vendors')} />
        <QuickAction label="Créer Boutique" icon={Store} color="orange" onClick={() => setActiveTab('create-store')} />
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading && activeTab !== 'overview') return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-amber-500" /></div>;
    
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'vendors': return <AdminVendors />; 
      case 'sellers': return <SellersManager sellers={allSellers} onRefresh={fetchDashboardData} setActiveTab={setActiveTab} />;
      case 'products': return <ProductsManager products={allProducts} onApprove={fetchDashboardData} onReject={fetchDashboardData} />;
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
      <div className="h-[75px] border-b border-amber-500/10 bg-[#0B0F19]/90 backdrop-blur-xl sticky top-0 z-[999] px-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xs font-[1000] uppercase tracking-[0.25em] text-white italic">
            Command Center <span className="text-amber-500">| Super Admin</span>
          </h2>
        </div>
        <button onClick={fetchDashboardData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-amber-500/10 transition-all">
          <RefreshCw className={`w-4 h-4 text-amber-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 items-start">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 md:p-10 pb-32">
          <div className="max-w-[1500px] mx-auto">
            {renderContent()}
          </div>
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
    <div className={`p-6 rounded-[2rem] border transition-all hover:-translate-y-1 ${themes[color] || themes.metallic}`}>
      <div className="flex justify-between items-start mb-4">
        <Icon className="w-5 h-5" />
        <ArrowUpRight className="w-4 h-4 opacity-30" />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">{title}</p>
      <span className="text-lg md:text-2xl font-[1000] uppercase text-white">{value}</span>
    </div>
  );
}

function PriorityItem({ count, label, color }: any) {
  const styles: any = {
    orange: "border-orange-500/20 text-orange-500",
    gold: "border-amber-500/20 text-amber-500",
    red: "border-red-500/20 text-red-500"
  };
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border bg-white/5 ${styles[color]} group transition-all`}>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center font-black text-xs">{count}</div>
        <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
    </div>
  );
}

function QuickAction({ label, icon: Icon, color, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-[#0B0F19] border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all hover:border-amber-500/30 group">
      <Icon size={24} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
    </button>
  );
}