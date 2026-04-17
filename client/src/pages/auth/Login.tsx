import { useState } from 'react';
import { Mail, Lock, ArrowRight, ShoppingBag, Store, Loader2, AlertCircle, ChevronLeft, ShieldCheck, Home, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { useAuthStore } from '../../store/useAuthStore'; 
import { toast } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👁️ État pour voir/cacher
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw new Error("Profil introuvable.");

        setUser({ ...data.user, role: profile.role });
        toast.success("Accès autorisé. Bienvenue.");

        if (profile.role === 'admin') navigate('/admin/dashboard');
        else if (profile.role === 'vendor') navigate('/vendor/dashboard');
        else navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message.includes("Invalid login credentials") 
        ? "Identifiants invalides." 
        : "Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden font-sans">
      
      {/* 🏎️ PARTIE GAUCHE : VISUELLE (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&q=80&w=2000" 
            alt="Finition Auto Luxe" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900/90 to-slate-900"></div>
        </div>
        <div className="relative z-10 max-w-lg">
          <Link to="/" className="inline-block mb-12 group">
             <span className="text-4xl font-[1000] text-white tracking-tighter uppercase italic group-hover:text-blue-400 transition-colors">
               SpaceAuto<span className="text-blue-500 font-black">24</span>
             </span>
          </Link>
          <h1 className="text-6xl font-[1000] text-white leading-none tracking-tighter uppercase italic mb-6">
            L'excellence <br /> Automobile <br /> à portée de main.
          </h1>
        </div>
      </div>

      {/* 🛠️ PARTIE DROITE : FORMULAIRE */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-slate-50 relative min-h-screen">
        
        {/* 🏠 BOUTON ACCUEIL */}
        <Link 
          to="/" 
          className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:border-blue-500 transition-all z-50"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-[1000] text-slate-900 uppercase tracking-widest">Accueil</span>
        </Link>

        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-8 md:mb-12 text-center lg:text-left px-4">
            <h2 className="text-2xl md:text-3xl font-[1000] text-slate-900 uppercase tracking-tighter italic mb-2">Se Connecter</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Veuillez entrer vos paramètres d'accès</p>
          </div>

          {/* SÉLECTEUR DE RÔLE */}
          <div className="flex bg-slate-200/50 p-1 rounded-[20px] mb-8 border border-slate-200 mx-4 lg:mx-0">
            <button onClick={() => setUserRole('buyer')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] font-[1000] text-[9px] uppercase tracking-widest transition-all duration-300 ${userRole === 'buyer' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400'}`}>
              <ShoppingBag className="w-3.5 h-3.5" /> Client
            </button>
            <button onClick={() => setUserRole('seller')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] font-[1000] text-[9px] uppercase tracking-widest transition-all duration-300 ${userRole === 'seller' ? 'bg-white text-orange-500 shadow-xl' : 'text-slate-400'}`}>
              <Store className="w-3.5 h-3.5" /> Vendeur
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 px-4 lg:px-0">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[9px] font-black text-red-600 uppercase tracking-wider">{errorMsg}</p>
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Pro</label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl"></div>
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 md:py-5 bg-white border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none shadow-sm transition-all text-xs md:text-sm"
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            {/* PASSWORD AVEC TOGGLE VOIR/CACHER */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Mot de passe</label>
                <button type="button" className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Perdu ?</button>
              </div>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl"></div>
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                
                <input 
                  type={showPassword ? "text" : "password"} // 🟢 Bascule dynamique du type
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-4 md:py-5 bg-white border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none shadow-sm transition-all text-xs md:text-sm"
                  placeholder="••••••••"
                />

                {/* 👁️ BOUTON VOIR/CACHER */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading}
              className={`w-full group relative overflow-hidden py-5 md:py-6 rounded-2xl font-[1000] text-[10px] uppercase tracking-[0.3em] text-white transition-all active:scale-[0.98] shadow-2xl disabled:opacity-50 ${userRole === 'buyer' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-slate-900 shadow-slate-900/20'}`}
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Connexion <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" /></>}
              </span>
            </button>
          </form>

          <div className="mt-10 md:mt-12 text-center">
            <Link to="/register" className="group inline-flex items-center gap-4 py-3.5 px-8 bg-white border border-slate-200 rounded-full text-[9px] font-[1000] text-slate-900 uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all duration-500">
              Rejoindre l'élite <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}