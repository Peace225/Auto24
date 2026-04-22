import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, User, Menu, X, ChevronDown, 
  MapPin, LogOut, BadgeCheck, Crown, Store 
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore'; 
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const CATALOG_CATEGORIES = [
  "Pièces moteur", "Filtres et huile", "Direction / Suspension / Train", 
  "Freinage", "Distribution et Accessoires", "Embrayage et Boîte de vitesse", 
  "Démarrage électrique", "Optiques / Phares / Ampoules", "Capteurs et Sondes", 
  "Essuie-glaces et pièces", "Echappement", "Carrosserie / Vitres / Peinture", 
  "Pièces Habitacle", "Joints et Étanchéité", "Chauffage et Climatisation"
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore(); 
  
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveAccordion(null); 
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
      toast.success("Déconnexion réussie");
    } catch (err) {
      setUser(null);
      navigate('/login');
    }
  };

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'vendor') return '/vendor/dashboard';
    return '/dashboard'; 
  };

  const userPhotoUrl = user?.avatar_url || user?.user_metadata?.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Utilisateur')}&background=${user?.role === 'admin' ? 'f59e0b' : user?.role === 'vendor' ? '3b82f6' : '05070A'}&color=fff&bold=true`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-[9999] w-full font-sans border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          
          <div className="flex-shrink-0 flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors z-50">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="font-[1000] text-xl sm:text-3xl text-blue-700 tracking-tighter uppercase italic">
              SpaceAuto<span className="text-orange-500">24</span>
            </Link>
          </div>

          <div className="hidden xl:flex space-x-8 items-center">
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-black py-8 text-[11px] uppercase tracking-widest transition-all">
                Catalogue <ChevronDown className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute left-0 top-full mt-0 w-[500px] bg-white border border-slate-100 shadow-2xl rounded-b-[2rem] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-8">
                <div className="grid grid-cols-2 gap-3">
                  {CATALOG_CATEGORIES.slice(0, 10).map((cat, i) => (
                    <Link key={i} to={`/catalog?category=${encodeURIComponent(cat)}`} className="text-[10px] font-bold text-slate-500 hover:text-blue-600 uppercase tracking-tight p-2 hover:bg-blue-50 rounded-lg transition-colors">
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/huiles" className="text-slate-700 hover:text-blue-600 font-black text-[11px] uppercase tracking-widest">Huile Moteur</Link>
            <Link to="/outillage" className="text-slate-700 hover:text-blue-600 font-black text-[11px] uppercase tracking-widest">Outillage</Link>
            {!user && (
              <Link to="/become-vendor" className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 font-[1000] text-[9px] uppercase tracking-widest px-6 py-3 rounded-full transition-all border border-blue-100">
                Vendre une pièce
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5">
            <Link to="/garages" className="hidden lg:flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-[0.2em]">
              <MapPin className="h-4 w-4" /> Garages
            </Link>

            <div className="relative">
              <button onClick={() => setIsCartOpen(!isCartOpen)} className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all relative">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 sm:h-5 sm:w-5 bg-orange-500 text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
            
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 sm:border-l sm:border-slate-100 sm:pl-4 sm:ml-2">
                
                <Link 
                  to={getDashboardPath()} 
                  className={`flex items-center gap-3 p-1 sm:pr-4 rounded-full transition-all duration-500 group
                    ${user.role === 'admin' 
                      ? 'sm:bg-[#0B0F19] sm:border border-amber-500/30 hover:border-amber-400 sm:shadow-lg' 
                      : user.role === 'vendor' 
                        ? 'sm:bg-[#05070A] sm:border border-amber-500/20 hover:border-amber-500 sm:shadow-lg' 
                        : 'sm:bg-slate-50 sm:border border-slate-100 hover:border-blue-200'}`}
                >
                  <div className="relative">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 border overflow-hidden bg-white
                      ${user.role === 'admin' ? 'border-amber-400' : user.role === 'vendor' ? 'border-blue-500' : 'border-slate-300'}`}>
                      <img src={userPhotoUrl} alt="Profile" className="w-full h-full rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
                    </div>
                    {user.role === 'vendor' && user.vendor_status === 'approved' && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-0.5 shadow-md">
                        <BadgeCheck className="w-3 h-3" />
                      </div>
                    )}
                    {user.role === 'admin' && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-full p-0.5 shadow-md">
                        <Crown className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className={`text-[9px] font-black uppercase tracking-tight transition-colors 
                      ${user.role === 'admin' ? 'text-white group-hover:text-amber-400' 
                      : user.role === 'vendor' ? 'text-white group-hover:text-amber-500' 
                      : 'text-slate-900 group-hover:text-blue-700'}`}>
                      {user.full_name?.split(' ')[0] || 'Utilisateur'}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1
                      ${user.role === 'admin' ? 'text-amber-500/70' 
                      : user.role === 'vendor' ? 'text-amber-500/70' 
                      : 'text-blue-600/70'}`}>
                      {user.role === 'admin' ? <><Crown className="w-2 h-2" /> Admin</> 
                      : user.role === 'vendor' ? <><Store className="w-2 h-2" /> Pro</> 
                      : 'Client'}
                    </span>
                  </div>
                </Link>
                
                <button 
                  onClick={handleLogout} 
                  className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 p-2 sm:px-5 sm:py-2.5 sm:bg-slate-900 text-slate-700 hover:text-orange-50 sm:text-white rounded-full sm:hover:bg-orange-500 transition-all sm:shadow-md">
                <User className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Connexion</span>
              </Link>
            )} 
          </div>
        </div>
      </div>

      <div className={`xl:hidden fixed inset-0 top-16 bg-white transition-all duration-300 overflow-y-auto pb-24 ${isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'}`}>
        <div className="p-6 space-y-2">
          
          <div className="border-b border-slate-100 pb-2">
            <button 
              onClick={() => setActiveAccordion(activeAccordion === 'catalog' ? null : 'catalog')}
              className="w-full py-4 flex justify-between items-center text-slate-900 font-black uppercase text-sm tracking-widest"
            >
              Catalogue <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeAccordion === 'catalog' ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'catalog' ? 'max-h-[800px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
              <div className="pl-4 border-l-2 border-slate-100 space-y-4 pt-2">
                {CATALOG_CATEGORIES.map((cat, i) => (
                  <Link 
                    key={i} 
                    to={`/catalog?category=${encodeURIComponent(cat)}`} 
                    onClick={closeMobileMenu} 
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight hover:text-blue-600"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link to="/huiles" onClick={closeMobileMenu} className="block py-4 border-b border-slate-100 text-slate-900 font-black uppercase text-sm tracking-widest">Huile Moteur</Link>
          <Link to="/outillage" onClick={closeMobileMenu} className="block py-4 border-b border-slate-100 text-slate-900 font-black uppercase text-sm tracking-widest">Outillage</Link>
          <Link to="/garages" onClick={closeMobileMenu} className="block py-4 border-b border-slate-100 text-slate-900 font-black uppercase text-sm tracking-widest">Garages Partenaires</Link>
          
          <div className="pt-8 space-y-4">
            {user ? (
              <>
                <Link to={getDashboardPath()} onClick={closeMobileMenu} className={`flex items-center justify-center gap-3 w-full p-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-lg
                  ${user.role === 'admin' ? 'bg-[#0B0F19] text-amber-500 shadow-amber-500/20' 
                  : user.role === 'vendor' ? 'bg-[#05070A] text-amber-500 shadow-amber-500/20' 
                  : 'bg-blue-600 text-white shadow-blue-200'}`}>
                  Mon Tableau de Bord
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobileMenu} className="flex items-center justify-center w-full p-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-lg shadow-blue-200">
                  Se connecter
                </Link>
                <Link to="/become-vendor" onClick={closeMobileMenu} className="flex items-center justify-center w-full p-5 border-2 border-blue-100 text-blue-600 bg-blue-50 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em]">
                  Devenir Vendeur
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}