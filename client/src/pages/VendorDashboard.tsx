import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShieldCheck, CheckCircle2, 
  Camera, Zap, Loader2, ArrowRight, Rocket, 
  Building2, AlertCircle, Phone, MapPin,
  User, Mail, Lock, Eye, EyeOff, ChevronLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function BecomeVendorPage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate(); 
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- ÉTAPE 1 : BOUTIQUE ---
  const [shopName, setShopName] = useState('');
  const [activity, setActivity] = useState('');
  const [commune, setCommune] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- ÉTAPE 2 : SÉCURITÉ ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setCurrentStep(2);
    } else {
      await submitFinalData();
    }
  };

  const submitFinalData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!user && password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let finalUserId = user?.id;
      const cleanPhone = phone.trim().replace(/\s+/g, '').replace(/[^0-9]/g, '');

      // 1. CRÉATION DU COMPTE (Si l'utilisateur n'est pas connecté)
      if (!user) {
        // Génération d'un email fantôme si le champ est vide
        const ghostEmail = email.trim() !== '' ? email.trim() : `${cleanPhone}@vendeur.spaceauto24.ci`;

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: ghostEmail,
          password: password,
          options: {
            data: { full_name: fullName, role: 'vendor', phone_auth: cleanPhone }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Échec de la création du compte.");
        
        finalUserId = authData.user.id;

        // Connexion immédiate dans le Store local
        setUser({ ...authData.user, role: 'vendor' });
      }

      // 2. GESTION DE L'IMAGE VITRINE
      let photoUrl = user?.avatar_url || null;
      if (file && finalUserId) {
        const fileExt = file.name.split('.').pop();
        const fileName = `storefronts/${finalUserId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      // 3. ENREGISTREMENT DU PROFIL (Sans updated_at pour éviter l'erreur 400)
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: finalUserId,
          store_name: shopName,
          activity: activity, 
          commune: commune,
          phone: phone,
          avatar_url: photoUrl,
          role: 'vendor',
          status: 'pending'
        });

      if (dbError) throw dbError;

      // 4. NOTIFICATION ADMIN (Optionnelle)
      try {
        await supabase.from('notifications').insert({
          title: 'Nouveau Vendeur',
          message: `${shopName} attend d'être vérifié.`,
          type: 'vendor_application',
          target_role: 'admin',
          related_id: finalUserId
        });
      } catch (e) { /* Table notifications peut-être absente */ }
      
      // 5. SUCCÈS ET REDIRECTION
      setCurrentStep(3);
      toast.success("Bienvenue Pro ! Votre boutique est créée.");

      setTimeout(() => {
        navigate('/vendor'); 
      }, 2500);

    } catch (error: any) {
      console.error("Erreur complète:", error);
      const msg = error.status === 422 
        ? "Sécurité : Utilisez un mot de passe plus complexe (min 6 car.)."
        : error.message || "Erreur technique.";
      setErrorMsg(msg);
      toast.error("Vérifiez vos informations.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <div className="relative bg-slate-900 pt-12 pb-16 md:pt-32 md:pb-48 lg:pb-56 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000" className="w-full h-full object-cover opacity-20" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-slate-900 to-slate-900"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Rocket className="w-4 h-4" /> <span>Digitalisez votre commerce auto</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-[1000] text-white tracking-tighter uppercase italic leading-none">
            Devenez un <br /><span className="text-blue-500">Vendeur d'élite</span>
          </h1>
        </div>
      </div>

      {/* --- CONTENU --- */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 lg:-mt-32 relative z-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 space-y-6">
             <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-6">
                <ShieldCheck className="w-12 h-12 text-blue-600" />
                <div>
                  <h3 className="text-lg font-black uppercase italic text-slate-900">Expertise SpaceAuto</h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase">Validation rapide de votre boutique sous 24h.</p>
                </div>
             </div>

             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <h3 className="text-base font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-400" /> Processus d'activation
                </h3>
                <div className="space-y-8">
                  {[
                    { step: "01", title: "Dossier", active: currentStep >= 1 },
                    { step: "02", title: "Sécurité", active: currentStep >= 2 },
                    { step: "03", title: "Activation", active: currentStep === 3 }
                  ].map((s, idx) => (
                    <div key={idx} className={`flex gap-5 items-center transition-opacity ${s.active ? 'opacity-100' : 'opacity-30'}`}>
                      <span className="text-2xl font-black italic text-blue-500">{s.step}</span>
                      <h4 className="text-sm font-black uppercase tracking-tight">{s.title}</h4>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

              {/* ÉTAPE 3 : SUCCÈS */}
              {currentStep === 3 && (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase italic">Accès Autorisé</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose mb-8">
                    Votre boutique est en cours de déploiement.<br />Ouverture du tableau de bord...
                  </p>
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                </div>
              )}

              {/* ÉTAPE 2 : SÉCURITÉ */}
              {currentStep === 2 && (
                <form onSubmit={submitFinalData} className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-[10px] font-black text-slate-400 flex items-center gap-1 hover:text-blue-600 mb-4 uppercase">
                    <ChevronLeft size={14} /> Retour au dossier
                  </button>
                  <h2 className="text-xl font-[1000] text-slate-900 uppercase italic">Étape 2 : <span className="text-blue-600">Sécurité</span></h2>
                  
                  {errorMsg && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black flex gap-2 border border-red-100 uppercase animate-shake"><AlertCircle size={14}/>{errorMsg}</div>}

                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:border-blue-500" placeholder="NOM DU RESPONSABLE" />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500" placeholder="EMAIL (OPTIONNEL)" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} autoComplete="new-password"  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:border-blue-500 outline-none" placeholder="CRÉER UN MOT DE PASSE" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} autoComplete="new-password" className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:border-blue-500 outline-none" placeholder="CONFIRMER MOT DE PASSE" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-[1000] py-5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Ouvrir ma boutique <ArrowRight size={16} /></>}
                  </button>
                </form>
              )}

              {/* ÉTAPE 1 : BOUTIQUE */}
              {currentStep === 1 && (
                <form onSubmit={handleNextStep} className="space-y-5 animate-in fade-in duration-500">
                  <h2 className="text-xl md:text-2xl font-[1000] text-slate-900 uppercase italic">Candidature <span className="text-blue-600">Pro</span></h2>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500 uppercase" placeholder="NOM DU COMMERCE" />
                    </div>
                    <select required value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[11px] uppercase outline-none focus:border-blue-500 text-slate-700">
                      <option value="">SPÉCIALITÉ...</option>
                      <option value="magasin">Magasin de Pièces</option>
                      <option value="casse">Casse / Occasion</option>
                      <option value="garage">Garage Spécialisé</option>
                    </select>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={commune} onChange={(e) => setCommune(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500 uppercase" placeholder="COMMUNE (EX: MARCORY)" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500" placeholder="CONTACT WHATSAPP PRO" />
                    </div>
                    <label className="w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 transition-all relative overflow-hidden bg-slate-50">
                      {previewUrl ? <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Preview" /> : <Camera className="w-8 h-8 text-slate-400" />}
                      <span className="text-[10px] font-black uppercase text-slate-600 relative z-10">Photo du Magasin</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                    </label>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white font-[1000] py-5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-3">
                    {user ? "Valider le dossier" : "Étape suivante"} <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}