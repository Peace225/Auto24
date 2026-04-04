// src/pages/VendorDashboard.tsx
import React, { useState } from 'react';
import { 
  Store, TrendingUp, Truck, ShieldCheck, 
  CheckCircle2, MapPin, Phone, ChevronRight, 
  Wrench, ChevronDown, Camera, Star, Zap, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase'; // 🟢 Ton client
import { useAuthStore } from '../store/useAuthStore'; // 🟢 Pour l'ID du vendeur

export default function VendorDashboard() {
  const user = useAuthStore((state) => state.user);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // États du formulaire
  const [shopName, setShopName] = useState('');
  const [activity, setActivity] = useState('');
  const [commune, setCommune] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Vous devez être connecté pour postuler.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let photoUrl = null;

      // 🟢 1. Upload de la photo si présente
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('vendor-assets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('vendor-assets')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      // 🟢 2. Insertion dans vendor_profiles
      const { error: insertError } = await supabase
        .from('vendor_profiles')
        .insert({
          id: user.id,
          shop_name: shopName,
          activity,
          commune,
          phone,
          storefront_photo_url: photoUrl
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
    } catch (error: any) {
      setErrorMsg(error.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* HERO SECTION (Design original conservé) */}
      <div className="relative bg-slate-900 pt-20 pb-40 border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=1920&q=80" 
            alt="Entrepôt" 
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <Store className="w-4 h-4" />
              <span>Portail Vendeurs Abidjan</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
              Développez votre commerce sur tout <span className="text-blue-400">Abidjan</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 -mt-24 relative z-20">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* GAUCHE : AVANTAGES (Design original) */}
          <div className="flex-1 space-y-6 w-full">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Plus de Visibilité</h3>
                <p className="text-sm text-slate-500 font-medium">Vendez à des clients situés partout à Abidjan sans effort.</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl group">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Paiement Garanti</h3>
                <p className="text-sm text-slate-500 font-medium">Vos ventes sont sécurisées et reversées en 24h.</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Comment ça marche ?</h3>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 font-black flex items-center justify-center flex-shrink-0">1</div>
                  <p className="text-xs text-slate-400"><strong className="text-white">Inscription :</strong> Remplissez le formulaire ci-contre.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 font-black flex items-center justify-center flex-shrink-0">2</div>
                  <p className="text-xs text-slate-400"><strong className="text-white">Validation :</strong> Notre équipe certifie votre magasin sous 24h.</p>
                </div>
              </div>
            </div>
          </div>

          {/* DROITE : FORMULAIRE CONNECTÉ */}
          <div className="w-full lg:w-[500px] flex-shrink-0">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400"></div>

              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase">Dossier reçu !</h3>
                  <p className="text-slate-500 text-sm font-medium mb-8">Un agent va vous contacter sur WhatsApp pour valider votre boutique.</p>
                  <button onClick={() => setIsSuccess(false)} className="w-full bg-slate-100 py-4 rounded-xl font-black text-xs uppercase">Fermer</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Devenir Vendeur</h2>
                    {errorMsg && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase">⚠️ {errorMsg}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nom du magasin</label>
                    <input type="text" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" placeholder="Ex: Garage Marcory Pro" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activité</label>
                      <select required value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs">
                        <option value="">Type...</option>
                        <option value="magasin">Magasin</option>
                        <option value="casse">Casse Auto</option>
                        <option value="garage">Garage</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Commune</label>
                      <select required value={commune} onChange={(e) => setCommune(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs">
                        <option value="">Où ?</option>
                        <option value="Marcory">Marcory</option>
                        <option value="Cocody">Cocody</option>
                        <option value="Yopougon">Yopougon</option>
                        <option value="Adjame">Adjamé</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Téléphone WhatsApp</label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" placeholder="07 00 00 00 00" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Photo Devanture</label>
                    <label className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-50 transition-all">
                      <Camera className="w-6 h-6 text-slate-400" />
                      <span className="text-[10px] font-black uppercase text-slate-400">{file ? file.name : 'Ajouter une photo'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-blue-600 text-white font-black py-5 rounded-xl uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Soumettre ma candidature"}
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