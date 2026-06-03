import { useState } from 'react';
import { 
  Store, User, Mail, Phone, MapPin, 
  Loader2, ArrowRight, ShieldCheck, CheckCircle2, 
  Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface CreateStoreProps {
  setActiveTab?: (tab: string) => void;
}

type Step = 'store-form' | 'success';

export default function CreateStore({ setActiveTab }: CreateStoreProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('store-form');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    shopName: '', ownerName: '', email: '', phone: '', commune: '', activity: 'magasin',
  });

  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState<string | null>(null);

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

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return toast.error("Vous devez être connecté.");
    setIsLoading(true);

    try {
      let avatarUrl = null;
      if (storeLogo) {
        const fileExt = storeLogo.name.split('.').pop();
        const fileName = `store_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(`avatars/${fileName}`, storeLogo);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(`avatars/${fileName}`);
        avatarUrl = data.publicUrl;
      }

      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        role: 'vendor',
        is_verified: true,
        is_featured: true,
        is_admin_created: true,
        created_by: user.id,
        store_name: formData.shopName,
        full_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        commune: formData.commune,
        avatar_url: avatarUrl 
      });

      if (error) throw error;
      toast.success("Boutique créée avec succès !");
      setStep('success');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 py-16 md:py-24 bg-[#111625] border border-emerald-500/20 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl text-center mx-4 md:mx-0">
        <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-emerald-500 mb-4 md:mb-6" />
        <h2 className="text-2xl md:text-3xl font-[1000] text-white uppercase italic mb-6 md:mb-8">Boutique Opérationnelle</h2>
        <button onClick={() => setActiveTab && setActiveTab('products')} className="w-full md:w-auto px-8 py-4 rounded-xl md:rounded-2xl bg-blue-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest active:scale-95 transition-transform">
          Aller aux produits
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700">
      {/* 🔴 HEADER DESIGN OPTIMISÉ MOBILE */}
      <div className="bg-[#111625] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-500 shrink-0" />
            <h2 className="text-xl md:text-2xl font-[1000] text-white uppercase italic tracking-tighter">Création de Boutique</h2>
          </div>
          <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-7 md:ml-9">Insertion manuelle dans le catalogue SpaceAuto24</p>
        </div>
        <div className="px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 w-full md:w-auto justify-center md:justify-start mt-2 md:mt-0">
           <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest">Auto-Certification Active</span>
        </div>
      </div>

      <div className="bg-[#111625] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-2xl">
        <form onSubmit={handleStoreSubmit} className="space-y-6 md:space-y-8">
          {/* Logo - Mode Flex-col sur mobile pour un meilleur rendu */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6 border-b border-white/5 pb-6 md:pb-8">
            <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center hover:border-blue-500 overflow-hidden transition-colors">
              <input type="file" accept="image/*" onChange={handleStoreLogoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {storeLogoPreview ? <img src={storeLogoPreview} className="w-full h-full object-cover" /> : <Camera className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />}
            </div>
            <div className="mt-2 sm:mt-4">
               <h3 className="text-xs md:text-sm font-black text-white uppercase mb-1">Logo de l'enseigne</h3>
               <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Image circulaire recommandée</p>
            </div>
          </div>

          {/* Champs : Espacements réduits sur mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-4 md:space-y-6">
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="text" name="shopName" required value={formData.shopName} onChange={handleStoreChange} className="w-full pl-11 p-3.5 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Enseigne (Nom du magasin)" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="text" name="commune" required value={formData.commune} onChange={handleStoreChange} className="w-full pl-11 p-3.5 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Localisation (Ex: Cocody)" />
              </div>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleStoreChange} className="w-full pl-11 p-3.5 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Nom du gérant" />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="email" name="email" required value={formData.email} onChange={handleStoreChange} className="w-full pl-11 p-3.5 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Email Pro" />
              </div>
              {/* 🟢 Ajout du champ Téléphone qui manquait */}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="tel" name="phone" required value={formData.phone} onChange={handleStoreChange} className="w-full pl-11 p-3.5 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Téléphone (+225...)" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full mt-4 py-4 md:py-5 rounded-xl md:rounded-2xl bg-blue-600 text-white font-[1000] text-[9px] md:text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-blue-500 disabled:opacity-50 active:scale-95 transition-all">
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Créer la Boutique <ArrowRight size={14} className="md:w-4 md:h-4"/></>}
          </button>
        </form>
      </div>
    </div>
  );
}