import React, { useState, useEffect } from 'react';
import { 
  Store, TrendingUp, ShieldCheck, CheckCircle2, 
  Camera, Zap, Loader2, ArrowRight, Rocket, 
  Building2, AlertCircle, Phone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function BecomeVendorPage() {
  const user = useAuthStore((state) => state.user);
  
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
    if (!user) {
      setErrorMsg("Veuillez vous connecter pour postuler.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let photoUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `storefronts/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('vendor-assets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('vendor-assets')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('vendor_profiles')
        .upsert({
          id: user.id,
          shop_name: shopName,
          activity,
          commune,
          phone,
          storefront_photo_url: photoUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;
      setIsSuccess(true);
      toast.success("Candidature transmise !");
    } catch (error: any) {
      setErrorMsg(error.message || "Erreur technique.");
      toast.error("Échec de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans overflow-x-hidden">
      
      {/* 🔴 HERO : AJUSTÉ POUR MOBILE */}
      <div className="relative bg-slate-900 pt-16 pb-32 md:pt-32 md:pb-56 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000" 
            alt="Commerce Auto" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-slate-900 to-slate-900"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[8px] md:text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
              <Rocket className="w-3.5 h-3.5" />
              <span>Digitalisez votre commerce auto</span>
            </div>
            <h1 className="text-3xl md:text-6xl font-[1000] text-white tracking-tighter leading-[1.1] md:leading-none uppercase italic mb-6">
              Vendez vos pièces <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">sur tout Abidjan</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-base font-medium max-w-xl leading-relaxed opacity-80 mx-auto md:ml-0">
              Rejoignez SpaceAuto24 et connectez votre magasin aux milliers d'acheteurs en quête de pièces détachées.
            </p>
          </div>
        </div>
      </div>

      {/* 🔴 CONTENU : -MT RÉDUIT SUR MOBILE POUR ÉVITER DE COLLER AU TITRE */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-12 md:-mt-24 relative z-20 pb-32">
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* GAUCHE : ARGUMENTS (STACKÉS SUR MOBILE) */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 group transition-all">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-900 mb-1 md:mb-2 uppercase tracking-tight italic">Visibilité Ciblée</h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed uppercase opacity-60">Optimisez vos ventes grâce à notre moteur de recherche intelligent.</p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 group transition-all">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-900 mb-1 md:mb-2 uppercase tracking-tight italic">Paiement Sécurisé</h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed uppercase opacity-60">Nous garantissons l'encaissement et le versement de vos revenus en 24h.</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
               <h3 className="text-sm md:text-lg font-black uppercase tracking-widest mb-6 md:mb-8 italic flex items-center gap-3">
                 <Zap className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Processus d'activation
               </h3>
               <div className="space-y-6 md:space-y-8">
                 {[
                   { step: "01", title: "Inscription", text: "Complétez votre profil de boutique." },
                   { step: "02", title: "Expertise", text: "Validation de votre emplacement physique." },
                   { step: "03", title: "Activation", text: "Mise en ligne de votre premier stock." }
                 ].map((item, idx) => (
                   <div key={idx} className="flex gap-4 md:gap-5 items-start">
                     <span className="text-xl md:text-2xl font-black text-slate-700 italic">{item.step}</span>
                     <div>
                       <h4 className="text-xs md:text-sm font-black uppercase tracking-tight text-white mb-0.5">{item.title}</h4>
                       <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-wide text-slate-500 leading-tight">{item.text}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* DROITE : FORMULAIRE (DÉSACTIVATION DU STICKY SUR MOBILE) */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

              {isSuccess ? (
                <div className="text-center py-8 md:py-10 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Candidature Reçue</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose mb-8">
                    Notre équipe commerciale vous contactera sur WhatsApp sous 24h.
                  </p>
                  <button onClick={() => setIsSuccess(false)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[9px] tracking-[0.2em]">Retour</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                  <div className="mb-6 md:mb-8 text-center md:text-left">
                    <h2 className="text-lg md:text-xl font-[1000] text-slate-900 uppercase tracking-tight italic">Devenir <span className="text-blue-600">Partenaire</span></h2>
                    {errorMsg && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase">{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Nom du magasin</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="text" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full pl-11 md:pl-12 pr-4 md:pr-5 py-3.5 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-[11px] md:text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all uppercase" placeholder="EX: GARAGE PRO" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Activité</label>
                      <select required value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-[10px] outline-none">
                        <option value="">TYPE...</option>
                        <option value="magasin">MAGASIN</option>
                        <option value="casse">CASSE</option>
                        <option value="garage">GARAGE</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-11 md:pl-12 py-3.5 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-[11px] md:text-xs outline-none" placeholder="07000000" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Photo Devanture</label>
                    <label className={`w-full border-2 border-dashed rounded-xl md:rounded-2xl p-5 md:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative overflow-hidden ${previewUrl ? 'border-blue-500' : 'border-slate-200 bg-slate-50'}`}>
                      {previewUrl ? (
                        <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Preview" />
                      ) : (
                        <Camera className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />
                      )}
                      <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 relative z-10">{file ? 'Changer' : 'Ajouter'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !user} 
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-xl md:rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Soumettre Dossier <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <p className="text-[7px] font-black text-slate-300 text-center uppercase tracking-[0.2em] mt-2">Données chiffrées & sécurisées par SpaceAuto24</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}