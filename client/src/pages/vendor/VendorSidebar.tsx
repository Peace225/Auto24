import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, 
  Settings, LogOut, MessageSquare, Bell,
  ChevronRight, Crown
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

  const getVendorData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_name')
        .eq('id', user.id)
        .single();
      if (profile?.store_name) setStoreName(profile.store_name);

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
    const channel = supabase.channel('sidebar_ui_updates').on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => getVendorData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, getVendorData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/vendor/dashboard' },
    { icon: ShoppingBag, label: 'Mes Ventes', path: '/vendor/orders' },
    { icon: Package, label: 'Stock & Catalogue', path: '/vendor/products' },
    { icon: MessageSquare, label: 'Messagerie', path: '/vendor/messages' },
    { icon: Bell, label: 'Notifications', path: '/vendor/notifications', badge: unreadCount },
    { icon: Settings, label: 'Configuration', path: '/vendor/settings' },
  ];

  return (
    <>
      {/* MODIFICATION : pt-[200px] 
          On augmente fortement le padding pour passer sous la barre de recherche bleue.
      */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#05070B] text-white hidden lg:flex flex-col z-[30] pt-[200px] border-r border-amber-500/10 shadow-2xl">
        
        {/* Section Identité (Logo + Nom) */}
        <div className="px-8 mb-10 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em] mb-0.5">PARTENAIRE PRO</p>
              <h2 className="text-sm font-[1000] text-white uppercase tracking-tighter truncate italic">
                {storeName}
              </h2>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasBadge = item.badge !== undefined && item.badge > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group relative ${
                  isActive ? 'bg-amber-500/10 text-white' : 'text-slate-500 hover:bg-white/5'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-amber-500 rounded-full" />}
                <div className="flex items-center gap-4 relative z-10">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-600 group-hover:text-amber-500'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-amber-200' : ''}`}>
                    {item.label}
                  </span>
                </div>
                {hasBadge && (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${isActive ? 'bg-amber-500 text-black' : 'bg-amber-900/50 text-amber-400'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-6 border-t border-white/5 bg-[#080A0F]">
          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            Déconnexion
          </button>
        </div>
      </aside>

      {/* VERSION MOBILE */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-[#0B0F19]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-2 py-2 flex items-center justify-around z-[9999] shadow-2xl">
        {menuItems.slice(0, 5).map((item) => (
          <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center justify-center py-2">
            <div className={`relative p-2.5 rounded-2xl ${location.pathname === item.path ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500'}`}>
              <item.icon className="w-5 h-5" />
            </div>
          </Link>
        ))}
      </nav>
    </>
  );
}