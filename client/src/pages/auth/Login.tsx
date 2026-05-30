import { useState } from 'react';
import { Lock, ArrowRight, ShoppingBag, Store, Loader2, AlertCircle, Home, Eye, EyeOff, Phone, Mail } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let finalLoginEmail = '';

      if (loginMethod === 'phone') {
        const cleanPhone = identifier.replace(/\D/g, '');
        if (cleanPhone.length < 8) throw new Error("Numéro invalide.");
        finalLoginEmail = userRole === 'seller'
         ? `${cleanPhone}@vendeur.spaceauto24.ci`
          : `${cleanPhone}@client.spaceauto24.ci`;
      } else {
        if (!identifier.includes('@')) throw new Error("Email invalide.");
        finalLoginEmail = identifier.trim().toLowerCase();
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalLoginEmail,
        password
      });
      if (error) throw error;

      if (data?.user) {
        console.log('[LOGIN] Auth OK, id:', data.user.id);

        // ✅ maybeSingle évite le crash 500
        const { data: profile, error: profileError } = await supabase
         .from('profiles')
         .select('id, role, full_name')
         .eq('id', data.user.id)
         .maybeSingle();

        console.log('[LOGIN] Profile:', profile, 'Error:', profileError);

        if (profileError) {
          throw new Error(`Erreur base: ${profileError.message}. Désactive RLS sur profiles pour tester.`);
        }
        if (!profile) {
          throw new Error(`PROFIL INTROUVABLE pour id ${data.user.id}. Vérifie la table profiles.`);
        }

        setUser({...data.user, role: profile.role });
        toast.success(`Bienvenue ${profile.full_name || ''}!`);

        // Routage intelligent
        if (['super_admin', 'admin'].includes(profile.role)) {
          navigate('/admin/dashboard');
        } else if (profile.role === 'vendor') {
          navigate('/vendor/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('[LOGIN ERROR]', error);
      setErrorMsg(
        error.message.includes("Invalid login credentials")
         ? "Identifiants incorrects."
          : error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (loginMethod === 'phone') {
        const cleanPhone = identifier.replace(/\D/g, '');
        if (cleanPhone.length < 8) throw new Error("Numéro invalide.");
        const whatsappNumber = "2250100000000";
        const message = `Bonjour SpaceAuto24, j'ai oublié mon mot de passe. Numéro: ${cleanPhone}. Type: ${userRole}`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        toast.success("Redirection WhatsApp...");
        setIsForgotPassword(false);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        toast.success("Vérifiez votre email!");
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

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-slate-50 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
          <Home className="w-4 h-4 text-slate-400" />
          <span className="text- font-black uppercase tracking-widest text-slate-900">Accueil</span>
        </Link>

        <div className="w-full max-w-">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
              {isForgotPassword? 'Récupération' : 'Connexion'}
            </h2>
            <p className="text- font-black text-slate-400 uppercase tracking-widest mt-2">
              Bienvenue sur SpaceAuto24
            </p>
          </div>

          {!isForgotPassword && (
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-6 border border-slate-200">
              <button type="button" onClick={() => setUserRole('buyer')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text- uppercase tracking-widest transition-all ${userRole === 'buyer'? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500'}`}>
                <ShoppingBag size={14} /> Client
              </button>
              <button type="button" onClick={() => setUserRole('seller')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text- uppercase tracking-widest transition-all ${userRole === 'seller'? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}>
                <Store size={14} /> Vendeur
              </button>
            </div>
          )}

          <div className="flex gap-4 border-b border-slate-200 mb-6">
            <button onClick={() => handleMethodChange('phone')} className={`pb-3 text- font-black uppercase tracking-widest border-b-2 ${loginMethod === 'phone'? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Par Téléphone</button>
            <button onClick={() => handleMethodChange('email')} className={`pb-3 text- font-black uppercase tracking-widest border-b-2 ${loginMethod === 'email'? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Par Email</button>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text- font-black text-red-600 uppercase">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={isForgotPassword? handleResetPassword : handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text- font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                {loginMethod === 'phone'? 'Numéro' : 'Email'}
              </label>
              <div className="relative">
                {loginMethod === 'phone'? <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /> : <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                <input type={loginMethod === 'phone'? 'tel' : 'email'} required placeholder={loginMethod === 'phone'? "07 00 00 00 00" : "admin1@spaceauto24.com"} value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm" />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex justify-between px-2">
                  <label className="text- font-black text-slate-400 uppercase tracking-[0.2em]">Mot de passe</label>
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text- font-black text-blue-600 uppercase underline">Oublié?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type={showPassword? "text" : "password"} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-14 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600">
                    {showPassword? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-5 rounded-2xl font-black text- uppercase tracking-[0.3em] text-white bg-blue-600 hover:bg-blue-700 shadow-xl flex items-center justify-center gap-3 mt-4">
              {isLoading? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{isForgotPassword? "Réinitialiser" : "Se Connecter"}</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}