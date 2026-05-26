import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Eye, Lock, Crown, ShoppingBag,
  Sparkles, BarChart3, Loader2, Bell,
  Package, Plus, Settings
} from 'lucide-react';

// --- TYPES ---
type SubscriptionPlan = 'standard' | 'pro' | 'premium';

interface DashboardStats {
  views: number;
  productsCount: number;
  totalSales: number;
  conversionRate: number;
}

// --- COMPOSANT PLAN GUARD ---
const PlanGuard = ({ plan, required, children, label }: { 
  plan: SubscriptionPlan, 
  required: SubscriptionPlan, 
  children: React.ReactNode, 
  label: string 
}) => {
  const navigate = useNavigate();
  const plans: SubscriptionPlan[] = ['standard', 'pro', 'premium'];
  const isLocked = plans.indexOf(plan) < plans.indexOf(required);
  
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative group h-full min-h-[140px] lg:min-h-[160px] animate-in fade-in duration-500 rounded-[1.5rem] lg:rounded-[1.75rem] overflow-hidden border border-white/5 shadow-2xl">
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#010103]/80 backdrop-blur-2xl">
        <div className="absolute -inset-10 bg-purple-600/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10 text-center p-4 lg:p-6 flex flex-col items-center">
          <div className="relative mb-3 flex justify-center">
            <div className="absolute inset-0 bg-purple-500/30 blur-2xl opacity-60 animate-pulse" />
            <div className="relative bg-gradient-to-br from-purple-500 to-violet-700 p-2 lg:p-3 rounded-xl lg:rounded-2xl shadow-lg border border-purple-400/20">
              <Lock className="w-4 h-4 lg:w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-purple-200/70 mb-3">{label}</p>
          <button 
            onClick={() => navigate('/vendor/settings/plans')}
            className="px-4 py-1.5 lg:px-5 lg:py-2 bg-purple-500 text-white text-[8px] lg:text-[9px] font-black rounded-full uppercase tracking-widest hover:bg-purple-400 transition-all shadow-lg active:scale-95"
          >
              Passer en {required.toUpperCase()}
          </button>
        </div>
      </div>
      <div className="grayscale blur-md brightness-[0.2] pointer-events-none h-full select-none">
        {children}
      </div>
    </div>
  );
};

export default function VendorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({ 
    views: 1240, 
    productsCount: 0, 
    totalSales: 0, 
    conversionRate: 2.4 
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profileRes, productsRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('subscription_plan, max_products, store_name').eq('id', user.id).single(),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', user.id),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('vendor_id', user.id).eq('is_read', false)
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      setStats(prev => ({ ...prev, productsCount: productsRes.count || 0 }));
      setUnreadCount(notifRes.count || 0);
    } catch (error) {
      console.error("Erreur dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const plan: SubscriptionPlan = profile?.subscription_plan || 'standard';
  const maxProducts = profile?.max_products || 10;
  const quota = Math.min((stats.productsCount / maxProducts) * 100, 100);

  const planConfig = {
    standard: { color: 'from-slate-600 to-slate-900', accent: 'text-slate-400', progress: 'bg-slate-500', icon: Package },
    pro: { color: 'from-blue-600 to-indigo-900', accent: 'text-blue-400', progress: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]', icon: Crown },
    premium: { color: 'from-purple-600 to-violet-800', accent: 'text-purple-400', progress: 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]', icon: Crown }
  };
  
  const currentStyle = planConfig[plan] || planConfig.standard;
  const PlanIcon = currentStyle.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020305] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020305] relative text-white pb-24 lg:pb-10 font-sans">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#8b5cf6',stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#3b82f6',stopOpacity:1}} />
            </linearGradient>
          </defs>
          <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 L1000,0 L0,0 Z" fill="url(#grad1)" />
          <path d="M0,200 C150,300 350,100 500,200 C650,300 850,100 1000,200 L1000,0 L0,0 Z" fill="url(#grad1)" opacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 p-4 lg:p-10 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
        <header className="relative">
          <div className="relative bg-[#080A0F]/90 backdrop-blur-3xl border border-white/[0.06] p-5 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4 lg:gap-6">
                <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-gradient-to-br ${currentStyle.color} shadow-2xl`}>
                  <PlanIcon className="w-6 h-6 lg:w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Panel Vendeur</h1>
                  <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tighter mt-0.5 italic leading-none">
                    {profile?.store_name || 'Boutique'}
                  </h2>
                </div>
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                <button 
                  onClick={() => navigate('/vendor/notifications')} 
                  className="p-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 rounded-xl transition-all relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-[9px] flex items-center justify-center font-black text-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button onClick={() => navigate('/vendor/products/new')} className="flex-1 px-4 py-3 bg-white hover:bg-slate-100 text-black rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md">
                  <Plus size={14} strokeWidth={3} /> Nouveau
                </button>
                <button onClick={() => navigate('/vendor/products')} className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                  <Settings size={14} /> Stock
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-[#080A0F]/70 border border-white/[0.04] p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] shadow-lg">
             <div className="flex justify-between mb-3 items-end">
                <div>
                  <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Usage Inventaire</p>
                  <p className="text-xl lg:text-3xl font-black text-white mt-1">
                    {stats.productsCount} <span className="text-slate-600 text-xs italic">/ {maxProducts >= 9999 ? 'ILLIMITÉ' : maxProducts}</span>
                  </p>
                </div>
                <p className="text-xs font-mono font-bold text-purple-300">{Math.round(quota)}%</p>
             </div>
             <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full ${currentStyle.progress} transition-all duration-1000`} style={{ width: `${quota}%` }} />
             </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-violet-800 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] relative overflow-hidden group border border-purple-500/10 shadow-xl">
            <Sparkles className="absolute -top-4 -right-4 text-white/10 w-20 h-20 lg:w-32 h-32 transform rotate-12 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <p className="text-white text-lg lg:text-xl font-black italic uppercase tracking-tighter">Abonnements</p>
              <p className="text-[9px] text-purple-200/80 font-black uppercase tracking-wider mt-1">Pilotez votre visibilité</p>
              <button onClick={() => navigate('/vendor/settings/plans')} className="mt-4 w-full py-2.5 bg-white text-purple-700 hover:bg-slate-50 text-[9px] lg:text-[10px] font-black rounded-lg uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md">
                Voir les offres
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-[#080A0F]/70 border border-white/[0.04] p-5 lg:p-7 rounded-[1.5rem] shadow-md">
            <ShoppingBag className="w-5 h-5 text-blue-400 mb-4 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 tracking-wider">Revenus</p>
            <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">
              {stats.totalSales.toLocaleString()} <span className="text-[8px] text-slate-500 not-italic">CFA</span>
            </h3>
          </div>
          <PlanGuard plan={plan} required="pro" label="Audience">
            <div className="bg-[#080A0F]/70 border border-white/[0.04] p-5 lg:p-7 rounded-[1.5rem] shadow-md">
              <Eye className="w-5 h-5 text-blue-400 mb-4 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
              <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 tracking-wider">Vues</p>
              <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">{stats.views}</h3>
            </div>
          </PlanGuard>
          <PlanGuard plan={plan} required="pro" label="Conversion">
            <div className="bg-[#080A0F]/70 border border-white/[0.04] p-5 lg:p-7 rounded-[1.5rem] shadow-md">
              <TrendingUp className="w-5 h-5 text-emerald-400 mb-4 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 tracking-wider">Conv.</p>
              <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">{stats.conversionRate}%</h3>
            </div>
          </PlanGuard>
          <PlanGuard plan={plan} required="premium" label="Staff">
            <div className="bg-[#080A0F]/70 border border-white/[0.04] p-5 lg:p-7 rounded-[1.5rem] shadow-md">
              <Users className="w-5 h-5 text-purple-400 mb-4 shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
              <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 tracking-wider">Staff</p>
              <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">2/5</h3>
            </div>
          </PlanGuard>
        </div>

        <PlanGuard plan={plan} required="premium" label="Insights">
           <section className="bg-[#080A0F]/70 border border-white/[0.04] p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400 mb-6 lg:mb-10">
                <BarChart3 size={16} className="text-purple-500" /> Performance
              </h3>
              <div className="h-32 lg:h-48 flex items-end gap-2 lg:gap-3">
                  {[40, 65, 45, 80, 75, 100, 90, 110].map((v, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-lg lg:rounded-t-xl animate-in slide-in-from-bottom duration-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
                      style={{ height: `${(v/110)*100}%` }} 
                    />
                  ))}
              </div>
           </section>
        </PlanGuard>
      </div>
    </div>
  );
}