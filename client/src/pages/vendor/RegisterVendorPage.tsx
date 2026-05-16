import React, { useState, useEffect } from 'react';
import {
  User, Mail, Lock, Loader2, ArrowRight,
  ShieldCheck, Building2, AlertCircle,
  Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function RegisterVendorPage() {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [draftData, setDraftData] = useState<any>(null);

  useEffect(() => {
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
    if (!draftData || isSubmitting) return;

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanPhone = draftData.phone.replace(/\D/g, '');
      const finalEmail = email.trim() || `${cleanPhone}@vendeur.spaceauto24.ci`;

      // 1. AUTHENTIFICATION (Inscription ou Connexion si déjà existant)
      let userId: string;
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: finalEmail,
        password,
        options: { data: { full_name: fullName, role: 'vendor' } }
      });

      if (signUpErr) {
        if (signUpErr.status === 422 || signUpErr.message.includes("already registered")) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: finalEmail,
            password,
          });
          if (signInErr) throw new Error("Ce compte existe déjà avec un autre mot de passe.");
          userId = signInData.user!.id;
        } else {
          throw signUpErr;
        }
      } else {
        if (!signUpData.user) throw new Error("Erreur lors de la création du compte.");
        userId = signUpData.user.id;
      }

      // 2. MISE À POUR DU PROFIL
      const { error: dbErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          phone: draftData.phone,
          commune: draftData.commune,
          store_name: draftData.shopName,
          activity: draftData.activity,
          role: 'vendor',
          status: 'pending',
          subscription_plan: 'standard', 
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (dbErr) throw new Error(`Erreur Profil: ${dbErr.message}`);

      // 3. NOTIFICATION D'INSCRIPTION
      const { error: notifErr } = await supabase.from('notifications').insert({
        title: 'Nouveau Vendeur',
        message: `${draftData.shopName} (${draftData.phone}) attend validation.`,
        type: 'vendor_application',
        target_role: 'admin',
        related_id: userId,
        is_read: false,
      });

      if (notifErr) console.warn("Note: Notification admin non envoyée.");

      // 4. SUCCÈS ET REDIRECTION
      localStorage.removeItem('vendor_draft_step1');
      toast.success("Demande envoyée avec succès !");
      
      // Délai de précaution pour le cycle de vie React
      setTimeout(() => navigate('/vendor'), 500);

    } catch (err: any) {
      setErrorMsg(err.message);
      toast.error(err.message);
      console.error("Submit Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
          Étape 2 : <span className="text-blue-600">Sécurité</span>
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-[2.5rem] sm:px-10 border border-slate-200 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {draftData ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Boutique</p>
                  <p className="text-sm font-bold uppercase truncate text-slate-900">{draftData.shopName}</p>
                </div>
              </div>
            ) : null}

            {errorMsg ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex gap-3 border border-red-100 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-black uppercase leading-tight">{errorMsg}</span>
              </div>
            ) : null}

            <div className="space-y-4">
              {/* NOM COMPLET */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  autoComplete="name"
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm uppercase focus:border-blue-500 outline-none transition-all" 
                  placeholder="Nom complet du gérant" 
                />
              </div>

              {/* EMAIL */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  autoComplete="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-blue-500 outline-none" 
                  placeholder="Email (Optionnel)" 
                />
              </div>

              {/* MOT DE PASSE */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  minLength={6} 
                  autoComplete="new-password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-blue-500 outline-none" 
                  placeholder="Mot de passe" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* CONFIRMER LE MOT DE PASSE */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  autoComplete="new-password"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl font-bold text-sm outline-none transition-all ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'}`} 
                  placeholder="Confirmer mot de passe" 
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-sm shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Traitement...</span></>
              ) : (
                <><span>Valider</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}