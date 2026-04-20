import { Link } from 'react-router-dom';
import { 
  Package, Car, Heart, 
  Settings, LogOut, Wrench, ShieldCheck,
  HeadphonesIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CustomerSidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'orders' | 'garage' | 'appointments' | 'wishlist' | 'settings') => void;
}

export default function CustomerSidebar({ activeTab, setActiveTab }: CustomerSidebarProps) {
  const { user, setUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Déconnexion réussie");
    } catch (err) {
      toast.error("Erreur de déconnexion");
    }
  };

  const navItems = [
    { id: 'orders', name: 'Mes Commandes', icon: Package },
    { id: 'garage', name: 'Mon Garage', icon: Car },
    { id: 'appointments', name: 'Rendez-vous', icon: Wrench },
    { id: 'wishlist', name: 'Favoris', icon: Heart },
    { id: 'settings', name: 'Paramètres', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-100 h-screen sticky top-0 flex flex-col pt-8 pb-6 hidden lg:flex shrink-0 z-40">
      
      {/* LOGO */}
      <div className="px-8 mb-10">
        <Link to="/" className="text-2xl font-[1000] text-blue-700 tracking-tighter uppercase italic hover:opacity-80 transition-opacity">
          SpaceAuto<span className="text-orange-500">24</span>
        </Link>
      </div>

      {/* USER MINI-PROFILE VIP */}
      <div className="px-8 mb-10">
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="w-12 h-12 rounded-[1rem] bg-blue-600 text-white flex items-center justify-center font-black shadow-inner overflow-hidden border-2 border-white shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.charAt(0) || 'C'
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-slate-900 uppercase truncate">{user?.full_name || 'Client Privilège'}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Profil Vérifié
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 px-6 space-y-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)}
              className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group overflow-hidden
                ${isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {/* Effet de brillance subtil au hover */}
              {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
              
              <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-500 
                ${isActive ? 'text-orange-500 scale-110' : 'group-hover:scale-110 group-hover:text-blue-600'}`} 
              />
              
              <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors
                ${isActive ? 'text-white' : 'group-hover:text-slate-900'}`}>
                {item.name}
              </span>

              {/* Point indicateur orange si actif */}
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* WIDGET CONCIERGERIE */}
      <div className="px-6 mt-auto mb-6">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100/50 rounded-2xl relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <HeadphonesIcon className="w-20 h-20 text-blue-600" />
           </div>
           <div className="relative z-10">
             <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
               <HeadphonesIcon className="w-4 h-4 text-blue-600" /> Conciergerie
             </h4>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed mb-4">
               Besoin d'aide pour vos pièces ou vos rendez-vous ?
             </p>
             <button className="w-full py-3 bg-white text-blue-600 border border-blue-100 hover:border-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm">
               Contacter
             </button>
           </div>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="px-6 border-t border-slate-50 pt-6">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}