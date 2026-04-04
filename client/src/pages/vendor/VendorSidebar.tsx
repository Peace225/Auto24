import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, 
  Settings, LogOut, MessageSquare, Bell,
  ChevronRight, Store
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function VendorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. État pour le compteur de notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // 2. Logique de récupération du compteur (Supabase)
  useEffect(() => {
    const getUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications') // Assure-toi que ta table s'appelle bien 'notifications'
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false); // Filtre les non lues

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    getUnreadCount();

    // Optionnel: Temps réel pour mettre à jour la pastille instantanément
    const subscription = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        getUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Vue d\'ensemble', path: '/vendor/dashboard' },
    { icon: ShoppingBag, label: 'Mes Ventes', path: '/vendor/orders' },
    { icon: Package, label: 'Catalogue Produits', path: '/vendor/products' },
    { icon: MessageSquare, label: 'Messages', path: '/vendor/messages' },
    { 
      icon: Bell, 
      label: 'Notifications', 
      path: '/vendor/notifications',
      badge: unreadCount // On lie le compteur ici
    },
    { icon: Settings, label: 'Paramètres Boutique', path: '/vendor/settings' },
  ];

  return (
    <aside className="fixed left-0 top-[150px] bottom-0 w-72 bg-slate-900 text-white hidden lg:flex flex-col z-[50] border-r border-slate-800 shadow-2xl">
      
      {/* HEADER DE LA SIDEBAR */}
      <div className="p-8 border-b border-slate-800/60 bg-slate-800/30">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em] mb-1">CONSOLE</p>
            <h2 className="text-sm font-[1000] text-white uppercase tracking-tighter whitespace-nowrap">
              Espace Vendeur
            </h2>
          </div>
        </div>
      </div>

      {/* MENU DE NAVIGATION */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const hasBadge = item.badge && item.badge > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest group ${
                isActive 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <item.icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-orange-500'
                  }`} />
                  
                  {/* PASTILLE SUR L'ICÔNE SI PAS ACTIF */}
                  {hasBadge && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-slate-900 animate-pulse" />
                  )}
                </div>
                <span>{item.label}</span>
              </div>

              {/* COMPTEUR CHIFFRÉ À DROITE */}
              {hasBadge ? (
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-colors ${
                  isActive 
                  ? 'bg-white text-orange-500' 
                  : 'bg-orange-500 text-white'
                }`}>
                  {item.badge}
                </span>
              ) : (
                isActive && <ChevronRight className="w-4 h-4 text-white/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* PIED DE PAGE */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          Déconnexion
        </button>
      </div>
    </aside>
  );
}