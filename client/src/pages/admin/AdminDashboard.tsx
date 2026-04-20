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

const chartData = [
  { name: 'Lun', marketplace: 4000, boutique: 2400 },
  { name: 'Mar', marketplace: 3000, boutique: 1398 },
  { name: 'Mer', marketplace: 2000, boutique: 9800 },
  { name: 'Jeu', marketplace: 2780, boutique: 3908 },
  { name: 'Ven', marketplace: 1890, boutique: 4800 },
  { name: 'Sam', marketplace: 2390, boutique: 3800 },
  { name: 'Dim', marketplace: 3490, boutique: 4300 },
];

export default function AdminDashboard() {
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
    dailyRevenue: '450 000',
    dailyMargin: '85 000'
  });

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('*, profiles(store_name), categories(name)') 
        .order('created_at', { ascending: false });

      if (pError) console.error("Erreur SQL Produits:", pError);

      const { data: sellers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false });

      const { count: sCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor');
      const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

      setAllSellers(sellers || []);
      setAllProducts(products || []); 
      
      setStats(prev => ({
        ...prev,
        totalSellers: sCount || 0,
        totalProducts: pCount || 0,
      }));
    } catch (error) {
      console.error("Erreur globale:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('admin-realtime-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const pendingProductsCount = allProducts.filter(p => p.status === 'pending').length;

  const renderOverview = () => (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* KPIs Premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Total Aujourd'hui" value={`${stats.dailyRevenue} F`} icon={DollarSign} color="gold" />
        <KPICard title="Marge Nette" value={`${stats.dailyMargin} F`} icon={TrendingUp} color="orange" />
        <KPICard title="Ventes Boutique" value="210 000 F" icon={Store} color="metallic" />
        <KPICard title="Commandes" value="24" icon={ShoppingCart} color="gold" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* GRAPHIQUE LUXURY */}
        <div className="lg:col-span-8 bg-[#0B0F19] border border-amber-500/10 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[400px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
              <h2 className="text-xl font-[1000] text-white uppercase italic tracking-tighter flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" /> Évolution des flux
              </h2>
              <p className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest mt-1">Marketplace vs Boutique Officielle</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" /> Marketplace
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black text-orange-500 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" /> Boutique
               </div>
            </div>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                <Tooltip contentStyle={{backgroundColor: '#0B0F19', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', color: '#fff'}} />
                <Area type="monotone" dataKey="marketplace" stroke="#f59e0b" strokeWidth={4} fill="url(#colorM)" dot={false} />
                <Area type="monotone" dataKey="boutique" stroke="#f97316" strokeWidth={4} fill="url(#colorB)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2 italic">🚨 Zone d'urgence</h2>
          <PriorityItem count={5} label="Commandes en attente" color="orange" />
          <PriorityItem count={stats.activeDisputes} label="Litiges à régler" color="red" />
          <div onClick={() => setActiveTab('products')} className="cursor-pointer">
             <PriorityItem count={pendingProductsCount} label="Produits à valider" color="gold" />
          </div>
          <PriorityItem count={2} label="Stocks critiques" color="red" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction label="Ajouter Produit" icon={PlusCircle} color="gold" onClick={() => setActiveTab('add-product')} />
        <QuickAction label="Gérer Stock" icon={Package} color="metallic" onClick={() => setActiveTab('products')} />
        <QuickAction label="Certifier Vendeur" icon={ShieldCheck} color="gold" onClick={() => setActiveTab('sellers')} />
        <QuickAction label="Créer Boutique" icon={Store} color="orange" onClick={() => setActiveTab('create-store')} />
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading && activeTab !== 'overview') return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sync en cours...</span>
      </div>
    );
    
    switch (activeTab) {
      case 'overview': return renderOverview();
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
    <div className="bg-[#05070B] min-h-screen text-slate-200 flex flex-col font-sans relative overflow-x-hidden">
      {/* HEADER LUXURY */}
      <div className="h-[65px] md:h-[75px] border-b border-amber-500/10 bg-[#0B0F19]/90 backdrop-blur-xl sticky top-0 z-[100] px-4 md:px-10 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Crown className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[10px] md:text-xs font-[1000] uppercase tracking-[0.25em] text-white italic leading-none flex items-center gap-2">
              Command Center <span className="text-amber-500 hidden sm:inline">| Kev & Brad</span>
            </h2>
            <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest mt-1 opacity-80">{activeTab}</span>
          </div>
        </div>
        
        <button onClick={fetchDashboardData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-amber-500/10 hover:border-amber-500/30 transition-all flex items-center gap-2 group active:scale-95">
          <RefreshCw className={`w-4 h-4 text-amber-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:block text-[9px] font-black uppercase text-amber-500/70 tracking-widest group-hover:text-amber-400">Live Sync</span>
        </button>
      </div>

      <div className="flex flex-1 items-start relative">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 md:p-10 pb-32 xl:pb-10 relative z-10">
          <div className="max-w-[1500px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <AdminBottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// --- SOUS-COMPOSANTS REVISITÉS ---
function KPICard({ title, value, icon: Icon, color }: any) {
  const themes: any = {
    gold: 'text-amber-400 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent',
    orange: 'text-orange-500 border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent',
    metallic: 'text-slate-300 border-slate-500/30 bg-gradient-to-br from-slate-500/10 to-transparent',
    red: 'text-red-500 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent'
  };
  return (
    <div className={`p-5 md:p-6 rounded-[2rem] border transition-all hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] ${themes[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5"><Icon className="w-5 h-5" /></div>
        <ArrowUpRight className="w-4 h-4 opacity-30" />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mb-1 text-slate-400">{title}</p>
      <span className="text-base md:text-2xl font-[1000] italic tracking-tighter uppercase text-white drop-shadow-md">{value}</span>
    </div>
  );
}

function PriorityItem({ count, label, color }: any) {
  const styles: any = {
    red: "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10",
    orange: "bg-orange-500/5 border-orange-500/20 text-orange-500 hover:bg-orange-500/10",
    gold: "bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
  };
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${styles[color]} group transition-all active:scale-[0.98] shadow-lg`}>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center font-black text-xs shadow-inner">{count}</div>
        <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform opacity-50" />
    </div>
  );
}

function QuickAction({ label, icon: Icon, color, onClick }: any) {
  const styles: any = {
    gold: "bg-[#0B0F19] border-amber-500/20 text-amber-500 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    orange: "bg-[#0B0F19] border-orange-500/20 text-orange-500 hover:border-orange-500/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]",
    metallic: "bg-[#0B0F19] border-slate-500/30 text-slate-300 hover:border-slate-500/50 hover:shadow-[0_0_20px_rgba(100,116,139,0.15)]",
  };
  return (
    <button onClick={onClick} className={`${styles[color]} border p-5 md:p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all active:scale-95 group`}>
      <Icon size={24} className="group-hover:scale-110 transition-transform" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-center text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}