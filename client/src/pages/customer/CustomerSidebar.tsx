import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Car, Heart, 
  Settings, LogOut, Wrench, ShieldCheck,
  HeadphonesIcon, ShoppingCart
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CustomerSidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'orders' | 'garage' | 'appointments' | 'wishlist' | 'settings' | 'shop') => void;
}

export default function CustomerSidebar({ activeTab, setActiveTab }: CustomerSidebarProps) {
  const { user, setUser } = useAuthStore();
  const [favoritesCount, setFavoritesCount] = useState(0);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Déconnexion réussie");
    } catch (err) {
      toast.error("Erreur de déconnexion");
    }
  };

  // 🟢 LOGIQUE : Récupérer le nombre exact de favoris de l'utilisateur
  useEffect(() => {
    if (!user) return;

    const fetchFavoritesCount = async () => {
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setFavoritesCount(count || 0);
    };

    fetchFavoritesCount();

    // S'abonner aux changements pour mettre à jour le badge en temps réel
    const channel = supabase.channel('favorites-sidebar')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${user.id}` }, 
        () => { fetchFavoritesCount(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const navItems = [
    { id: 'shop', name: 'Boutique Pièces', shortName: 'Boutique', icon: ShoppingCart },
    { id: 'orders', name: 'Mes Commandes', shortName: 'Commandes', icon: Package },
    { id: 'garage', name: 'Mon Garage', shortName: 'Garage', icon: Car },
    { id: 'appointments', name: 'Mes Rendez-vous', shortName: 'RDV', icon: Wrench },
    { id: 'wishlist', name: 'Favoris', shortName: 'Favoris', icon: Heart },
    { id: 'settings', name: 'Paramètres', shortName: 'Profil', icon: Settings },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* 1. SIDEBAR DESKTOP (Cachée sur mobile via "hidden lg:flex") */}
      {/* ========================================================= */}
      <aside className="w-72 bg-white border-r border-slate-100 h-screen sticky top-0 hidden lg:flex flex-col pt-8 pb-6 shrink-0 z-40">
        
        {/* LOGO */}
        <div className="px-8 mb-10">
          <Link to="/" className="text-2xl font-[1000] text-slate-900 tracking-tighter uppercase italic hover:opacity-80 transition-opacity">
            SpaceAuto<span className="text-blue-600">24</span>
          </Link>
          <div className="h-1 w-12 bg-blue-600 mt-1 rounded-full"></div>
        </div>

        {/* USER PROFILE */}
        <div className="px-8 mb-10">
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-slate-100 transition-colors cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg overflow-hidden border-2 border-white shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-400 italic">{(user?.full_name || 'C').charAt(0)}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-[1000] text-slate-900 uppercase italic truncate tracking-tight">
                {user?.full_name || 'Client Privilège'}
              </p>
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" /> Membre Vérifié
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS DESKTOP */}
        <nav className="flex-1 px-6 space-y-2">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 ml-4">Menu Principal</p>
          
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)}
                className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group overflow-hidden
                  ${isActive 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <div className="relative">
                  <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-500 
                    ${isActive ? 'text-blue-500 scale-110' : 'group-hover:scale-110 group-hover:text-blue-600'}`} 
                  />
                  {/* 🟢 BADGE COMPTEUR FAVORIS (DESKTOP) */}
                  {item.id === 'wishlist' && favoritesCount > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-black border-2 z-20 ${isActive ? 'bg-red-500 border-slate-900 text-white' : 'bg-red-500 border-white text-white'}`}>
                      {favoritesCount}
                    </span>
                  )}
                </div>
                
                <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors
                  ${isActive ? 'text-white' : 'group-hover:text-slate-900'}`}>
                  {item.name}
                </span>

                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* WIDGET CONCIERGERIE */}
        <div className="px-6 mt-auto mb-6">
          <div className="p-6 bg-slate-900 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-blue-900/20">
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
               <HeadphonesIcon className="w-24 h-24 text-white" />
             </div>
             
             <div className="relative z-10 text-white">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Support 24/7</h4>
               </div>
               <p className="text-[11px] font-[1000] italic uppercase leading-none mb-4">
                 Besoin d'une <span className="text-blue-400">expertise ?</span>
               </p>
               <button className="w-full py-3 bg-blue-600 hover:bg-white hover:text-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                 Contacter un expert
               </button>
             </div>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="px-6 border-t border-slate-50 pt-6">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Déconnexion
          </button>
        </div>
      </aside>


      {/* ============================================================== */}
      {/* 2. BOTTOM BAR MOBILE (Cachée sur desktop via "lg:hidden")      */}
      {/* ============================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50 px-2 py-3 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center justify-center w-full gap-1.5 relative p-1 transition-all"
            >
              {/* Point indicateur discret au-dessus de l'icône */}
              {isActive && (
                <span className="absolute -top-3 w-1 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              )}

              <div className="relative">
                <item.icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive ? 'text-blue-600 scale-110 -translate-y-1' : 'text-slate-400'
                }`} />
                {/* 🟢 BADGE COMPTEUR FAVORIS (MOBILE) */}
                {item.id === 'wishlist' && favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 flex items-center justify-center bg-red-500 text-white rounded-full text-[7px] font-black border border-white z-20">
                    {favoritesCount}
                  </span>
                )}
              </div>

              <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${
                isActive ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {item.shortName}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}