import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, 
  Settings, LogOut, MessageSquare, Bell,
  ChevronRight, Store
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function VendorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // 1. État pour le compteur d'actions requises (Alertes)
  const [unreadCount, setUnreadCount] = useState(0);

  // 2. Logique de synthèse
  useEffect(() => {
    const getActionCount = async () => {
      if (!user) return;

      try {
        const { count: pendingOrders } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', user.id)
          .eq('vendor_status', 'En attente');

        const { count: lowStock } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', user.id)
          .lt('stock', 5);

        setUnreadCount((pendingOrders || 0) + (lowStock || 0));
      } catch (error) {
        console.error("Erreur compteur sidebar:", error);
      }
    };

    getActionCount();

    const orderSub = supabase
      .channel('sidebar_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `vendor_id=eq.${user?.id}` }, () => {
        getActionCount();
      })
      .subscribe();

    const productSub = supabase
      .channel('sidebar_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `vendor_id=eq.${user?.id}` }, () => {
        getActionCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSub);
      supabase.removeChannel(productSub);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Accueil', path: '/vendor/dashboard' },
    { icon: ShoppingBag, label: 'Ventes', path: '/vendor/orders' },
    { icon: Package, label: 'Catalogue', path: '/vendor/products' },
    { icon: MessageSquare, label: 'Messages', path: '/vendor/messages' },
    { 
      icon: Bell, 
      label: 'Alertes', 
      path: '/vendor/notifications',
      badge: unreadCount
    },
    { icon: Settings, label: 'Réglages', path: '/vendor/settings' },
  ];

  return (
    <>
      {/* ========================================= */}
      {/* 1. VERSION DESKTOP (SIDEBAR CLASSIQUE)  */}
      {/* ========================================= */}
      <aside className="fixed left-0 top-[160px] bottom-0 w-72 bg-slate-900 text-white hidden lg:flex flex-col z-[50] border-r border-slate-800 shadow-2xl">
        
        <div className="p-8 border-b border-slate-800/60 bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em] mb-1">CONSOLE</p>
              <h2 className="text-sm font-[1000] text-white uppercase tracking-tighter whitespace-nowrap">
                Espace Vendeur
              </h2>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasBadge = item.badge !== undefined && item.badge > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest group ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-500'}`} />
                    {hasBadge && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-slate-900 animate-pulse shadow-sm" />
                    )}
                  </div>
                  <span>{item.label}</span>
                </div>
                {hasBadge ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-colors shadow-sm ${isActive ? 'bg-white text-blue-600' : 'bg-orange-500 text-white'}`}>
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-4 h-4 text-white/50" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ========================================= */}
      {/* 2. VERSION MOBILE (BOTTOM NAV BAR)      */}
      {/* ========================================= */}
      {/* J'ai monté le z-index à 9999 et forcé l'affichage en flex sur les petits écrans */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] pt-2 px-1 flex items-center justify-around z-[9999] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const hasBadge = item.badge !== undefined && item.badge > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center py-2 relative"
            >
              <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                <item.icon className="w-6 h-6" /> {/* Icône un peu plus grosse pour faciliter le clic */}
                
                {/* PASTILLE NOTIFICATION MOBILE */}
                {hasBadge && (
                  <span className={`absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-black border-2 border-white shadow-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                    {item.badge > 9 ? '9+' : item.badge} {/* Sécurité si trop de notifs */}
                  </span>
                )}
              </div>
              
              {/* LABEL (Visible uniquement si actif ou avec une police très petite) */}
              <span className={`text-[8px] font-black uppercase tracking-widest transition-colors mt-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}