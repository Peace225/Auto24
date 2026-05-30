import { useState } from 'react';
import { 
  Store, User, Mail, Phone, MapPin, 
  Loader2, ArrowRight, ShieldCheck, CheckCircle2, Building2, PackagePlus,
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

  const resetFlow = () => {
    setStep('store-form');
    setFormData({ shopName: '', ownerName: '', email: '', phone: '', commune: '', activity: 'magasin' });
    removeStoreLogo();
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
      <div className="flex flex-col items-center justify-center py-24 bg-[#111625] border border-emerald-500/20 rounded-[2.5rem] shadow-2xl">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
        <h2 className="text-3xl font-[1000] text-white uppercase italic mb-8">Boutique Opérationnelle</h2>
        <button onClick={() => setActiveTab && setActiveTab('products')} className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase">Aller aux produits</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🔴 HEADER DESIGN EXACT */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter">Création de Boutique</h2>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-9">Insertion manuelle dans le catalogue SpaceAuto24</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Auto-Certification Active</span>
        </div>
      </div>

      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
        <form onSubmit={handleStoreSubmit} className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-6 border-b border-white/5 pb-8 mb-8">
            <div className="relative w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center hover:border-blue-500 overflow-hidden">
              <input type="file" accept="image/*" onChange={handleStoreLogoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {storeLogoPreview ? <img src={storeLogoPreview} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
               <h3 className="text-sm font-black text-white uppercase">Logo de l'enseigne</h3>
               <p className="text-[10px] font-bold text-slate-500 uppercase">Image circulaire recommandée</p>
            </div>
          </div>

          {/* Champs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="relative"><Store className="absolute left-4 top-4 w-4 h-4 text-slate-500"/><input type="text" name="shopName" required value={formData.shopName} onChange={handleStoreChange} className="w-full pl-12 p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" placeholder="Enseigne (Nom du magasin)" /></div>
              <div className="relative"><MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-500"/><input type="text" name="commune" required value={formData.commune} onChange={handleStoreChange} className="w-full pl-12 p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" placeholder="Localisation" /></div>
            </div>
            <div className="space-y-6">
              <div className="relative"><User className="absolute left-4 top-4 w-4 h-4 text-slate-500"/><input type="text" name="ownerName" required value={formData.ownerName} onChange={handleStoreChange} className="w-full pl-12 p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" placeholder="Nom du gérant" /></div>
              <div className="relative"><Mail className="absolute left-4 top-4 w-4 h-4 text-slate-500"/><input type="email" name="email" required value={formData.email} onChange={handleStoreChange} className="w-full pl-12 p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" placeholder="Email Pro" /></div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-5 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-blue-500">
            {isLoading ? <Loader2 className="animate-spin" /> : <>Créer la Boutique <ArrowRight size={16}/></>}
          </button>
        </form>
      </div>
    </div>
  );
}