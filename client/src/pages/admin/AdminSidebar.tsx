import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, PackageSearch, CreditCard, Gavel, LogOut,
  PlusCircle, PackagePlus, Settings, Database, UserCheck,
  Store, MessageSquare, Package, Crown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: 'super_admin' | 'support' | 'tech' | 'com';
}

const menuStructure = [
  {
    title: "Gestion Plateforme",
    role: "all",
    items: [
      { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'orders', icon: Package, label: 'Commandes' },
      { id: 'messages', icon: MessageSquare, label: 'Messages' },
      { id: 'disputes', icon: Gavel, label: 'Litiges' },
    ]
  },
  {
    title: "Boutique Admin",
    role: "super_admin",
    items: [
      { id: 'create-store', icon: PlusCircle, label: 'Créer Boutique' },
      { id: 'add-product', icon: PackagePlus, label: 'Ajouter Produit' },
    ]
  },
  {
    title: "Inventaire & Stock",
    role: "tech",
    items: [
      { id: 'my-store', icon: Store, label: 'Mon Inventaire' },
      { id: 'products', icon: PackageSearch, label: 'Stock Global' },
      { id: 'ktype', icon: Database, label: 'Véhicules' },
    ]
  },
  {
    title: "Administration Utilisateurs",
    role: "com",
    items: [
      { id: 'subscriptions', icon: Crown, label: 'Abonnements' },
      { id: 'users', icon: Users, label: 'Utilisateurs' },
      { id: 'vendors', icon: UserCheck, label: 'Approbations' },
      { id: 'payments', icon: CreditCard, label: 'Transactions' },
      { id: 'settings', icon: Settings, label: 'Paramètres' },
    ]
  }
];

// Composant Navigation Mobile
const MobileNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const mobileItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dash' },
    { id: 'orders', icon: Package, label: 'Cmds' },
    { id: 'messages', icon: MessageSquare, label: 'Msgs' },
    { id: 'users', icon: Users, label: 'Users' }
  ];

  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B0F1A] border-t border-white/10 flex justify-around items-center z-[9999] px-2 shadow-2xl">
      {mobileItems.map((item) => (
        <button 
          key={item.id} 
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function AdminSidebar({ activeTab, setActiveTab, userRole = 'super_admin' }: SidebarProps) {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const filteredMenu = menuStructure.filter(section => 
    section.role === 'all' || section.role === userRole || userRole === 'super_admin'
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden xl:flex w-64 border-r border-white/5 flex-col py-8 px-4 gap-6 bg-[#0B0F1A] h-screen sticky top-0 overflow-y-auto">
        <nav className="flex-1 flex flex-col gap-6">
          {filteredMenu.map((section) => (
            <div key={section.title}>
              <p className="px-4 mb-3 text-[10px] font-[1000] text-slate-600 uppercase tracking-[0.2em]">
                {section.title}
              </p>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/5">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-red-400 w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Navigation Mobile - Toujours rendue, mais cachée sur XL */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}