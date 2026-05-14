import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Eye, Lock, Crown, ShoppingBag,
  Sparkles, ArrowUpRight, BarChart3, Loader2, 
  Package, Plus, Settings, Zap
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
    <div className="relative group h-full min-h-[140px] lg:min-h-[160px] animate-in fade-in duration-500">
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#030508]/80 backdrop-blur-xl rounded-[1.5rem] lg:rounded-[1.75rem] border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-violet-500/20 opacity-50" />
        <div className="relative z-10 text-center p-4 lg:p-6">
          <div className="relative mb-2 lg:mb-4 flex justify-center">
            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-amber-400 to-orange-600 p-2 lg:p-3 rounded-xl lg:rounded-2xl shadow-xl">
              <Lock className="w-4 h-4 lg:w-5 h-5 text-black" />
            </div>
          </div>
          <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{label}</p>
          <button 
            onClick={() => navigate('/vendor/settings/plans')}
            className="mt-2 lg:mt-3 px-3 py-1 lg:px-4 lg:py-1.5 bg-amber-500 text-black text-[8px] lg:text-[9px] font-black rounded-full uppercase tracking-tighter hover:scale-105 transition-transform"
          >
             Passer en {required.toUpperCase()}
          </button>
        </div>
      </div>
      <div className="grayscale blur-md brightness-50 pointer-events-none h-full select-none">
        {children}
      </div>
    </div>
  );
};

export default function VendorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
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
      const [profileRes, productsRes] = await Promise.all([
        supabase.from('profiles').select('subscription_plan, max_products, store_name').eq('id', user.id).single(),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', user.id)
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      setStats(prev => ({ ...prev, productsCount: productsRes.count || 0 }));
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
    standard: { color: 'from-slate-600 to-slate-800', accent: 'text-slate-400', shadow: 'shadow-slate-500/10', icon: Package },
    pro: { color: 'from-amber-500 to-orange-600', accent: 'text-amber-400', shadow: 'shadow-amber-500/10', icon: Crown },
    premium: { color: 'from-violet-600 to-purple-700', accent: 'text-violet-400', shadow: 'shadow-violet-500/10', icon: Crown }
  };
  
  const currentStyle = planConfig[plan] || planConfig.standard;
  const PlanIcon = currentStyle.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020305] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020305] relative text-white pb-24 lg:pb-10">
      <div className="relative z-10 p-4 lg:p-10 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="relative">
          <div className="relative bg-[#080A0F]/80 backdrop-blur-3xl border border-white/[0.08] p-5 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem]">
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
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[8px] lg:text-[10px] font-black uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 ${currentStyle.accent}`}>
                      Tier: {plan}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                <button onClick={() => navigate('/vendor/products/new')} className="flex-1 px-4 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                  <Plus size={14} strokeWidth={3} /> Nouveau
                </button>
                <button onClick={() => navigate('/vendor/products')} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                  <Settings size={14} /> Stock
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* SECTION QUOTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-[#080A0F]/60 border border-white/5 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem]">
             <div className="flex justify-between mb-3 items-end">
                <div>
                  <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Usage Inventaire</p>
                  <p className="text-xl lg:text-3xl font-black text-white mt-1">
                    {stats.productsCount} <span className="text-slate-600 text-xs italic">/ {maxProducts >= 9999 ? 'ILLIMITÉ' : maxProducts}</span>
                  </p>
                </div>
                <p className="text-xs font-mono font-bold text-amber-500">{Math.round(quota)}%</p>
             </div>
             <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full bg-gradient-to-r ${currentStyle.color} transition-all duration-1000`} style={{ width: `${quota}%` }} />
             </div>
          </div>

          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] relative overflow-hidden group">
            <Sparkles className="absolute top-2 right-2 text-white/20 w-16 h-16 lg:w-24 h-24" />
            <div className="relative z-10">
              <p className="text-white text-lg lg:text-xl font-black italic">Analytics PRO</p>
              <button onClick={() => navigate('/vendor/settings/plans')} className="mt-4 w-full py-2.5 bg-white text-black text-[9px] lg:text-[10px] font-black rounded-lg uppercase tracking-widest hover:scale-[1.02] transition-transform">
                Voir avantages
              </button>
            </div>
          </div>
        </div>

        {/* ANALYTICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Revenus */}
          <div className="bg-[#0A0E14]/90 border border-white/10 p-5 lg:p-7 rounded-[1.5rem]">
            <ShoppingBag className="w-5 h-5 text-blue-400 mb-4" />
            <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500">Revenus</p>
            <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">
              {stats.totalSales.toLocaleString()} <span className="text-[8px] text-slate-500 not-italic">CFA</span>
            </h3>
          </div>

          {/* Vues (Locked) */}
          <PlanGuard plan={plan} required="pro" label="Audience">
            <div className="bg-[#0A0E14]/90 border border-white/10 p-5 lg:p-7 rounded-[1.5rem]">
              <Eye className="w-5 h-5 text-violet-400 mb-4" />
              <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500">Vues</p>
              <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">{stats.views}</h3>
            </div>
          </PlanGuard>

          {/* Conversion (Locked) */}
          <PlanGuard plan={plan} required="pro" label="Conversion">
            <div className="bg-[#0A0E14]/90 border border-white/10 p-5 lg:p-7 rounded-[1.5rem]">
              <TrendingUp className="w-5 h-5 text-emerald-400 mb-4" />
              <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500">Conv.</p>
              <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">{stats.conversionRate}%</h3>
            </div>
          </PlanGuard>

          {/* Staff (Locked) */}
          <PlanGuard plan={plan} required="premium" label="Staff">
            <div className="bg-[#0A0E14]/90 border border-white/10 p-5 lg:p-7 rounded-[1.5rem]">
              <Users className="w-5 h-5 text-amber-400 mb-4" />
              <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500">Staff</p>
              <h3 className="text-lg lg:text-2xl font-black text-white mt-1 tracking-tighter">2/5</h3>
            </div>
          </PlanGuard>
        </div>

        {/* GRAPHIQUE SECTION */}
        <PlanGuard plan={plan} required="premium" label="Insights">
           <section className="bg-[#080A0F]/90 border border-white/10 p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem]">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400 mb-6 lg:mb-10">
                <BarChart3 size={16} className="text-violet-500" /> Performance
              </h3>
              <div className="h-32 lg:h-48 flex items-end gap-2 lg:gap-3">
                  {[40, 65, 45, 80, 75, 100, 90, 110].map((v, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-violet-600/10 to-violet-500 rounded-t-lg lg:rounded-t-xl" 
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