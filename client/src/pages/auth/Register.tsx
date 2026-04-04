import { useState } from 'react';
import { Mail, Lock, User, Store, Phone, ArrowRight, ShoppingBag, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from "../../lib/supabase"; 

const COMMUNES_ABIDJAN = ['Adjamé', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Treichville', 'Yopougon', 'Anyama', 'Songon', 'Bingerville', 'Autre'];

export default function Register() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    shopName: '',
    commune: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Validation supplémentaire pour les vendeurs
    if (userRole === 'seller' && (!formData.shopName || !formData.commune)) {
      setErrorMsg("Veuillez renseigner le nom de votre boutique et votre commune.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Inscription dans Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: userRole === 'buyer' ? 'customer' : 'vendor',
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Insertion dans la table 'profiles'
        // On s'assure que toutes les colonnes (phone, commune) sont bien remplies
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: formData.email,
              full_name: formData.fullName,
              phone: formData.phone, // AJOUTÉ
              role: userRole === 'buyer' ? 'customer' : 'vendor',
              store_name: userRole === 'seller' ? formData.shopName : null,
              commune: userRole === 'seller' ? formData.commune : null, // AJOUTÉ
              is_verified: userRole === 'buyer', // Les vendeurs attendent souvent une validation manuelle ou par document
            },
          ]);

        if (profileError) throw profileError;

        alert("Compte " + (userRole === 'seller' ? "vendeur" : "client") + " créé avec succès !");
        navigate('/login');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="font-[1000] text-3xl text-slate-900 tracking-tighter">
          SPACEAUTO<span className="text-blue-600">24</span>
        </Link>
        <p className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Rejoignez la première marketplace auto de CI
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[3rem]">
          
          {/* SÉLECTEUR DE RÔLE AMÉLIORÉ */}
          <div className="flex bg-slate-100 p-2 rounded-[1.5rem] mb-10 shadow-inner">
            <button 
              type="button"
              onClick={() => setUserRole('buyer')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${userRole === 'buyer' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Je veux Acheter
            </button>
            <button 
              type="button"
              onClick={() => setUserRole('seller')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${userRole === 'seller' ? 'bg-white text-orange-500 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Store className="w-4 h-4" /> Je veux Vendre
            </button>
          </div>

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 rounded-r-xl animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-[11px] font-bold uppercase">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identité Réelle</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" required
                    className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300" 
                    placeholder="Ex: Marc Yao"
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="tel" required
                    className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300" 
                    placeholder="07..."
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Professionnel</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="email" required
                  className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300" 
                  placeholder="votre@email.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* ZONE DYNAMIQUE VENDEUR */}
            {userRole === 'seller' && (
              <div className="p-6 bg-orange-50/30 rounded-[2rem] border border-orange-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Store className="w-4 h-4" /> Détails de la Boutique
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type="text" required
                      className="w-full p-4 border-2 border-transparent rounded-2xl focus:border-orange-500 outline-none bg-white font-bold text-slate-700 shadow-sm transition-all" 
                      placeholder="Nom du Garage / Boutique"
                      onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <select 
                      required
                      className="w-full p-4 border-2 border-transparent rounded-2xl focus:border-orange-500 outline-none bg-white font-bold text-slate-700 shadow-sm transition-all cursor-pointer appearance-none"
                      onChange={(e) => setFormData({...formData, commune: e.target.value})}
                    >
                      <option value="">Commune...</option>
                      {COMMUNES_ABIDJAN.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sécurité</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="password" required minLength={6}
                  className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300" 
                  placeholder="Mot de passe (6 car. min)"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 ${userRole === 'buyer' ? 'bg-blue-600 shadow-blue-500/25 hover:bg-blue-700' : 'bg-orange-500 shadow-orange-500/25 hover:bg-orange-600'}`}
            >
              {isLoading ? (
                <> <Loader2 className="w-5 h-5 animate-spin" /> Traitement en cours...</>
              ) : (
                <> {userRole === 'seller' ? 'Ouvrir ma boutique' : 'Créer mon compte'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">
              Déjà membre ? <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline">Se connecter ici</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}