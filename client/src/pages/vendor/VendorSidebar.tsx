import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, 
  Settings, LogOut, MessageSquare, 
  Crown, ShieldCheck, Star, Zap
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function VendorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [storeName, setStoreName] = useState('Ma Boutique');
  const [plan, setPlan] = useState<'standard' | 'pro' | 'premium'>('standard');

  const getVendorData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_name, subscription_plan')
        .eq('id', user.id)
        .single();
      
      if (profile?.store_name) setStoreName(profile.store_name);
      if (profile?.subscription_plan) setPlan(profile.subscription_plan as any);

      const [pendingRes, stockRes] = await Promise.all([
        supabase.from('order_items').select('*', { count: 'exact', head: true }).eq('vendor_id', user.id).eq('vendor_status', 'En attente'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', user.id).lt('stock', 5)
      ]);
      setUnreadCount((pendingRes.count || 0) + (stockRes.count || 0));
    } catch (error) {
      console.error("Erreur sidebar:", error);
    }
  }, [user]);

  useEffect(() => {
    getVendorData();
    const channel = supabase.channel('sidebar_ui_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => getVendorData())
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, getVendorData]);

  const planConfig = {
    standard: { label: 'STARTER', color: 'text-slate-400', bg: 'from-slate-500 to-slate-800', icon: Package, border: 'border-white/5' },
    pro: { label: 'PRO GARAGE', color: 'text-blue-400', bg: 'from-blue-600 to-indigo-900', icon: ShieldCheck, border: 'border-blue-500/20' },
    premium: { label: 'PREMIUM', color: 'text-amber-500', bg: 'from-amber-400 to-orange-600', icon: Crown, border: 'border-amber-500/20' }
  };

  const currentPlan = planConfig[plan] || planConfig.standard;

  // LOGIQUE DE NAVIGATION DYNAMIQUE
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/vendor/dashboard' },
    { icon: ShoppingBag, label: 'Ventes', path: '/vendor/orders' },
    { icon: Package, label: 'Produits', path: '/vendor/products' },
    // AJOUT : Sponsoring/Boost accessible uniquement si plan PRO ou PREMIUM
    ...(plan !== 'standard' ? [{ 
      icon: Star, 
      label: 'Sponsoring', 
      path: '/vendor/boost',
      isNew: true 
    }] : []),
    { icon: MessageSquare, label: 'Messages', path: '/vendor/messages' },
    { icon: Settings, label: 'Réglages', path: '/vendor/settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`fixed left-0 top-0 bottom-0 w-72 bg-[#05070B] text-white hidden lg:flex flex-col z-[100] border-r ${currentPlan.border} shadow-2xl`}>
        <div className="p-8 mt-4">
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${currentPlan.bg} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <div className={`h-12 w-12 bg-gradient-to-br ${currentPlan.bg} rounded-2xl flex items-center justify-center shadow-lg shrink-0 relative z-10`}>
              <span><currentPlan.icon className="w-6 h-6 text-white" /></span>
            </div>
            <div className="min-w-0 relative z-10">
              <p className={`text-[8px] font-black ${currentPlan.color} uppercase tracking-[0.2em] mb-1`}>{currentPlan.label}</p>
              <h2 className="text-sm font-black text-white uppercase truncate tracking-tighter italic">{storeName}</h2>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group relative ${
                  isActive ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${plan === 'premium' ? 'bg-amber-500' : 'bg-blue-500'}`} />}
                <div className="flex items-center gap-4">
                  <span className={isActive ? currentPlan.color : ''}><item.icon className="w-5 h-5" /></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  {item.isNew && (
                     <span className="bg-blue-500 text-[7px] px-1.5 py-0.5 rounded-md animate-pulse">BOOST</span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* UPSELL POUR PLAN STANDARD */}
          {plan === 'standard' && (
            <div className="mx-2 mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-900/20 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Boost disponible</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed mb-3">Passez au plan PRO pour mettre vos produits en avant.</p>
              <button 
                onClick={() => navigate('/vendor/settings')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black rounded-lg transition-colors uppercase"
              >
                Découvrir le Boost
              </button>
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAVIGATION BAR --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#05070B]/95 backdrop-blur-xl border-t border-white/10 px-2 pb-safe z-[1000] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {/* On filtre pour ne garder que les 4 premiers essentiels sur mobile afin de laisser la 5ème place à la Déconnexion */}
          {menuItems.filter(i => i.label !== 'Réglages').slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={`mobile-${item.path}`}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-all relative px-3 py-1 rounded-xl ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}
              >
                {isActive && (
                  <div className={`absolute -top-1 w-1 h-1 rounded-full animate-pulse ${
                    plan === 'premium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                )}
                
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? currentPlan.color : ''}`} />
                </span>
                
                <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                  {item.label}
                </span>

                {item.label === 'Messages' && unreadCount > 0 && (
                  <span className="absolute top-1 right-2 bg-red-500 text-white text-[7px] w-3 h-3 flex items-center justify-center rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* 🔴 BOUTON DÉCONNEXION EN FIN DE BARRE MOBILE */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 transition-all px-3 py-1 rounded-xl text-slate-500 hover:text-red-400 active:text-red-500 group"
          >
            <span className="transition-transform duration-300 active:scale-110">
              <LogOut className="w-5 h-5 text-red-500/70 group-hover:text-red-400" />
            </span>
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 group-hover:opacity-100">
              Quitter
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}