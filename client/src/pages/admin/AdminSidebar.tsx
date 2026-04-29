import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PackageSearch, 
  CreditCard, 
  Gavel, 
  LogOut,
  PlusCircle,
  PackagePlus,
  Settings,
  Database,
  UserCheck,
  Crown,
  Store
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

  const totalOffset = 75; // Aligné sur la hauteur du header

  // 🟢 NAVIGATION MISE À JOUR : Ajout de "Mon Inventaire" et "Abonnements"
  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'subscriptions', icon: Crown, label: 'Abonnements' }, // Pour gérer les plans Pro/Premium
    { id: 'users', icon: Users, label: 'Utilisateurs' },
    { id: 'vendors', icon: UserCheck, label: 'Approbations' },
    { id: 'my-store', icon: Store, label: 'Mon Inventaire' }, // Gestion spécifique SpaceAuto
    { id: 'products', icon: PackageSearch, label: 'Stock Global' },
    { id: 'ktype', icon: Database, label: 'Véhicules' },
    { id: 'payments', icon: CreditCard, label: 'Transactions' },
    { id: 'disputes', icon: Gavel, label: 'Litiges' },
    { id: 'settings', icon: Settings, label: 'Paramètres' }, 
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  return (
    <aside 
      className="hidden xl:flex w-64 border-r border-white/5 flex-col py-8 px-4 gap-6 bg-[#0B0F1A] sticky z-30 overflow-y-auto scrollbar-hide"
      style={{ 
        top: `${totalOffset}px`, 
        height: `calc(100vh - ${totalOffset}px)`,
      }}
    >
      {/* LABEL DE SECTION */}
      <div className="px-4">
        <p className="text-[9px] font-[1000] text-slate-600 uppercase tracking-[0.3em]">
          Menu Principal
        </p>
      </div>

      {/* BOUTONS D'ACTION RAPIDE (Style Nano-UI) */}
      <div className="px-2 space-y-2.5">
        <button 
          onClick={() => setActiveTab('create-store')}
          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all group active:scale-95 ${
            activeTab === 'create-store' 
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
              : 'bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white border border-blue-500/10'
          }`}
        >
          <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-[9px] font-black uppercase tracking-widest">Créer Boutique</span>
        </button>

        <button 
          onClick={() => setActiveTab('add-product')}
          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all group active:scale-95 border ${
            activeTab === 'add-product' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
              : 'bg-transparent border-white/5 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-500'
          }`}
        >
          <PackagePlus className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Ajouter Produit</span>
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <nav className="flex flex-col gap-1 w-full flex-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative ${
                isActive 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-blue-500 scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap">
                  {item.label}
                </span>
              </div>

              {isActive && (
                <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* PIED DE SIDEBAR */}
      <div className="pt-4 border-t border-white/5 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Déconnexion</span>
        </button>
        
        <div className="mt-4 px-4 opacity-20">
          <p className="text-[6px] font-black text-white uppercase tracking-[0.4em]">
            SpaceAuto System v3.1
          </p>
        </div>
      </div>
    </aside>
  );
}