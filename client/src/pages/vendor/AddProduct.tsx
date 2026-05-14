import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Check, Loader2, X, Lock, Zap, Package, Car, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const PLAN_LIMITS = {
  free: { maxProducts: 10, maxImages: 3, label: 'Standard' },
  pro: { maxProducts: 100, maxImages: 8, label: 'Pro' },
  premium: { maxProducts: Infinity, maxImages: Infinity, label: 'Premium' }
};

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'premium'>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', 
    brand: '', 
    category: 'Pneus', 
    price: '', 
    condition: 'Neuf',
    description: '', 
    oem_reference: '',
    stock: '1',
    vehicle_model: '',
    year: ''
  });

  const currentLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
  const isLimitReached = productCount >= currentLimits.maxProducts;

  useEffect(() => {
    const checkLimits = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .single();

        if (profile?.subscription_plan) {
          const plan = profile.subscription_plan.toLowerCase() as keyof typeof PLAN_LIMITS;
          if (PLAN_LIMITS[plan]) setUserPlan(plan);
        }
        
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', user.id);
        
        setProductCount(count || 0);
      } catch (err) {
        console.error("Erreur limites:", err);
      } finally {
        setIsLoadingLimits(false);
      }
    };
    checkLimits();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (images.length + files.length > currentLimits.maxImages) {
      toast.error(`Limite de ${currentLimits.maxImages} images pour le plan ${currentLimits.label}`);
      return;
    }

    setIsUploading(true);
    const CLOUD_NAME = "votre_cloud_name"; 
    const UPLOAD_PRESET = "spaceauto_preset";

    try {
      const uploadPromises = files.map(async (file) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", UPLOAD_PRESET);
        const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
        return res.data.secure_url;
      });

      const newUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...newUrls]);
      toast.success("Images ajoutées");
    } catch (error) {
      toast.error("Erreur lors de l'envoi des images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) return toast.error("Limite de produits atteinte.");
    if (images.length === 0) return toast.error("Ajoutez au moins une photo");

    setIsLoading(true);
    try {
      const { error } = await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images,
        vendor_id: user?.id,
        status: 'active'
      }]);

      if (error) throw error;
      toast.success("Annonce publiée avec succès !");
      navigate('/vendor/products');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingLimits) {
    return (
      <div className="min-h-screen bg-[#020305] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020305] text-slate-200 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#05070B]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link to="/vendor/products" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Publier une pièce</h1>
              <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">{currentLimits.label}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Utilisation du quota</span>
              <span className="text-sm font-mono font-bold text-white">{productCount} / {currentLimits.maxProducts}</span>
            </div>
            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${currentLimits.maxProducts === Infinity ? 0 : Math.min((productCount / currentLimits.maxProducts) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        {isLimitReached ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lock className="text-orange-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Limite atteinte</h2>
            <p className="text-slate-400 mb-8">Vous avez atteint le maximum de produits pour votre plan actuel.</p>
            <Link to="/vendor/upgrade" className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-colors">
              <Zap size={18} fill="currentColor" /> Booster mon compte
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
            {/* Colonne Gauche : Médias */}
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Upload size={16} className="text-blue-500" /> Photos
                  </h3>
                  <span className="text-xs font-mono text-slate-500 bg-white/5 px-3 py-1 rounded-full">
                    {images.length} / {currentLimits.maxImages === Infinity ? '∞' : currentLimits.maxImages}
                  </span>
                </div>

                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative aspect-video rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4
                    ${isUploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/40 hover:bg-white/[0.02]'}`}
                >
                  <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} accept="image/*" />
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Upload size={24} className="text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">Cliquez pour ajouter</p>
                        <p className="text-xs text-slate-500 mt-1">JPG, PNG jusqu'à 5MB</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  {images.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#05070B]">
                      <img src={url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <button 
                        type="button" 
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-red-600/90 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Colonne Droite : Formulaire */}
            <div className="lg:col-span-7 space-y-8">
              {/* Détails Techniques */}
              <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="text-blue-500" size={20} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Informations Générales</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <label className="text-xs font-bold text-slate-500 ml-1">NOM DU PRODUIT</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: Turbo Garret GT1749V" className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">MARQUE</label>
                      <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Bosch, Valeo..." className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">RÉFÉRENCE OEM</label>
                      <input value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} placeholder="Numéro de série" className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">PRIX (€)</label>
                      <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">STOCK</label>
                      <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Compatibilité Véhicule */}
              <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Car className="text-blue-500" size={20} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Compatibilité</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">MODÈLE VÉHICULE</label>
                    <input value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} placeholder="ex: Golf 7, BMW E46..." className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">ANNÉE</label>
                    <input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="ex: 2015-2020" className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">DESCRIPTION</label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Détails supplémentaires sur l'état de la pièce..." className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 resize-none" />
                </div>
              </section>

              <button 
                type="submit" 
                disabled={isLoading || isLimitReached}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Check size={22} />}
                {isLoading ? "Publication en cours..." : "Publier l'annonce"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}