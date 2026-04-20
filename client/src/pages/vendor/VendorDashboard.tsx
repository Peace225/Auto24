import { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingCart, TrendingUp, ShieldAlert, CheckCircle2, ArrowRight, Star, Zap, Crown, Users, Rocket, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

const PACKAGES = [
  {
    id: 'free',
    name: 'Essentiel',
    price: '0 CFA',
    icon: <Star className="w-5 h-5 text-slate-400" />,
    features: ['10 produits max', 'Visibilité basique'],
    color: 'slate',
    maxProducts: 10
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '5 000',
    icon: <Zap className="w-5 h-5 text-white" />,
    badge: 'CHOIX N°1',
    features: ['Stock illimité', 'Vendeur Fiable'],
    color: 'blue',
    maxProducts: 99999
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '15 000',
    icon: <Crown className="w-5 h-5 text-orange-500" />,
    features: ['Bannière Accueil', 'Commission 1%'],
    color: 'orange',
    maxProducts: 99999
  }
];

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 🟢 ÉTATS DYNAMIQUES
  const [vendorData, setVendorData] = useState({ status: 'unverified', plan: 'free' });
  const [stats, setStats] = useState({
    revenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    productCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // --- LOGIQUE DE RÉCUPÉRATION ---
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      // 1. Profil du vendeur
      const { data: profile } = await supabase
        .from('profiles')
        .select('vendor_status, subscription_plan')
        .eq('id', user.id)
        .single();

      if (profile) {
        setVendorData({ 
          status: profile.vendor_status || 'unverified', 
          plan: profile.subscription_plan || 'free' 
        });
      }

      // 2. Compter les produits du vendeur
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

      // 3. Récupérer les commandes récentes (Simulées via order_items si tu n'as pas de table Orders)
      // *Adapté selon ta structure. Ici on suppose une table 'order_items' liée au vendor_id*
      const { data: ordersData } = await supabase
        .from('order_items')
        .select('id, status, price, created_at, orders(client_name)') // Modifie selon ton schéma réel
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calcul des stats sur les commandes
      let totalRevenue = 0;
      let pending = 0;
      const formattedOrders: any[] = [];

      if (ordersData) {
        ordersData.forEach(item => {
          if (item.status === 'delivered' || item.status === 'completed') totalRevenue += item.price;
          if (item.status === 'pending') pending += 1;
          
          formattedOrders.push({
            id: `CMD-${item.id.substring(0,6).toUpperCase()}`,
            client: item.orders?.client_name || 'Client',
            status: item.status,
            amount: item.price,
            date: new Date(item.created_at).toLocaleDateString('fr-FR')
          });
        });
      }

      setStats({
        revenue: totalRevenue,
        totalOrders: ordersData?.length || 0,
        pendingOrders: pending,
        productCount: productCount || 0
      });
      setRecentOrders(formattedOrders);

    } catch (error) {
      console.error("Erreur Dashboard Vendeur:", error);
    } finally {
      setIsLoadingData(false);
      setTimeout(() => setIsLoaded(true), 100);
    }
  }, [user]);

  // 🟢 LOGIQUE TEMPS RÉEL
  useEffect(() => {
    fetchDashboardData();

    if (!user) return;

    const channel = supabase
      .channel(`vendor-${user.id}-updates`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `vendor_id=eq.${user.id}` }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `vendor_id=eq.${user.id}` }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDashboardData]);

  const currentPlan = PACKAGES.find(p => p.id === vendorData.plan) || PACKAGES[0];
  const maxCapacity = currentPlan.maxProducts;
  const isFull = stats.productCount >= maxCapacity;

  if (isLoadingData) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className={`space-y-5 md:space-y-8 w-full transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      
      {/* 🔴 SECTION UPSELL (Affiche uniquement si le plan est "free") */}
      {vendorData.plan === 'free' && (
        <div className="bg-slate-900 rounded-3xl md:rounded-[2rem] shadow-2xl relative overflow-hidden border border-slate-800 group mt-2 w-full">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-emerald-400 to-orange-500"></div>
          <div className="absolute top-1/2 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none transition-all duration-1000"></div>
          
          <div className="p-5 md:p-8 lg:p-12 flex flex-col xl:flex-row gap-8 lg:gap-12 items-center relative z-10 w-full">
            <div className="w-full xl:w-5/12 text-center xl:text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/5 text-blue-400 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10 backdrop-blur-sm">
                <Rocket className="w-3.5 h-3.5" /> Propulsez vos ventes
              </div>
              <h2 className="text-[1.35rem] sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight mb-5 leading-tight">
                Vendez <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">4x plus</span> en Pro.
              </h2>
              
              <div className="space-y-4 text-left max-w-sm mx-auto xl:mx-0">
                <div className="flex gap-3 md:gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xs md:text-sm uppercase tracking-tight mb-0.5">Faites sauter la limite</h4>
                    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed font-medium">Ne laissez pas votre potentiel bloqué à 10 pièces.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 md:gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-lg">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xs md:text-sm uppercase tracking-tight mb-0.5">Badge de Confiance</h4>
                    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed font-medium">Les vendeurs vérifiés convertissent 80% en plus.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full xl:w-7/12 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-4">
              {PACKAGES.map((pkg) => (
                <div 
                  key={pkg.id} 
                  onClick={() => navigate('/vendor/settings')}
                  className={`rounded-2xl p-4 sm:p-5 relative transition-all duration-300 cursor-pointer flex flex-col h-full group/card
                    ${pkg.id === 'pro' 
                      ? 'bg-blue-600 border-none shadow-xl shadow-blue-600/40 md:-translate-y-3 md:scale-105 z-10' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md z-0'}
                  `}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-900 px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
                      {pkg.badge}
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center text-center mb-4 sm:mb-6 pt-2">
                    <div className={`p-2.5 rounded-xl mb-2 sm:mb-3 transition-transform group-hover/card:scale-110 duration-300 ${pkg.id === 'pro' ? 'bg-white/20' : 'bg-slate-800'}`}>
                      {pkg.icon}
                    </div>
                    <h3 className={`font-black uppercase tracking-tight text-xs sm:text-sm mb-1 ${pkg.id === 'pro' ? 'text-white' : 'text-slate-200'}`}>{pkg.name}</h3>
                    <div className={`text-xl sm:text-2xl font-black leading-none ${pkg.id === 'pro' ? 'text-white' : 'text-white'}`}>
                      {pkg.price} {pkg.id !== 'free' && <span className={`text-[8px] sm:text-[9px] font-bold tracking-widest uppercase ${pkg.id === 'pro' ? 'text-blue-200' : 'text-slate-500'}`}>/mois</span>}
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4 sm:mb-6 flex-grow">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className={`flex items-start gap-1.5 text-[9px] sm:text-[10px] font-bold leading-tight ${pkg.id === 'pro' ? 'text-blue-50' : 'text-slate-400'}`}>
                        <CheckCircle2 className={`w-3 h-3 shrink-0 ${pkg.id === 'pro' ? 'text-white' : 'text-slate-600'}`} /> 
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-2.5 sm:py-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all mt-auto
                    ${pkg.id === 'pro' 
                      ? 'bg-white text-blue-900 hover:bg-slate-100 shadow-md' 
                      : 'bg-white/10 text-white hover:bg-white/20'}
                  `}>
                    Choisir
                  </button>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}

      {/* ALERTE CERTIFICATION */}
      {vendorData.status !== 'approved' && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
               <ShieldAlert className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-black text-orange-900 uppercase text-[11px] sm:text-xs mb-0.5">Identité Non Vérifiée</h3>
              <p className="text-[9px] sm:text-[10px] font-bold text-orange-700/80 tracking-wide">Fournissez vos documents (RCCM & CNI).</p>
            </div>
          </div>
          <Link to="/vendor/settings" className="w-full sm:w-auto text-center whitespace-nowrap bg-orange-600 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-orange-700 transition-all shadow-md active:scale-95">
            Fournir documents
          </Link>
        </div>
      )}

      {/* STATISTIQUES EN TEMPS RÉEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-0.5">
            {new Intl.NumberFormat('fr-FR').format(stats.revenue)}
          </h3>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">CA Net (CFA)</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            {stats.pendingOrders > 0 && (
              <span className="text-[8px] sm:text-[9px] font-black text-white bg-blue-500 px-2 py-1 rounded-full">{stats.pendingOrders} en attente</span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-0.5">{stats.totalOrders}</h3>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Commandes Totales</p>
        </div>

        <div className={`p-5 sm:p-6 rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group sm:col-span-2 lg:col-span-1 ${isFull ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-start mb-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${isFull ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className={`text-[8px] sm:text-[9px] font-black px-2 py-1 rounded-full border ${isFull ? 'text-red-600 bg-red-100 border-red-200' : 'text-orange-600 bg-orange-50 border-orange-100'}`}>
              {isFull ? 'Plafond atteint' : `${currentPlan.name}`}
            </span>
          </div>
          <h3 className={`text-2xl sm:text-3xl font-black tracking-tighter mb-0.5 ${isFull ? 'text-red-600' : 'text-slate-900'}`}>
            {stats.productCount} <span className={`text-base sm:text-xl ${isFull ? 'text-red-400' : 'text-slate-300'}`}>/ {maxCapacity === 99999 ? '∞' : maxCapacity}</span>
          </h3>
          <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest ${isFull ? 'text-red-500' : 'text-slate-400'}`}>Produits en ligne</p>
        </div>
      </div>

      {/* COMMANDES RÉCENTES */}
      <div className="bg-white rounded-2xl md:rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden w-full">
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight">Dernières Commandes</h2>
          </div>
          <Link to="/vendor/orders" className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-slate-900 transition-colors bg-white px-3 py-1.5 md:py-2 rounded-lg border border-slate-200 shadow-sm">
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="w-full overflow-x-auto p-0">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-slate-400">
                <th className="p-4 font-black">N° Commande</th>
                <th className="p-4 font-black">Client</th>
                <th className="p-4 font-black">Montant Net</th>
                <th className="p-4 font-black">Statut</th>
                <th className="p-4 font-black text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-xs uppercase">Aucune commande pour le moment</td>
                </tr>
              ) : (
                recentOrders.map((order, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 font-black text-blue-600 text-[10px] md:text-xs">{order.id}</td>
                    <td className="p-4 font-bold text-slate-900 text-[10px] md:text-xs">{order.client}</td>
                    <td className="p-4 font-black text-slate-900 text-[10px] md:text-xs">{order.amount.toLocaleString()} <small className="text-slate-400 font-bold ml-1">CFA</small></td>
                    <td className="p-4">
                      <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border ${
                        order.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {order.status === 'pending' ? 'En attente' : 'Terminé'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-400 text-[10px]">
                      {order.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}