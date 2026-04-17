import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Loader2, Users, Package, 
  CreditCard, Gavel, ShoppingCart, Store, 
  ArrowUpRight, AlertCircle, RefreshCw,
  TrendingUp, DollarSign, PlusCircle, ChevronRight,
  Menu, MapPin
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import AdminSidebar from "./AdminSidebar";
import AdminBottomBar from "./AdminBottomBar";
import { toast } from 'react-hot-toast';


// Sous-composants pour les onglets
import SellersManager from "./components/SellersManager";
import ProductsManager from "./components/ProductsManager";
import TransactionsManager from "./components/TransactionsManager";
import DisputesManager from "./components/DisputesManager";
import CreateStore from "./CreateStore";

// --- DONNÉES SIMULÉES POUR LE GRAPHIQUE ---
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    activeDisputes: 0,
    dailyRevenue: '450 000',
    dailyMargin: '85 000'
  });

  // --- LOGIQUE DE RÉCUPÉRATION SUPABASE ---
  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Récupération des dossiers en attente
      const { data: sellers } = await supabase.from('profiles').select('*').eq('role', 'vendor').eq('is_verified', false);
      const { data: products } = await supabase.from('products').select('*, profiles(store_name)').eq('status', 'pending');

      // 2. Counts optimisés
      const fetchCount = async (table: string, filterField?: string, filterValue?: any) => {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        if (filterField) query = query.eq(filterField, filterValue);
        const { count } = await query;
        return count || 0;
      };

      const [sCount, pCount, dCount, tCount] = await Promise.all([
        fetchCount('profiles', 'role', 'vendor'),
        fetchCount('products'),
        fetchCount('disputes', 'status', 'open'),
        fetchCount('transactions')
      ]);

      setPendingSellers(sellers || []);
      setPendingProducts(products || []);
      setStats(prev => ({
        ...prev,
        totalSellers: sCount,
        totalProducts: pCount,
        totalTransactions: tCount,
        activeDisputes: dCount,
      }));
    } catch (error) {
      console.error("Erreur Dashboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // --- RENDU : VUE D'ENSEMBLE (OVERVIEW XXL) ---
  const renderOverview = () => (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 🟢 1. TOP KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Total Aujourd'hui" value={`${stats.dailyRevenue} F`} icon={DollarSign} color="emerald" />
        <KPICard title="Marge Nette" value={`${stats.dailyMargin} F`} icon={TrendingUp} color="blue" />
        <KPICard title="Ventes Boutique" value="210 000 F" icon={Store} color="purple" />
        <KPICard title="Commandes" value="24" icon={ShoppingCart} color="orange" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* 🟢 2. GRAPHIQUE CENTRAL (8 cols) */}
        <div className="lg:col-span-8 bg-[#111625] border border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
              <h2 className="text-xl font-[1000] text-white uppercase italic tracking-tighter">Évolution des flux</h2>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Marketplace vs Boutique Officielle</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-blue-500" /> Marketplace
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black text-purple-500 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-purple-500" /> Boutique
               </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                <Tooltip contentStyle={{backgroundColor: '#111625', border: 'none', borderRadius: '16px'}} />
                <Area type="monotone" dataKey="marketplace" stroke="#3b82f6" strokeWidth={4} fill="url(#colorM)" dot={false} />
                <Area type="monotone" dataKey="boutique" stroke="#a855f7" strokeWidth={4} fill="url(#colorB)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🟢 3. PRIORITÉS (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2 italic">🚨 Zone d'urgence</h2>
          <PriorityItem count={5} label="Commandes en attente" color="red" />
          <PriorityItem count={stats.activeDisputes} label="Litiges à régler" color="orange" />
          <PriorityItem count={pendingProducts.length} label="Produits à valider" color="blue" />
          <PriorityItem count={2} label="Stocks critiques" color="red" />
        </div>
      </div>

      {/* 🟢 4. ACTIONS RAPIDES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction label="Ajouter Produit" icon={PlusCircle} color="blue" onClick={() => setActiveTab('products')} />
        <QuickAction label="Gérer Stock" icon={Package} color="purple" onClick={() => {}} />
        <QuickAction label="Certifier Vendeur" icon={ShieldCheck} color="emerald" onClick={() => setActiveTab('sellers')} />
        <QuickAction label="Toutes Commandes" icon={ShoppingCart} color="orange" onClick={() => {}} />
      </div>

      {/* 🟢 5. BLOCS BUSINESS */}
      <div className="grid lg:grid-cols-2 gap-8">
        <BusinessBlock title="BOUTIQUE SPACEAUTO24" color="purple" icon={Store} 
          stats={[{l: "CA Jour", v: "100k F"}, {l: "Alertes Stock", v: "2"}]}
          topItems={["Batterie Toyota 70Ah", "Huile Castrol 5W40"]}
        />
        <BusinessBlock title="PERFORMANCE MARKETPLACE" color="blue" icon={Users} 
          stats={[{l: "Vendeurs Pro", v: stats.totalSellers}, {l: "Commissions", v: "50k F"}]}
          topItems={["Yao Auto Marcory", "Abidjan Pièces"]}
        />
      </div>

      {/* 🟢 6. RÉSUMÉ FINANCIER GLOBAL */}
      <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 md:p-14 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] group-hover:bg-blue-600/20 transition-all duration-1000" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="text-center md:text-left">
             <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Volume d'affaires Hebdomadaire</p>
             <h4 className="text-5xl md:text-7xl font-[1000] italic tracking-tighter uppercase text-white leading-none">900 000 <span className="text-xl">FCFA</span></h4>
           </div>
           <div className="grid grid-cols-2 gap-10 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 md:pl-12">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Marketplace (Comms)</p>
                <p className="text-2xl font-black text-white italic">250 000 F</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Boutique Officielle</p>
                <p className="text-2xl font-black text-white italic">650 000 F</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading && activeTab !== 'overview') return <div className="h-96 flex flex-col items-center justify-center gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sync en cours...</span></div>;
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'sellers': return <SellersManager sellers={pendingSellers} onApprove={fetchDashboardData} onReject={fetchDashboardData} />;
      case 'products': return <ProductsManager products={pendingProducts} onApprove={fetchDashboardData} onReject={fetchDashboardData} />;
      case 'payments': return <TransactionsManager />;
      case 'disputes': return <DisputesManager />;
      case 'create-store': return <CreateStore setActiveTab={setActiveTab} />;
      default: return renderOverview();
    }
  };

  return (
    <div className="bg-[#0B0F1A] min-h-screen text-slate-200 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* 🟢 SUBHEADER FIXED (Glassmorphism) */}
      <div className="h-[65px] md:h-[75px] border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-[100] px-4 md:px-10 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[10px] md:text-xs font-[1000] uppercase tracking-[0.25em] text-white italic leading-none">Command Center</h2>
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-80">{activeTab}</span>
          </div>
        </div>
        
        <button onClick={fetchDashboardData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 group active:scale-95">
          <RefreshCw className={`w-4 h-4 text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:block text-[9px] font-black uppercase text-slate-400 tracking-widest group-hover:text-white">Live Sync</span>
        </button>
      </div>

      <div className="flex flex-1 items-start relative">
        {/* 🟢 SIDEBAR DESKTOP */}
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* 🟢 MAIN CONTENT (Scrollable under Subheader) */}
        <main className="flex-1 p-4 md:p-10 pb-32 xl:pb-10 relative z-10">
          <div className="max-w-[1500px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* 🟢 NAVIGATION MOBILE BAS DE PAGE */}
      <AdminBottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// --- SOUS-COMPOSANTS XXL ---

function KPICard({ title, value, icon: Icon, color }: any) {
  const themes: any = {
    emerald: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
    blue: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    purple: 'text-purple-500 border-purple-500/20 bg-purple-500/5',
    orange: 'text-orange-500 border-orange-500/20 bg-orange-500/5'
  };
  return (
    <div className={`p-5 md:p-6 rounded-[2rem] border transition-all hover:-translate-y-1 hover:shadow-2xl ${themes[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-white/5"><Icon className="w-5 h-5" /></div>
        <ArrowUpRight className="w-4 h-4 opacity-20" />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-50 mb-1">{title}</p>
      <span className="text-base md:text-2xl font-[1000] italic tracking-tighter uppercase text-white">{value}</span>
    </div>
  );
}

function PriorityItem({ count, label, color }: any) {
  const styles: any = {
    red: "bg-red-500/10 border-red-500/20 text-red-500",
    orange: "bg-orange-500/10 border-orange-100/10 text-orange-500",
    blue: "bg-blue-500/10 border-blue-500/10 text-blue-500"
  };
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${styles[color]} group cursor-pointer hover:bg-white/5 transition-all active:scale-[0.98]`}>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black text-xs shadow-inner">{count}</div>
        <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform opacity-30" />
    </div>
  );
}

function QuickAction({ label, icon: Icon, color, onClick }: any) {
  const styles: any = {
    blue: "bg-blue-600/10 border-blue-600/20 text-blue-500",
    purple: "bg-purple-600/10 border-purple-600/20 text-purple-500",
    emerald: "bg-emerald-600/10 border-emerald-600/20 text-emerald-500",
    orange: "bg-orange-600/10 border-orange-600/20 text-orange-500"
  };
  return (
    <button onClick={onClick} className={`${styles[color]} border p-5 md:p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all hover:bg-white/5 active:scale-95`}>
      <Icon size={24} />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-center">{label}</span>
    </button>
  );
}

function BusinessBlock({ title, color, icon: Icon, stats, topItems }: any) {
  const borderColor = color === 'purple' ? 'border-purple-500/20' : 'border-blue-500/20';
  const textColor = color === 'purple' ? 'text-purple-500' : 'text-blue-500';
  return (
    <div className={`bg-[#111625] border ${borderColor} rounded-[2.5rem] p-8 md:p-10 shadow-xl`}>
      <h3 className={`text-lg md:text-xl font-[1000] italic uppercase tracking-tighter mb-8 flex items-center gap-4 ${textColor}`}>
        <Icon size={24} /> {title}
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {stats.map((s: any, i: number) => (
          <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.l}</p>
            <p className="text-base md:text-lg font-[1000] text-white italic">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">🔥 TOP PERFORMANCES</p>
        {topItems.map((item: string, i: number) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl text-[10px] font-bold text-slate-300 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-black">0{i+1}</span>
              {item}
            </div>
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}