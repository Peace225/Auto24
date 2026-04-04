import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PackageSearch, 
  CreditCard, 
  Gavel, 
  LogOut 
} from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Vérifie que le chemin remonte bien vers src/lib

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navigate = useNavigate();

  // --- CONFIGURATION DU POSITIONNEMENT ---
  // navbarHeight (64px) + subHeaderHeight (60px) = 124px
  const navbarHeight = 64; 
  const subHeaderHeight = 60;
  const totalOffset = navbarHeight + subHeaderHeight;

  // --- ÉLÉMENTS DU MENU ---
  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'sellers', icon: Users, label: 'Vendeurs' },
    { id: 'products', icon: PackageSearch, label: 'Validation Articles' },
    { id: 'payments', icon: CreditCard, label: 'Transactions' },
    { id: 'disputes', icon: Gavel, label: 'Litiges' },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/login');
    } else {
      console.error("Erreur déconnexion:", error.message);
    }
  };

  return (
    <aside 
      className="w-20 lg:w-64 border-r border-slate-800 flex flex-col py-8 px-4 gap-8 bg-[#0B0F1A] sticky overflow-y-auto z-30"
      style={{ 
        top: `${totalOffset}px`, 
        height: `calc(100vh - ${totalOffset}px)`,
        transition: 'top 0.3s ease'
      }}
    >
      {/* NAVIGATION */}
      <nav className="flex flex-col gap-2 w-full flex-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                isActive 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.15em]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* DÉCONNEXION */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all mt-auto border border-transparent hover:border-red-500/10"
      >
        <LogOut className="w-5 h-5" />
        <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">
          Déconnexion
        </span>
      </button>
    </aside>
  );
}