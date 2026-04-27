import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, Loader2, ArrowRight, 
  ShieldCheck, CheckCircle2, Building2, AlertCircle,
  Eye, EyeOff 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { toast } from 'react-hot-toast';

export default function RegisterVendorPage() {
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [draftData, setDraftData] = useState<any>(null);

  useEffect(() => {
    // On récupère les données du magasin de l'étape 1
    const savedDraft = localStorage.getItem('vendor_draft_step1');
    if (savedDraft) {
      setDraftData(JSON.parse(savedDraft));
    } else {
      toast.error("Veuillez d'abord remplir les informations de votre magasin.");
      navigate('/become-vendor');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftData) return;

    if (password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      toast.error("Vérifiez vos mots de passe.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Création d'un pseudo-email si le vendeur n'en a pas fourni
      const cleanPhone = draftData.phone.replace(/[^0-9]/g, ''); 
      const finalEmail = email.trim() !== '' 
        ? email.trim() 
        : `${cleanPhone}@vendeur.spaceauto24.ci`;

      // 2. Création du compte Auth Supabase (connecte l'utilisateur automatiquement)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'vendor',
            original_phone: draftData.phone 
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Erreur lors de la création du compte.");

      // 3. Fusion des données du magasin (On omet 'email' et 'full_name' pour éviter l'erreur 400)
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          store_name: draftData.shopName,
          activity: draftData.activity, 
          commune: draftData.commune,
          phone: draftData.phone,
          role: 'vendor',
          status: 'pending', // 🟢 Statut "En attente" de validation Admin
          updated_at: new Date().toISOString()
        });

      if (dbError) {
        console.error("Erreur DB:", dbError);
        throw new Error("Erreur base de données : " + dbError.message);
      }

      // 4. Envoi de la notification temps réel à l'Admin
      try {
        await supabase.from('notifications').insert({
          title: 'Nouveau Vendeur',
          message: `${draftData.shopName} (${draftData.phone}) souhaite rejoindre la plateforme.`,
          type: 'vendor_application',
          target_role: 'admin',
          related_id: authData.user.id,
          is_read: false
        });
      } catch (notifErr) {
        console.warn("Table notifications introuvable ou erreur non bloquante :", notifErr);
      }
      
      // 5. Nettoyage et Redirection
      localStorage.removeItem('vendor_draft_step1');
      setIsSuccess(true);
      toast.success("Compte vendeur créé avec succès !");

      // 🟢 Redirection automatique vers le Dashboard Vendeur après 2.5 secondes
      setTimeout(() => {
        navigate('/vendor');
      }, 2500);

    } catch (error: any) {
      setErrorMsg(error.message || "Erreur technique.");
      toast.error("Échec de l'inscription.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 border border-slate-700">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
          Étape 2 : <span className="text-blue-600">Sécurité</span>
        </h2>
        <p className="mt-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Création de vos identifiants d'accès
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:px-10 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

          {isSuccess ? (
            // 🟢 ÉCRAN DE SUCCÈS ET REDIRECTION AUTOMATIQUE
            <div className="text-center py-10 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight italic">
                Bienvenue Pro !
              </h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-loose mb-8">
                Vos accès sont créés. <br/> 
                Ouverture de votre tableau de bord en cours...
              </p>
              
              <div className="flex flex-col items-center justify-center gap-3 mt-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600">Redirection...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Résumé de l'étape 1 */}
              {draftData && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Boutique enregistrée</p>
                    <p className="text-xs font-bold text-slate-900 uppercase truncate">{draftData.shopName} - {draftData.phone}</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-black uppercase leading-relaxed">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    autoComplete="name"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase focus:border-blue-500 outline-none transition-all" 
                    placeholder="Nom complet du gérant" 
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    autoComplete="username"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:border-blue-500 outline-none transition-all placeholder-slate-400" 
                    placeholder="Adresse Email (Optionnel)" 
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    minLength={6} 
                    autoComplete="new-password"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:border-blue-500 outline-none transition-all" 
                    placeholder="Créer un mot de passe (6 car. min)" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    minLength={6} 
                    autoComplete="new-password"
                    className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none transition-all ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`} 
                    placeholder="Confirmer le mot de passe" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-blue-600 text-white font-[1000] py-5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 hover:bg-blue-700 mt-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Création du compte...</>
                ) : (
                  <>Valider l'inscription <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  En m'inscrivant, j'accepte les <Link to="/terms" className="text-blue-600 hover:underline">conditions vendeur</Link>.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}