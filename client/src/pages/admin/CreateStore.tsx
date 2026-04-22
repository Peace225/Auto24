import { useState } from 'react';
import { 
  Store, User, Mail, Phone, MapPin, 
  Loader2, ArrowRight, ShieldCheck, CheckCircle2, Building2, PackagePlus,
  UploadCloud, X, Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface CreateStoreProps {
  setActiveTab?: (tab: string) => void;
}

type Step = 'store-form' | 'success';

export default function CreateStore({ setActiveTab }: CreateStoreProps) {
  const [step, setStep] = useState<Step>('store-form');
  const [isLoading, setIsLoading] = useState(false);
  const [createdStoreId, setCreatedStoreId] = useState<string | null>(null);

  // --- STATE BOUTIQUE ---
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    commune: '',
    activity: 'magasin',
  });

  // --- ÉTATS IMAGE BOUTIQUE (LOGO) ---
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState<string | null>(null);

  // --- HANDLERS ---
  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStoreLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoreLogo(file);
      setStoreLogoPreview(URL.createObjectURL(file)); 
    }
  };

  const removeStoreLogo = () => {
    setStoreLogo(null);
    setStoreLogoPreview(null);
  };

  const resetFlow = () => {
    setStep('store-form');
    setFormData({ shopName: '', ownerName: '', email: '', phone: '', commune: '', activity: 'magasin' });
    removeStoreLogo();
    setCreatedStoreId(null);
  };

  // ==========================================
  // 🟢 LOGIQUE : CRÉATION BOUTIQUE (SUPER ADMIN)
  // ==========================================
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let avatarUrl = null;

      // 1. Upload du Logo de la boutique (si fourni)
      if (storeLogo) {
        const fileExt = storeLogo.name.split('.').pop();
        const fileName = `store_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images') 
          .upload(filePath, storeLogo);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      // 2. Création de la boutique avec le logo
      const newStoreId = crypto.randomUUID();

      const { error } = await supabase.from('profiles').insert({
        id: newStoreId,
        role: 'vendor',
        is_verified: true,
        is_featured: true, // 🟢 AJOUT ICI : Rend la boutique visible automatiquement dans FeaturedStores
        store_name: formData.shopName,
        full_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        commune: formData.commune,
        avatar_url: avatarUrl 
      });

      if (error) throw error;

      setCreatedStoreId(newStoreId);
      toast.success("Boutique officielle créée et mise à la Une avec succès !");
      setStep('success');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de la création de la boutique.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // VUE 2 : ÉCRAN DE SUCCÈS
  // ==========================================
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#111625] border border-emerald-500/20 rounded-[2.5rem] animate-in zoom-in duration-500 shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 text-center px-6">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-[1000] text-white uppercase italic tracking-tighter mb-4">Boutique Opérationnelle</h2>
          <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em] mb-12">La boutique a été insérée dans le catalogue et mise à la Une</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <button onClick={resetFlow} className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">
              Nouvelle Boutique
            </button>
            
            <button 
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab('products');
                } else {
                  toast("Redirection vers les produits...");
                }
              }} 
              className="w-full sm:w-auto group relative px-8 py-4 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-3">
                <PackagePlus className="w-5 h-5 group-hover:-rotate-12 transition-transform" /> 
                Aller aux produits
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 1 : FORMULAIRE DE CRÉATION BOUTIQUE
  // ==========================================
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔴 HEADER */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter">Création de Boutique</h2>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:ml-9">Insertion manuelle dans le catalogue SpaceAuto24</p>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Auto-Certification Active</span>
          </div>
        </div>
      </div>

      {/* 🔴 FORMULAIRE BOUTIQUE */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative">
        <form onSubmit={handleStoreSubmit} className="space-y-8">
          
          {/* ZONE LOGO BOUTIQUE CIRCULAIRE */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-white/5 pb-8 mb-8">
            <div className="relative group w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center hover:border-blue-500 hover:bg-white/10 transition-all overflow-hidden shrink-0 shadow-lg">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleStoreLogoChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                title="Choisir un logo" 
              />
              {storeLogoPreview ? (
                <div className="absolute inset-0 w-full h-full bg-black/40 z-10 flex items-center justify-center">
                  <img src={storeLogoPreview} alt="Logo Boutique" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
               <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Logo de l'enseigne</h3>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Image circulaire recommandée (Optionnel)</p>
               {storeLogoPreview && (
                  <button type="button" onClick={removeStoreLogo} className="mt-2 text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors">
                    Supprimer le logo
                  </button>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6">Informations Commerciales</h3>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Enseigne (Nom du magasin)</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                  <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" name="shopName" required value={formData.shopName} onChange={handleStoreChange} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="Ex: AutoParts Abidjan" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Activité</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <select name="activity" value={formData.activity} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs appearance-none">
                      <option value="magasin" className="bg-slate-900">Magasin</option>
                      <option value="casse" className="bg-slate-900">Casse Auto</option>
                      <option value="garage" className="bg-slate-900">Garage</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Localisation</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" name="commune" required value={formData.commune} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="Ex: Marcory" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6">Contact</h3>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nom du gérant</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleStoreChange} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="Nom complet" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Pro</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="email" name="email" required value={formData.email} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="contact@..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Téléphone</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="0700..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end">
            <button type="submit" disabled={isLoading} className="w-full sm:w-auto group relative overflow-hidden px-10 py-5 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] disabled:opacity-50">
              <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Créer la Boutique <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}