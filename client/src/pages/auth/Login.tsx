import { useState } from 'react';
import { Lock, ArrowRight, ShoppingBag, Store, Loader2, AlertCircle, Home, Eye, EyeOff, Phone, Mail, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { useAuthStore } from '../../store/useAuthStore'; 
import { toast } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleMethodChange = (method: 'phone' | 'email') => {
    setLoginMethod(method);
    setIdentifier('');
    setErrorMsg(null);
  };

  // 🟢 LOGIQUE DE CONNEXION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let finalLoginEmail = '';

      if (loginMethod === 'phone') {
        const cleanPhone = identifier.replace(/\D/g, ''); 
        if (cleanPhone.length < 8) throw new Error("Numéro de téléphone invalide.");
        finalLoginEmail = userRole === 'seller' ? `${cleanPhone}@vendeur.spaceauto24.ci` : `${cleanPhone}@client.spaceauto24.ci`;
      } else {
        if (!identifier.includes('@')) throw new Error("Veuillez entrer une adresse email valide.");
        finalLoginEmail = identifier.trim().toLowerCase();
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: finalLoginEmail, 
        password 
      });
      
      if (error) throw error;

      if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw new Error("Profil introuvable.");

        setUser({ ...data.user, role: profile.role });
        toast.success("Heureux de vous revoir !");

        setTimeout(() => {
          if (profile.role === 'admin') navigate('/admin/dashboard');
          else if (profile.role === 'vendor') navigate('/vendor/dashboard');
          else navigate('/dashboard');
        }, 100);
      }
    } catch (error: any) {
      setErrorMsg(error.message.includes("Invalid login credentials") 
        ? "Identifiants ou mot de passe incorrects." 
        : error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 LOGIQUE DE MOT DE PASSE OUBLIÉ
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (loginMethod === 'phone') {
        const cleanPhone = identifier.replace(/\D/g, '');
        if (cleanPhone.length < 8) throw new Error("Veuillez entrer le numéro lié à votre compte.");

        const whatsappNumber = "2250100000000"; 
        const message = `Bonjour SpaceAuto24 🚗,\nJ'ai oublié mon mot de passe.\nNuméro : *${cleanPhone}*.\nType : *${userRole === 'seller' ? 'Vendeur' : 'Client'}*`;
        
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        toast.success("Redirection vers le support...");
        setIsForgotPassword(false);
      } else {
        if (!identifier.includes('@')) throw new Error("Veuillez entrer une adresse email valide.");
        
        const { error } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
          redirectTo: `${window.location.origin}/update-password`,
        });
        
        if (error) throw error;
        toast.success("Vérifiez votre boîte mail !");
        setIsForgotPassword(false);
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      
      {/* 🏎️ CÔTÉ GAUCHE : VISUEL */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="Luxe" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900/90 to-slate-900"></div>
        </div>
        <div className="relative z-10">
          <Link to="/" className="text-4xl font-[1000] text-white tracking-tighter uppercase italic">
            SpaceAuto<span className="text-blue-500">24</span>
          </Link>
          <h1 className="text-5xl font-[1000] text-white mt-12 leading-tight uppercase italic">
            Pilotez votre <br /> succès <br /> automobile.
          </h1>
        </div>
      </div>

      {/* 🛠️ CÔTÉ DROIT : FORMULAIRE */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-slate-50 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all">
          <Home className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Accueil</span>
        </Link>

        <div className="w-full max-w-[400px]">
          
          <div className="mb-8 text-center lg:text-left">
            {isForgotPassword ? (
              <>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 mb-4">
                  <ChevronLeft size={14} /> Retour
                </button>
                <h2 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Récupération</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Réinitialisez votre accès</p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Connexion</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Bienvenue sur SpaceAuto24</p>
              </>
            )}
          </div>

          {!isForgotPassword ? (
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-6 border border-slate-200">
              <button type="button" onClick={() => setUserRole('buyer')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${userRole === 'buyer' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500'}`}>
                <ShoppingBag size={14} /> Client
              </button>
              <button type="button" onClick={() => setUserRole('seller')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${userRole === 'seller' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}>
                <Store size={14} /> Vendeur
              </button>
            </div>
          ) : null}

          <div className="flex gap-4 border-b border-slate-200 mb-6">
            <button type="button" onClick={() => handleMethodChange('phone')} className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${loginMethod === 'phone' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Par Téléphone</button>
            <button type="button" onClick={() => handleMethodChange('email')} className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${loginMethod === 'email' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Par Email</button>
          </div>

          {errorMsg ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 mb-6 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[9px] font-black text-red-600 uppercase">{errorMsg}</p>
            </div>
          ) : null}

          <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                {loginMethod === 'phone' ? 'Numéro de téléphone' : 'Adresse Email'}
              </label>
              <div className="relative group">
                {loginMethod === 'phone' ? (
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                ) : (
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                )}
                <input 
                  key={loginMethod} 
                  type={loginMethod === 'phone' ? 'tel' : 'email'} 
                  autoComplete={loginMethod === 'phone' ? "tel" : "email"}
                  required 
                  placeholder={loginMethod === 'phone' ? "07 00 00 00 00" : "votre@email.com"}
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            {!isForgotPassword ? (
              <div className="space-y-2">
                <div className="flex justify-between px-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Mot de passe</label>
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[8px] font-black text-blue-600 uppercase underline hover:text-slate-900 transition-colors">Oublié ?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    autoComplete="current-password"
                    required 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ) : null}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-white transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 mt-4 
                ${isForgotPassword 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  : (userRole === 'buyer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20')
                }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {/* Ajout d'un <span> ici pour forcer React à suivre le nœud texte proprement */}
                  <span>
                    {isForgotPassword ? (
                      loginMethod === 'phone' ? "Support WhatsApp" : "Réinitialiser"
                    ) : "Se Connecter"}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {!isForgotPassword ? (
            <div className="mt-8 text-center">
              <Link to="/become-vendor" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                Pas encore de compte ? <span className="text-blue-600 underline ml-1">Inscrivez-vous</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}