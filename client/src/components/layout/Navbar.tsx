import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, User, Menu, X, ChevronDown, 
  CircleDashed, MapPin, Settings, LogOut, Trash2, ArrowRight,
  Plus, Minus 
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

// --- CONSTANTES ---
const CATALOG_CATEGORIES = ["Pièces moteur", "Filtres et huile", "Direction / Suspension / Train", "Freinage", "Distribution et Accessoires", "Embrayage et Boîte de vitesse", "Démarrage électrique", "Optiques / Phares / Ampoules", "Capteurs et Sondes", "Essuie-glaces et pièces", "Echappement", "Carrosserie / Vitres / Peinture", "Pièces Habitacle", "Joints et Étanchéité", "Chauffage et Climatisation"];
const TIRE_CATEGORIES = ["Pneus Tourisme", "Pneus 4x4 & SUV", "Pneus Utilitaires", "Jantes Alu & Tôle", "Enjoliveurs", "Accessoires Roues (Crics, etc.)"];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartItems = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart); 
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartTotal = useCartStore((state) => state.getTotalPrice());

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

  // 🔴 LOGIQUE DE DÉCONNEXION CORRIGÉE
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Nettoyage complet
      setUser(null);
      setIsMobileMenuOpen(false);
      setIsCartOpen(false);
      
      toast.success("Déconnexion réussie");
      
      // On force le retour à l'accueil
      navigate('/');
      
      // Sécurité supplémentaire : recharger la page si nécessaire pour vider les caches
      // window.location.href = '/'; 
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
      navigate('/login');
    }
  };

  const getDashboardPath = () => {
    if (user?.role === 'vendor') return '/vendor/dashboard';
    if (user?.role === 'admin') return '/admin/dashboard';
    return '/dashboard';
  };

  // 🟢 LOGIQUE PHOTO DE PROFIL DYNAMIQUE
  const userPhotoUrl = user?.user_metadata?.avatar_url || user?.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email || 'U')}&background=1e40af&color=fff&bold=true`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-[100] w-full font-sans">
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
            <Link to="/" className="font-[1000] text-xl sm:text-3xl text-blue-700 tracking-tighter uppercase italic">
              SpaceAuto<span className="text-orange-500">24</span>
            </Link>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden xl:flex space-x-6 items-center">
            {/* CATALOGUE DROPDOWN */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-black py-8 text-[11px] uppercase tracking-widest">
                Catalogue <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full mt-0 w-[600px] bg-white border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.12)] rounded-b-[2rem] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-8">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Pièces Auto
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {CATALOG_CATEGORIES.map((category, index) => (
                      <Link key={index} to={`/catalog?category=${encodeURIComponent(category)}`} className="text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 p-2 -mx-2 rounded-xl transition-all uppercase tracking-tight">
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link to="/huiles" className="text-slate-700 hover:text-blue-600 font-black text-[11px] uppercase tracking-widest">Huile Moteur</Link>
            <Link to="/outillage" className="text-slate-700 hover:text-blue-600 font-black text-[11px] uppercase tracking-widest">Outillage</Link>

            <Link to="/become-vendor" className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-full transition-all border border-blue-100 shadow-sm active:scale-95">
              VENDRE UNE PIÈCE
            </Link>
          </div>

          {/* ACTIONS DROITE */}
          <div className="flex items-center space-x-2 sm:space-x-5">
            <Link to="/garages" className="hidden lg:flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-[0.2em]">
              <MapPin className="h-4 w-4" /> Garages
            </Link>

            <div className="h-8 w-px bg-slate-100 hidden lg:block mx-2"></div>

            {/* PANIER BUTTON */}
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)} 
                className={`p-2.5 transition-all rounded-full outline-none ${isCartOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'}`}
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-[1000] text-white bg-orange-500 border-2 border-white rounded-full animate-in zoom-in">
                    {totalItems}
                  </span>
                )}
              </button>
              {/* Le code du Dropdown Panier va ici... */}
            </div>
            
            {/* 🔵 BLOC AUTHENTIFIÉ CORRIGÉ */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-slate-100 pl-4 ml-2">
                <Link 
                  to={getDashboardPath()} 
                  className="flex items-center gap-3 bg-slate-50 hover:bg-blue-50 group p-1 pr-4 rounded-full transition-all duration-300 border border-slate-100 hover:border-blue-200 shadow-sm"
                >
                  <div className="relative">
                    <img 
                      src={userPhotoUrl} 
                      alt="Profil" 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow-sm transition-transform group-hover:scale-105" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=1e40af&color=fff`;
                      }}
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700 transition-colors">
                      {user.full_name || 'Mon Compte'}
                    </span>
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest opacity-70">
                      {user.role === 'vendor' ? 'Espace Vendeur' : 'Client Privé'}
                    </span>
                  </div>
                </Link>
                
                <button 
                  type="button"
                  onClick={handleLogout} 
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="p-2.5 text-slate-700 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50 flex items-center gap-2">
                <User className="h-6 w-6" />
                <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em]">Connexion</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU CORRIGÉ */}
      <div className={`xl:hidden absolute top-full left-0 w-full bg-white border-t border-slate-100 shadow-2xl transition-all duration-300 origin-top overflow-hidden ${isMobileMenuOpen ? 'opacity-100 scale-y-100 max-h-[calc(100vh-64px)] overflow-y-auto' : 'opacity-0 scale-y-0 max-h-0'}`}>
        <div className="px-6 py-6 space-y-4">
           {/* ... Contenu mobile menu (Catalogue, Pneus, etc.) ... */}
           
          <div className="pt-6 border-t border-slate-50 space-y-3">
            {user ? (
              <>
                <Link to={getDashboardPath()} onClick={closeMobileMenu} className="flex items-center justify-center gap-3 w-full p-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-slate-200">
                  <img src={userPhotoUrl} alt="Profil" className="w-6 h-6 rounded-full object-cover border border-slate-700" />
                  Tableau de Bord
                </Link>
                <button 
                  type="button"
                  onClick={handleLogout} 
                  className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] border border-red-100 active:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMobileMenu} className="flex items-center justify-center w-full p-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg shadow-blue-200">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}