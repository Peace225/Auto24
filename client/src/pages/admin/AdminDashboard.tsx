import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Loader2, Users, Package, 
  CreditCard, Gavel, ShoppingCart, Truck, Store, 
  ArrowUpRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminSidebar from "./AdminSidebar";

// Imports des sous-composants
import SellersManager from "./components/SellersManager";
import ProductsManager from "./components/ProductsManager";
import TransactionsManager from "./components/TransactionsManager";
import DisputesManager from "./components/DisputesManager";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalTransactions: 0,
    activeDisputes: 0,
    pendingDeliveries: 0
  });

  // --- LOGIQUE DE RÉCUPÉRATION ---
  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Note: Si les tables 'disputes' ou 'transactions' n'existent pas, 
      // Supabase renverra une erreur 404. On utilise un try/catch pour isoler.
      
      const { data: sellers } = await supabase.from('profiles').select('*').eq('role', 'vendor').eq('is_verified', false);
      const { data: products } = await supabase.from('products').select('*, profiles(store_name)').eq('status', 'pending');

      // Récupération sécurisée des comptes
      const fetchCount = async (table: string, filterField?: string, filterValue?: any) => {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        if (filterField) query = query.eq(filterField, filterValue);
        const { count, error } = await query;
        if (error) {
            console.warn(`Table ${table} introuvable ou erreur:`, error.message);
            return 0;
        }
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
      setStats({
        totalSellers: sCount,
        totalProducts: pCount,
        totalOrders: 0, 
        totalTransactions: tCount,
        activeDisputes: dCount,
        pendingDeliveries: 0
      });
    } catch (error) {
      console.error("Erreur globale Dashboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- COMPOSANTS INTERNES ---
  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-[#111625] border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-opacity-100 shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
      </div>
      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">{title}</h3>
      <span className="text-2xl font-bold text-white relative z-10">{value}</span>
      <div className={`absolute -right-2 -bottom-2 w-16 h-16 blur-2xl opacity-5 rounded-full ${colorClass.split(' ')[1]}`} />
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Vendeurs" value={stats.totalSellers} icon={Store} colorClass="text-blue-500 bg-blue-500" />
        <StatCard title="Catalogue" value={stats.totalProducts} icon={Package} colorClass="text-emerald-500 bg-emerald-500" />
        <StatCard title="Transactions" value={stats.totalTransactions} icon={CreditCard} colorClass="text-purple-500 bg-purple-500" />
        <StatCard title="Litiges" value={stats.activeDisputes} icon={Gavel} colorClass="text-red-500 bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Actions Prioritaires</h2>
            </div>
            <div className="p-6 space-y-3">
              {pendingSellers.length > 0 && (
                <button onClick={() => setActiveTab('sellers')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all">
                  <span className="text-xs font-bold text-blue-400">{pendingSellers.length} Vendeurs en attente</span>
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </button>
              )}
              {pendingProducts.length > 0 && (
                <button onClick={() => setActiveTab('products')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
                  <span className="text-xs font-bold text-emerald-400">{pendingProducts.length} Produits à valider</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </button>
              )}
              {pendingSellers.length === 0 && pendingProducts.length === 0 && (
                <p className="text-slate-500 text-xs italic text-center py-6 text-white/40 font-medium tracking-wide">
                    Toutes les demandes ont été traitées.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- LA FONCTION DE RENDU (Définie avant le return) ---
  const renderContent = () => {
    if (isLoading && activeTab !== 'overview') {
      return (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chargement...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'sellers': return <SellersManager sellers={pendingSellers} onApprove={fetchDashboardData} onReject={fetchDashboardData} />;
      case 'products': return <ProductsManager products={pendingProducts} onApprove={fetchDashboardData} onReject={fetchDashboardData} />;
      case 'payments': return <TransactionsManager />;
      case 'disputes': return <DisputesManager />;
      default: return renderOverview();
    }
  };

  // --- AFFICHAGE FINAL ---
  return (
    <div className="bg-[#0B0F1A] min-h-screen text-slate-200 flex flex-col font-sans">
      
      {/* SubHeader Admin */}
      <div className="h-[70px] border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-[148px] z-[30] px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Console Admin • {activeTab}</h2>
        </div>
        <button 
          onClick={fetchDashboardData} 
          className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-bold uppercase text-slate-400">Sync</span>
        </button>
      </div>

      <div className="flex flex-1 items-start">
        {/* Sidebar */}
        <aside className="sticky top-[218px] h-[calc(100vh-218px)] w-64 hidden xl:block z-20 border-r border-white/5 bg-[#0B0F1A] overflow-y-auto">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </aside>

        {/* Contenu Principal */}
        <main className="flex-1 p-10 relative z-10">
          <div className="max-w-[1400px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}