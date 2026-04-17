import { 
  LayoutDashboard, 
  Users, 
  PackageSearch, 
  CreditCard, 
  Gavel 
} from 'lucide-react';

interface BottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminBottomBar({ activeTab, setActiveTab }: BottomBarProps) {
  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dash' },
    { id: 'sellers', icon: Users, label: 'Vendeurs' },
    { id: 'products', icon: PackageSearch, label: 'Articles' },
    { id: 'payments', icon: CreditCard, label: 'Comptes' },
    { id: 'disputes', icon: Gavel, label: 'Litiges' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] xl:hidden">
      {/* L'effet de flou et de bordure supérieure */}
      <div className="bg-[#0B0F1A]/90 backdrop-blur-2xl border-t border-white/5 px-2 pb-6 pt-2 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1.5 py-2 px-3 relative transition-all active:scale-90"
            >
              {/* Indicateur lumineux si actif */}
              {isActive && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full shadow-[0_4px_12px_rgba(37,99,235,0.8)] animate-in fade-in zoom-in duration-300" />
              )}
              
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
              
              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}