import { useState } from 'react';
import { Mail, Lock, ArrowRight, ShoppingBag, Store, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { useAuthStore } from '../../store/useAuthStore'; 

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Connexion via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. LOGIQUE DE REDIRECTION INTELLIGENTE
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw new Error("Impossible de récupérer votre profil.");

        // On met à jour le store avec l'utilisateur et son rôle réel
        setUser({ ...data.user, role: profile.role });

        // 3. Routage selon le rôle exact en base de données
        const role = profile?.role;

        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'vendor') {
          navigate('/vendor/dashboard');
        } else if (role === 'customer') {
          // CORRECTION : On redirige maintenant vers le nouveau dashboard client
          navigate('/dashboard');
        } else {
          // Cas par défaut si le rôle n'est pas reconnu
          navigate('/'); 
        }
      }
    } catch (error: any) {
      console.error(error);
      // Messages d'erreurs plus explicites pour l'utilisateur
      if (error.message.includes("Invalid login credentials")) {
        setErrorMsg("Email ou mot de passe incorrect.");
      } else {
        setErrorMsg(error.message === "Impossible de récupérer votre profil." 
          ? "Erreur de configuration du profil. Contactez l'admin." 
          : "Une erreur est survenue lors de la connexion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="font-black text-4xl text-slate-900 tracking-tighter flex justify-center items-center gap-1">
          SPACEAUTO<span className="text-blue-600">24</span>
        </Link>
        <h2 className="mt-6 text-2xl font-black text-slate-900 uppercase tracking-tight">
          {userRole === 'buyer' ? 'Espace Client' : 'Espace Vendeur'}
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* SÉLECTEUR DE RÔLE VISUEL */}
        <div className="flex bg-slate-200 p-1 rounded-2xl mb-6 shadow-inner">
          <button 
            type="button"
            onClick={() => setUserRole('buyer')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${userRole === 'buyer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Client
          </button>
          <button 
            type="button"
            onClick={() => setUserRole('seller')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${userRole === 'seller' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500'}`}
          >
            <Store className="w-4 h-4" /> Vendeur
          </button>
        </div>

        <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2.5rem] sm:px-10">
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-xs font-bold rounded-r-xl animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white font-bold text-slate-700 outline-none transition-all"
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white font-bold text-slate-700 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95 shadow-xl disabled:opacity-50 ${
                userRole === 'buyer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
              }`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Se connecter <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
             <Link
                to="/register"
                className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest underline decoration-2 underline-offset-4"
              >
                Créer un compte
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
}