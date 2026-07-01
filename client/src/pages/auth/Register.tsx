import { useState } from 'react';
import { Mail, Lock, User, Store, Phone, ArrowRight, ShoppingBag, Loader2, AlertCircle, MapPin, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from "../../lib/supabase"; 

const COMMUNES_ABIDJAN = ['Adjamé', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Treichville', 'Yopougon', 'Anyama', 'Songon', 'Bingerville', 'Autre'];

export default function Register() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [registerMethod, setRegisterMethod] = useState<'phone' | 'email'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    identifier: '',
    password: '',
    shopName: '',
    commune: ''
  });

  const handleMethodChange = (method: 'phone' | 'email') => {
    setRegisterMethod(method);
    setFormData({ ...formData, identifier: '' });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Validation pour les vendeurs
    if (userRole === 'seller' && (!formData.shopName || !formData.commune)) {
      setErrorMsg("Veuillez renseigner le nom de votre boutique et votre commune.");
      setIsLoading(false);
      return;
    }

    try {
      let finalAuthEmail = '';
      let savedPhone = null;
      let savedEmail = null;

      if (registerMethod === 'phone') {
        const cleanPhone = formData.identifier.replace(/\D/g, '');
        if (cleanPhone.length < 8) throw new Error("Numéro de téléphone invalide.");
        
        finalAuthEmail = userRole === 'seller'
          ? `${cleanPhone}@vendeur.spaceauto24.ci`
          : `${cleanPhone}@client.spaceauto24.ci`;
        
        savedPhone = cleanPhone;
      } else {
        if (!formData.identifier.includes('@')) throw new Error("Email invalide.");
        finalAuthEmail = formData.identifier.trim().toLowerCase();
        savedEmail = finalAuthEmail;
      }

      // 1. Inscription dans Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: finalAuthEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: userRole === 'buyer' ? 'customer' : 'vendor',
          }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("Ce contact est déjà utilisé. Veuillez vous connecter.");
        }
        throw authError;
      }

      if (data.user) {
        // 2. Insertion dans la table 'profiles'
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: savedEmail || finalAuthEmail,
              full_name: formData.fullName,
              phone: savedPhone,
              role: userRole === 'buyer' ? 'customer' : 'vendor',
              store_name: userRole === 'seller' ? formData.shopName : null,
              commune: userRole === 'seller' ? formData.commune : null,
              is_verified: userRole === 'buyer', 
            },
          ]);

        if (profileError) {
          console.error("Erreur d'insertion dans profiles:", profileError);
          throw new Error("Erreur lors de la création du profil public.");
        }

        navigate('/login', { 
          state: { message: `Compte ${userRole === 'seller' ? "vendeur" : "client"} créé avec succès ! Connectez-vous.` }
        });
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 mt-4 sm:mt-0">
        <Link to="/" className="font-[1000] text-3xl text-slate-900 tracking-tighter">
          SPACEAUTO<span className="text-blue-600">24</span>
        </Link>
        <p className="mt-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
          Rejoignez la première marketplace auto de CI
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 sm:py-10 sm:px-8 shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] sm:rounded-[3rem]">
          
          {/* SÉLECTEUR DE RÔLE */}
          <div className="flex bg-slate-100 p-1.5 sm:p-2 rounded-[1.2rem] sm:rounded-[1.5rem] mb-6 sm:mb-8 shadow-inner">
            <button 
              type="button"
              onClick={() => setUserRole('buyer')}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider sm:tracking-widest transition-all ${userRole === 'buyer' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Acheter
            </button>
            <button 
              type="button"
              onClick={() => setUserRole('seller')}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider sm:tracking-widest transition-all ${userRole === 'seller' ? 'bg-white text-orange-500 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Store className="w-4 h-4" /> Vendre
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 rounded-r-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-[11px] sm:text-xs font-bold uppercase">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            
            {/* Nom Complet */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider sm:tracking-widest ml-1">Nom Complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" required
                  className="w-full pl-12 p-3 sm:p-4 bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-base sm:text-sm text-slate-700 transition-all placeholder:text-slate-300" 
                  placeholder="Ex: Marc Yao"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            {/* Sélecteur de méthode de contact */}
            <div className="flex gap-4 border-b border-slate-100 pb-2">
              <button type="button" onClick={() => handleMethodChange('phone')} className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors ${registerMethod === 'phone' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Par Téléphone</button>
              <button type="button" onClick={() => handleMethodChange('email')} className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors ${registerMethod === 'email' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Par Email</button>
            </div>

            {/* Contact (Téléphone ou Email) */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider sm:tracking-widest ml-1">
                {registerMethod === 'phone' ? 'Numéro de Téléphone' : 'Email Professionnel'}
              </label>
              <div className="relative">
                {registerMethod === 'phone' ? <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                <input 
                  type={registerMethod === 'phone' ? 'tel' : 'email'} required
                  className="w-full pl-12 p-3 sm:p-4 bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-base sm:text-sm text-slate-700 transition-all placeholder:text-slate-300" 
                  placeholder={registerMethod === 'phone' ? "07 00 00 00 00" : "votre@email.com"}
                  value={formData.identifier}
                  onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                />
              </div>
            </div>

            {/* ZONE DYNAMIQUE VENDEUR */}
            {userRole === 'seller' && (
              <div className="p-4 sm:p-6 bg-orange-50/30 rounded-[1.5rem] sm:rounded-[2rem] border border-orange-100 space-y-4">
                <h3 className="text-orange-600 font-black text-xs uppercase tracking-wider sm:tracking-widest flex items-center gap-2">
                  <Store className="w-4 h-4" /> Détails de la Boutique
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative">
                    <input 
                      type="text" required
                      className="w-full p-3 sm:p-4 border-2 border-transparent rounded-xl sm:rounded-2xl focus:border-orange-500 outline-none bg-white font-bold text-base sm:text-sm text-slate-700 shadow-sm transition-all" 
                      placeholder="Nom de la Boutique"
                      value={formData.shopName}
                      onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <select 
                      required
                      className="w-full p-3 sm:p-4 border-2 border-transparent rounded-xl sm:rounded-2xl focus:border-orange-500 outline-none bg-white font-bold text-base sm:text-sm text-slate-700 shadow-sm transition-all cursor-pointer appearance-none"
                      value={formData.commune}
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

            {/* Mot de passe */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider sm:tracking-widest ml-1">Sécurité</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type={showPassword ? "text" : "password"} required minLength={6}
                  className="w-full pl-12 pr-12 p-3 sm:p-4 bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-base sm:text-sm text-slate-700 transition-all placeholder:text-slate-300" 
                  placeholder="Mot de passe (6 car. min)"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider sm:tracking-[0.2em] text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 ${userRole === 'buyer' ? 'bg-blue-600 shadow-blue-500/25 hover:bg-blue-700' : 'bg-orange-500 shadow-orange-500/25 hover:bg-orange-600'}`}
            >
              {isLoading ? (
                <> <Loader2 className="w-5 h-5 animate-spin" /> Traitement en cours...</>
              ) : (
                <> {userRole === 'seller' ? 'Ouvrir ma boutique' : 'Créer mon compte'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] pt-2 sm:pt-4">
              Déjà membre ? <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline ml-1">Se connecter ici</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}