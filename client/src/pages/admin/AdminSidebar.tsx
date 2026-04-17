import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PackageSearch, 
  CreditCard, 
  Gavel, 
  LogOut,
  PlusCircle // 🟢 Ajout de l'icône pour le bouton de création
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  // --- CONFIGURATION DU POSITIONNEMENT ---
  // Calage précis sous le SubHeader (70px)
  const totalOffset = 70; 

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
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <aside 
      className="hidden xl:flex w-64 border-r border-white/5 flex-col py-8 px-4 gap-8 bg-[#0B0F1A] sticky z-30"
      style={{ 
        top: `${totalOffset}px`, 
        height: `calc(100vh - ${totalOffset}px)`,
      }}
    >
      {/* LABEL DE SECTION */}
      <div className="px-4">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
          Menu Principal
        </p>
      </div>

      {/* 🟢 BOUTON D'ACTION PRINCIPAL : CRÉER BOUTIQUE */}
      <div className="px-4 -mt-2">
        <button 
          onClick={() => setActiveTab('create-store')}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all group shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95"
        >
          <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-[10px] font-[1000] uppercase tracking-[0.2em] whitespace-nowrap">
            Créer Boutique
          </span>
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <nav className="flex flex-col gap-2 w-full flex-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between px-4 py-4 rounded-2xl transition-all group relative ${
                isActive 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-[0_0_20px_rgba(37,99,235,0.05)]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'text-blue-500 scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[10px] font-[1000] uppercase tracking-[0.2em] whitespace-nowrap">
                  {item.label}
                </span>
              </div>

              {/* Petit indicateur actif à droite */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* DÉCONNEXION EN BAS */}
      <div className="pt-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Déconnexion
          </span>
        </button>
        
        <div className="mt-4 px-4">
          <p className="text-[7px] font-black text-slate-800 uppercase tracking-[0.4em]">
            SpaceAuto System v3.1
          </p>
        </div>
      </div>
    </aside>
  );
}