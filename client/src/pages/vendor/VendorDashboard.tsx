import { useState, useEffect } from 'react';
import { 
  BarChart3, PlusCircle, Box, TrendingUp, PackageCheck, 
  Truck, Star, Search, MoreVertical, 
  ArrowUpRight, AlertCircle, Loader2, Eye, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface VendorStats {
  monthlySales: number;
  pendingDeliveries: number;
  lowStockCount: number;
  rating: number;
  totalViews: number;
  activeProducts: number;
}

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VendorStats>({
    monthlySales: 0,
    pendingDeliveries: 0,
    lowStockCount: 0,
    rating: 4.8,
    totalViews: 12453,
    activeProducts: 0
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Initialisation des données
  useEffect(() => {
    fetchVendorData();

    // 2. LOGIQUE TEMPS RÉEL (REALTIME)
    // On écoute les changements sur 'transactions' pour mettre à jour le dashboard instantanément
    const transactionsChannel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchVendorData() // Rafraîchit les stats et la liste au moindre changement
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  const fetchVendorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupération simultanée pour de meilleures performances
      const [transResponse, productsResponse] = await Promise.all([
        supabase.from('transactions').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('stock').eq('vendor_id', user.id)
      ]);

      const transData = transResponse.data || [];
      const productsData = productsResponse.data || [];

      // Calcul des stats
      const currentMonth = new Date().getMonth();
      const monthlyTotal = transData.reduce((acc, t) => {
        const orderDate = new Date(t.created_at);
        return orderDate.getMonth() === currentMonth ? acc + (Number(t.total_amount) || 0) : acc;
      }, 0);

      const pending = transData.filter(t => 
        ['pending', 'processing', 'À préparer'].includes(t.status)
      ).length;

      const lowStock = productsData.filter(p => (p.stock || 0) < 5).length;

      setStats(prev => ({
        ...prev,
        monthlySales: monthlyTotal,
        pendingDeliveries: pending,
        lowStockCount: lowStock,
        activeProducts: productsData.length
      }));

      setOrders(transData);
    } catch (error) {
      console.error("Erreur Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Initialisation SpaceAuto24...</p>
      </div>
    </div>
  );

  const filteredOrders = orders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
      (order.customer_name?.toLowerCase() || '').includes(search) || 
      (order.id?.toLowerCase() || '').includes(search)
    );
  });

  const kpiCards = [
    { label: 'Ventes du mois', value: `${stats.monthlySales.toLocaleString()} CFA`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'En attente', value: stats.pendingDeliveries.toString().padStart(2, '0'), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vues Profil', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Note Vendeur', value: `${stats.rating}/5`, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="animate-in fade-in duration-700 pt-28 pb-20 px-8 max-w-[1600px] mx-auto">
      
      {/* HEADER PROFESSIONNEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-900/10">
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-[1000] uppercase text-slate-900 tracking-tighter">Console Vendeur</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Live Status • SpaceAuto24</p>
            </div>
          </div>
        </div>
        
        <Link to="/vendor/products" className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
          <PlusCircle className="w-5 h-5 text-orange-500" /> Ajouter une pièce
        </Link>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm flex flex-col gap-5 hover:border-orange-500/30 transition-all hover:-translate-y-1 group">
            <div className={`h-14 w-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <kpi.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <p className="text-3xl font-[1000] tracking-tighter text-slate-900 mt-1">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* ANALYSE VISUELLE */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-orange-500" /> Analyse des Revenus
                </h3>
                <div className="h-2 w-32 bg-slate-50 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 w-[65%]"></div>
                </div>
             </div>
             <div className="h-56 w-full bg-slate-50/50 rounded-3xl flex items-end px-6 pb-6 gap-3">
                {[40, 70, 45, 90, 65, 120, 85].map((height, idx) => (
                  <div key={idx} className="flex-1 bg-slate-200/50 rounded-xl hover:bg-orange-500 transition-all cursor-pointer relative group" style={{ height: `${height}%` }}>
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all">+{height}k</div>
                  </div>
                ))}
             </div>
          </div>

          {/* TABLEAU FONCTIONNEL */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center p-10 border-b border-slate-50 gap-6">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                <PackageCheck className="w-5 h-5 text-orange-500" /> Flux de Ventes
              </h3>
              <div className="relative w-full md:w-auto">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="RECHERCHER UNE TRANSACTION..." 
                  className="w-full md:w-72 pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-10 py-5">Référence / Client</th>
                    <th className="px-10 py-5">Statut</th>
                    <th className="px-10 py-5 text-right">Montant</th>
                    <th className="px-10 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-xs">
                  {filteredOrders.length > 0 ? filteredOrders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-10 py-6">
                        <p className="text-slate-900 font-[1000] text-[11px] tracking-tight">#{order.id?.slice(0,8).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{order.customer_name || 'Client Direct'}</p>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          {order.status || 'Traitement'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right font-[1000] text-slate-900 text-sm">
                        {order.total_amount?.toLocaleString()} <span className="text-[9px] text-slate-400">CFA</span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={4} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Aucune donnée en direct</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION DROITE : ALERTES & CONTEXTE */}
        <div className="space-y-10">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all"></div>
            
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3 mb-10 relative z-10">
              <AlertCircle className="w-5 h-5 text-orange-500" /> Alertes Inventaire
            </h3>
            
            <div className="space-y-8 relative z-10">
              {stats.lowStockCount > 0 ? (
                <div className="flex items-start gap-5">
                  <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Rupture Critique</p>
                    <p className="text-slate-300 text-[11px] font-bold leading-relaxed">
                      Il reste moins de 5 unités pour <span className="text-white font-black">{stats.lowStockCount} produits</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <PackageCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Stock Sain</p>
                    <p className="text-slate-300 text-[11px] font-bold leading-relaxed">Tous vos produits sont bien approvisionnés.</p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-end mb-3">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Performance Catalogue</p>
                   <p className="text-orange-500 font-black text-xs">{stats.activeProducts}</p>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 w-[75%] rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Satisfaction
             </h3>
             <div className="flex items-end gap-3 mb-8">
                <p className="text-5xl font-[1000] text-slate-900 tracking-tighter">{stats.rating}</p>
                <p className="text-slate-400 font-black text-[10px] uppercase mb-2">Sur 5.0</p>
             </div>
             <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                Votre réactivité sur les commandes à Cocody et Marcory améliore votre visibilité.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}