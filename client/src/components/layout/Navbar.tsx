import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, User, Menu, X, ChevronDown, 
  Wrench, CircleDashed, MapPin, Settings, LogOut, Trash2, ArrowRight 
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

// --- CONSTANTES ---
const CATALOG_CATEGORIES = ["Pièces moteur", "Filtres et huile", "Direction / Suspension / Train", "Freinage", "Distribution et Accessoires", "Embrayage et Boîte de vitesse", "Démarrage électrique", "Optiques / Phares / Ampoules", "Capteurs et Sondes", "Essuie-glaces et pièces", "Echappement", "Carrosserie / Vitres / Peinture", "Pièces Habitacle", "Joints et Étanchéité", "Chauffage et Climatisation"];
const TIRE_CATEGORIES = ["Pneus Tourisme", "Pneus 4x4 & SUV", "Pneus Utilitaires", "Jantes Alu & Tôle", "Enjoliveurs", "Accessoires Roues (Crics, etc.)"];
const ACCESSORIES_CATEGORIES = ["Entretien et Nettoyage", "Accessoires Intérieurs", "Accessoires Extérieurs", "Attelage et Portage"];

export default function Navbar() {
  const navigate = useNavigate();
  
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const cartTotal = useCartStore((state) => state.getTotalPrice());

  const { user, setUser } = useAuthStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveAccordion(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
    closeMobileMenu();
  };

  const getDashboardPath = () => {
    if (user?.role === 'vendor') return '/vendor/dashboard';
    if (user?.role === 'admin') return '/admin/dashboard';
    return '/dashboard';
  };

  const userPhotoUrl = user?.user_metadata?.avatar_url || 
    `https://ui-avatars.com/api/?name=${user?.email || 'U'}&background=2563eb&color=fff&bold=true`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-[100] w-full">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          
          {/* LOGO & MENU MOBILE BUTTON */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 -ml-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="font-black text-2xl sm:text-3xl text-blue-700 tracking-tighter">
              SpaceAuto<span className="text-orange-500">24</span>
            </Link>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden xl:flex space-x-6 items-center">
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-bold py-8 text-sm uppercase tracking-tight">
                Catalogue <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full mt-0 w-[600px] bg-white border border-slate-100 shadow-2xl rounded-b-3xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-8">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Pièces Auto
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {CATALOG_CATEGORIES.map((category, index) => (
                      <Link key={index} to={`/catalog?category=${encodeURIComponent(category)}`} className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 p-2 -mx-2 rounded-xl transition-all">
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-bold py-8 text-sm uppercase tracking-tight">
                Pneus <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full mt-0 w-[300px] bg-white border border-slate-100 shadow-2xl rounded-b-3xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CircleDashed className="w-4 h-4" /> Pneus & Jantes
                  </h3>
                  <div className="flex flex-col gap-y-2">
                    {TIRE_CATEGORIES.map((category, index) => (
                      <Link key={index} to={`/tires?category=${encodeURIComponent(category)}`} className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 p-2.5 -mx-2.5 rounded-xl transition-all">
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link to="/huiles" className="text-slate-700 hover:text-blue-600 font-bold text-sm uppercase tracking-tight">Huile Moteur</Link>
            <Link to="/outillage" className="text-slate-700 hover:text-blue-600 font-bold text-sm uppercase tracking-tight">Outillage</Link>

            <Link to="/become-vendor" className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full transition-colors border border-blue-100">
              Devenir Vendeur
            </Link>
          </div>

          {/* ACTIONS DROITE */}
          <div className="flex items-center space-x-2 sm:space-x-5">
            <Link to="/garages" className="hidden lg:flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-black text-xs uppercase tracking-widest">
              <MapPin className="h-4 w-4" /> Garages
            </Link>

            <div className="h-8 w-px bg-slate-100 hidden lg:block mx-2"></div>

            {/* PANIER DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)} 
                className={`p-2.5 transition-all rounded-full outline-none ${isCartOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'}`}
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black text-white bg-orange-500 border-2 border-white rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {isCartOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCartOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                      <h3 className="font-bold text-[11px] uppercase tracking-widest text-slate-800">Panier ({totalItems})</h3>
                      <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4"/></button>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-3 space-y-3">
                      {cartItems.length === 0 ? (
                        <div className="py-6 text-center">
                          <ShoppingCart className="w-5 h-5 text-slate-200 mx-auto mb-2" />
                          <p className="text-[11px] font-bold text-slate-400 uppercase">Vide</p>
                        </div>
                      ) : (
                        cartItems.map((item) => (
                          <div key={item.id} className="flex gap-3 items-center group">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-slate-800 truncate">{item.name}</h4>
                              <p className="text-[10px] font-black text-blue-600 mt-0.5">{item.price.toLocaleString()} FCFA</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {cartItems.length > 0 && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
                          <span className="text-sm font-black text-slate-900">{cartTotal.toLocaleString()} FCFA</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link to="/cart" onClick={() => setIsCartOpen(false)} className="text-center py-2 text-[9px] font-black uppercase text-slate-600 bg-white border border-slate-200 rounded-lg">Détails</Link>
                          <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="flex items-center justify-center gap-1.5 py-2 text-[9px] font-black uppercase text-white bg-blue-600 rounded-lg">Payer <ArrowRight className="w-3 h-3" /></Link>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* AUTHENTIFICATION */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-slate-100 pl-2">
                <Link to={getDashboardPath()} className="flex items-center gap-2.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 py-1.5 pr-4 pl-1.5 rounded-full transition-colors text-[11px] font-black uppercase tracking-widest">
                  <img src={userPhotoUrl} alt="Profil" className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm" />
                  Profil
                </Link>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="p-2.5 text-slate-700 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50">
                <User className="h-6 w-6" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`xl:hidden absolute top-full left-0 w-full bg-white border-t border-slate-100 shadow-2xl transition-all duration-300 origin-top overflow-hidden ${isMobileMenuOpen ? 'opacity-100 scale-y-100 max-h-[calc(100vh-64px)] overflow-y-auto' : 'opacity-0 scale-y-0 max-h-0'}`}>
        <div className="px-6 py-6 space-y-2">
          {/* ACCORDÉON CATALOGUE */}
          <div className="border-b border-slate-100 py-3">
            <button onClick={() => toggleAccordion('catalog')} className="flex items-center justify-between w-full text-base font-black text-slate-800 uppercase">
              <span className="flex items-center gap-3"><Settings className="w-5 h-5 text-blue-600"/> Catalogue</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${activeAccordion === 'catalog' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === 'catalog' ? 'max-h-[1000px] mt-4' : 'max-h-0'}`}>
              <div className="flex flex-col gap-2 pl-8 border-l-2 border-blue-100 ml-2">
                {CATALOG_CATEGORIES.map((cat, i) => (
                  <Link key={i} to={`/catalog?category=${cat}`} onClick={closeMobileMenu} className="text-sm font-medium text-slate-500 py-1">{cat}</Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            {user ? (
              <>
                <Link to={getDashboardPath()} onClick={closeMobileMenu} className="flex items-center justify-center gap-3 w-full p-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
                  <img src={userPhotoUrl} alt="Profil" className="w-6 h-6 rounded-full object-cover border border-slate-600" />
                  Mon Profil
                </Link>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-xs tracking-widest">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMobileMenu} className="flex items-center justify-center w-full p-4 bg-slate-50 text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}