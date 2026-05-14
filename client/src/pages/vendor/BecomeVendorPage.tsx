import React, { useState, useEffect } from 'react';
import { 
  Store, TrendingUp, ShieldCheck, CheckCircle2, 
  Camera, Zap, Loader2, ArrowRight, Rocket, 
  Building2, AlertCircle, Phone, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function BecomeVendorPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate(); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [shopName, setShopName] = useState('');
  const [activity, setActivity] = useState('');
  const [commune, setCommune] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 🟢 LOGIQUE : Si le vendeur n'a pas encore de compte, 
      // on sauvegarde ses données en mémoire locale et on le passe direct à l'étape 2.
      if (!user) {
        localStorage.setItem('vendor_draft_step1', JSON.stringify({ shopName, activity, commune, phone }));
        setIsSuccess(true);
        toast.success("Étape 1 validée ! Plus qu'à créer votre compte.");
        setIsSubmitting(false);
        return; 
      }

      // S'il est déjà connecté, on met à jour la base de données normalement
      let photoUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `storefronts/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        
        photoUrl = data.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          store_name: shopName,
          activity: activity, 
          commune: commune,
          phone: phone,
          avatar_url: photoUrl || user.avatar_url,
          role: 'vendor',
          status: 'pending',
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;
      
      setIsSuccess(true);
      toast.success("Étape 1 terminée avec succès !");
    } catch (error: any) {
      setErrorMsg(error.message || "Erreur technique.");
      toast.error("Échec de l'envoi.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans overflow-x-hidden">
      
      {/* HERO SECTION */}
      <div className="relative bg-slate-900 pt-12 pb-16 md:pt-32 md:pb-48 lg:pb-56 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000" 
            alt="Commerce Auto" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-slate-900 to-slate-900"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
              <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Digitalisez votre commerce auto</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-[1000] text-white tracking-tighter leading-[1.1] md:leading-none uppercase italic mb-6">
              Vendez vos pièces <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">sur tout Abidjan</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm md:text-base font-medium max-w-xl leading-relaxed opacity-80 mx-auto lg:ml-0">
              Rejoignez SpaceAuto24 et connectez votre magasin aux milliers d'acheteurs en quête de pièces détachées.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 md:-mt-24 lg:-mt-32 relative z-20 pb-20 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* COLONNE GAUCHE : ARGUMENTS */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 order-2 lg:order-1 text-slate-900">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 transition-all hover:border-blue-100">
                  <TrendingUp className="w-10 h-10 text-blue-600 mb-4" />
                  <h3 className="text-lg font-black mb-2 uppercase italic tracking-tight">Visibilité XXL</h3>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase opacity-80">Optimisez vos ventes grâce à notre moteur de recherche intelligent.</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 transition-all hover:border-emerald-100">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mb-4" />
                  <h3 className="text-lg font-black mb-2 uppercase italic tracking-tight">Confiance Totale</h3>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase opacity-80">Paiements sécurisés via Mobile Money et versement en 24h.</p>
                </div>
             </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
               <h3 className="text-base md:text-lg font-black uppercase tracking-widest mb-8 italic flex items-center gap-3 relative z-10">
                 <Zap className="w-5 h-5 text-blue-400" /> Processus d'activation
               </h3>
               <div className="space-y-8 relative z-10">
                 {[
                   { step: "01", title: "Dossier", text: "Complétez votre profil avec vos informations de boutique." },
                   { step: "02", title: "Inscription", text: "Créez votre compte vendeur sécurisé (Étape 2)." },
                   { step: "03", title: "Vendez !", text: "Votre compte Pro est activé, mettez en ligne votre premier stock !" }
                 ].map((item, idx) => (
                   <div key={idx} className="flex gap-5 items-start">
                     <span className="text-2xl font-black text-slate-700 italic mt-1">{item.step}</span>
                     <div>
                       <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1">{item.title}</h4>
                       <p className="text-[10px] md:text-[11px] font-bold uppercase text-slate-400 leading-relaxed">{item.text}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* COLONNE DROITE : LE FORMULAIRE */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 order-1 lg:order-2">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

              {isSuccess ? (
                // 🟢 ÉCRAN DE SUCCÈS - REDIRECTION VERS ÉTAPE 2
                <div className="text-center py-10 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Étape 1 Validée !</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose mb-8">
                    Votre dossier de base est enregistré. Complétez votre inscription pour finaliser l'ouverture de votre boutique.
                  </p>
                  <button 
                    onClick={() => navigate('/register-vendor')}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                  >
                    Passer à l'étape 2 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-[1000] text-slate-900 uppercase tracking-tight italic">Devenir <span className="text-blue-600">Partenaire</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Créez votre vitrine en 2 minutes</p>
                    
                    {errorMsg && (
                      <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 border border-red-100">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-black uppercase leading-relaxed">{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500 transition-all uppercase" placeholder="NOM DU MAGASIN" />
                    </div>

                    <select required value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[11px] uppercase outline-none focus:border-blue-500 transition-all text-slate-700">
                      <option value="">TYPE D'ACTIVITÉ...</option>
                      <option value="magasin">MAGASIN DE PIÈCES</option>
                      <option value="casse">CASSE AUTO</option>
                      <option value="garage">GARAGE / MÉCANIQUE</option>
                    </select>

                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={commune} onChange={(e) => setCommune(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500 transition-all uppercase" placeholder="COMMUNE (EX: MARCORY)" />
                    </div>

                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500 transition-all" placeholder="NUMÉRO WHATSAPP PRO" />
                    </div>

                    <div className="pt-2">
                      <label className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all relative overflow-hidden ${previewUrl ? 'border-blue-500' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}>
                        {previewUrl ? (
                          <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Preview" />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-400" />
                        )}
                        <span className="text-[10px] font-black uppercase text-slate-600 relative z-10">Photo de la Vitrine (Optionnel)</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-blue-600 text-white font-[1000] py-5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-6 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</>
                    ) : (
                      <>Valider et Passer à l'étape 2 <ArrowRight className="w-4 h-4" /></>
                    )}
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