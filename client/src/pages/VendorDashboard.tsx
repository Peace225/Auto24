import React, { useState, useEffect } from 'react';
import { 
  Store, TrendingUp, ShieldCheck, CheckCircle2, 
  Camera, Zap, Loader2, ArrowRight, Rocket, 
  Building2, AlertCircle, Phone, MapPin
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
          .from('images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          store_name: shopName,
          activity: activity, 
          commune: commune,
          phone: phone,
          avatar_url: photoUrl || user.avatar_url,
          role: 'vendor',
          status: 'pending'
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setIsSuccess(true);
      toast.success("Candidature transmise !");
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
            {/* Typographie fluide : text-3xl (mobile), 5xl (tablette), 6xl (desktop) */}
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
      {/* 🟢 Sur mobile : margin-top normal (mt-8). Sur tablette/desktop : margin négative pour chevaucher le Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 md:-mt-24 lg:-mt-32 relative z-20 pb-20 md:pb-32">
        
        {/* Grille inversée sur mobile : Formulaire en haut si besoin, mais ici l'ordre Argument -> Form est gardé */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* COLONNE GAUCHE : ARGUMENTS (Prend 7 colonnes sur Desktop) */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 order-2 lg:order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {/* Carte Argument 1 */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all hover:border-blue-100">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight italic">Visibilité Ciblée</h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase opacity-80">Optimisez vos ventes grâce à notre moteur de recherche intelligent dédié aux pièces auto.</p>
              </div>

              {/* Carte Argument 2 */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all hover:border-emerald-100">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight italic">Paiement Sécurisé</h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase opacity-80">Nous garantissons l'encaissement via Mobile Money et le versement de vos revenus en 24h.</p>
              </div>
            </div>

            {/* Bloc Processus (Style Dark) */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
               <h3 className="text-base md:text-lg font-black uppercase tracking-widest mb-8 italic flex items-center gap-3 relative z-10">
                 <Zap className="w-5 h-5 text-blue-400" /> Processus d'activation
               </h3>
               
               <div className="space-y-8 relative z-10">
                 {[
                   { step: "01", title: "Inscription", text: "Complétez votre profil de boutique avec vos informations réelles." },
                   { step: "02", title: "Expertise", text: "Notre équipe valide votre emplacement physique et votre statut." },
                   { step: "03", title: "Activation", text: "Votre compte 'Pro' est activé, mettez en ligne votre premier stock !" }
                 ].map((item, idx) => (
                   <div key={idx} className="flex gap-5 items-start">
                     <span className="text-2xl font-black text-slate-700 italic mt-1">{item.step}</span>
                     <div>
                       <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1">{item.title}</h4>
                       <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-400 leading-relaxed">{item.text}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* COLONNE DROITE : LE FORMULAIRE (Prend 5 colonnes sur Desktop, reste collé en scrollant) */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 order-1 lg:order-2">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-6 sm:p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

              {isSuccess ? (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Candidature Reçue</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose mb-8">
                    Notre équipe commerciale va analyser votre profil et vous contactera sur WhatsApp sous 24h.
                  </p>
                  <button onClick={() => window.location.href = '/'} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-slate-800">
                    Retour à l'accueil
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="mb-8 text-center sm:text-left">
                    <h2 className="text-xl md:text-2xl font-[1000] text-slate-900 uppercase tracking-tight italic">Devenir <span className="text-blue-600">Partenaire</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Créez votre vitrine en 2 minutes</p>
                    
                    {errorMsg && (
                      <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 border border-red-100 text-left">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-black uppercase leading-relaxed">{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Nom du magasin / Garage</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase placeholder-slate-300" placeholder="EX: PIÈCES AUTO PLUS" />
                    </div>
                  </div>

                  {/* 🟢 Sur mobile, ces deux champs s'empilent. Sur tablette (sm) ils se mettent côte à côte */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Activité Principale</label>
                      <select required value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[11px] uppercase tracking-wider outline-none cursor-pointer focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700">
                        <option value="">SÉLECTIONNER...</option>
                        <option value="magasin">MAGASIN DE PIÈCES</option>
                        <option value="casse">CASSE AUTO</option>
                        <option value="garage">GARAGE / MÉCANIQUE</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Commune (Abidjan)</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" required value={commune} onChange={(e) => setCommune(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase placeholder-slate-300" placeholder="EX: MARCORY" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Numéro WhatsApp PRO</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-300" placeholder="07 00 00 00 00" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Photo de la Devanture</label>
                    <label className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all relative overflow-hidden group ${previewUrl ? 'border-blue-500' : 'border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300'}`}>
                      {previewUrl ? (
                        <>
                          <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-30" alt="Preview" />
                          <div className="relative z-10 bg-slate-900/80 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">Changer l'image</div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 block">Ajouter une photo</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">Format JPG ou PNG</span>
                          </div>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !user} 
                    className="w-full bg-blue-600 text-white font-[1000] py-4.5 rounded-2xl uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-3 mt-4 hover:bg-blue-700 hover:shadow-[0_15px_30px_rgba(37,99,235,0.3)]"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</>
                    ) : (
                      <>Soumettre le Dossier <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                  <p className="text-[8px] font-black text-slate-400 text-center uppercase tracking-[0.2em] mt-3">
                    Données chiffrées & sécurisées par SpaceAuto24
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}