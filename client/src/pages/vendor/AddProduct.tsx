import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Loader2, X, Package, Car, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const PLAN_LIMITS = {
  standard: { maxProducts: 10, maxImages: 3 },
  pro: { maxProducts: 100, maxImages: 6 },
  premium: { maxProducts: Infinity, maxImages: Infinity }
};

const CATEGORIES = ['Pneus', 'Freinage', 'Moteur', 'Carrosserie', 'Électronique', 'Intérieur', 'Transmission', 'Suspension', 'Éclairage', 'Filtres'];
const ETATS = ['Neuf', 'Occasion - Comme neuf', 'Occasion - Bon état', 'Occasion - À rénover'];

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [userPlan, setUserPlan] = useState<'standard' | 'pro' | 'premium'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', brand: '', category: 'Pneus', price: '',
    condition: 'Neuf', description: '', oem_reference: '',
    stock: '1', vehicle_model: '', year: ''
  });

  const currentLimits = PLAN_LIMITS[userPlan];

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
          setUserPlan(PLAN_LIMITS[plan]? plan : 'free');
        }

        const { count } = await supabase
         .from('products')
         .select('*', { count: 'exact', head: true })
         .eq('vendor_id', user.id)
         .in('status', ['pending', 'approved']);

        setProductCount(count || 0);
      } finally {
        setIsLoadingLimits(false);
      }
    };
    checkLimits();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length ||!user) return;

    if (images.length + files.length > currentLimits.maxImages) {
      return toast.error(`Plan ${userPlan.toUpperCase()} : max ${currentLimits.maxImages} images`);
    }

    setIsUploading(true);
    e.target.value = '';

    try {
      await Promise.all(files.map(async (file) => {
        const localUrl = URL.createObjectURL(file);
        setImages(prev => [...prev, localUrl]);

        const compressed = await imageCompression(file, {
          maxSizeMB: 0.18,
          maxWidthOrHeight: 1280,
          initialQuality: 0.75,
          useWebWorker: true,
          fileType: 'image/webp'
        });

        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, compressed, {
          cacheControl: '31536000',
          upsert: false,
          contentType: 'image/webp'
        });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        setImages(prev => prev.map(u => u === localUrl? data.publicUrl : u));
        URL.revokeObjectURL(localUrl);
      }));
      toast.success("Images prêtes");
    } catch (err: any) {
      toast.error(err.message);
      setImages(prev => prev.filter(u => u.startsWith('http')));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Connectez-vous");

    if (productCount >= currentLimits.maxProducts) {
      return toast.error(`Limite atteinte (${currentLimits.maxProducts} produits max en ${userPlan.toUpperCase()})`);
    }

    const finalImages = images.filter(u => u.startsWith('http'));
    if (!finalImages.length) return toast.error("Ajoutez au moins 1 photo");

    setIsLoading(true);
    try {
      const { error } = await supabase.from('products').insert([{
       ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 1,
        images: finalImages,
        image_url: finalImages[0],
        vendor_id: user.id,
        seller_id: user.id,
        status: 'pending', // ← part en validation admin
        admin_validated: false,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast.success("Produit envoyé pour validation!");
      navigate('/vendor/products');
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingLimits) return <div className="min-h-screen flex items-center justify-center bg-[#020305]"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;

  const remaining = currentLimits.maxProducts - productCount;

  return (
    <div className="min-h-screen bg-[#020305] text-slate-200 pb-20">
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#05070B]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/vendor/products" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><ArrowLeft size={18} /></Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Publier une pièce</h1>
            <p className="text-xs text-slate-500">Plan {userPlan.toUpperCase()} • {remaining > 999? '∞' : remaining} places restantes</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-sm font-bold uppercase flex items-center gap-2 mb-6">
                <Upload size={16} className="text-blue-500" />
                Photos ({images.length}/{currentLimits.maxImages})
              </h3>
              <div onClick={() =>!isUploading && fileInputRef.current?.click()} className="aspect-video rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-blue-500/40 transition">
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} accept="image/*" />
                {isUploading? <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> : <div className="text-center"><Upload className="mx-auto mb-2 text-slate-500" /><p className="text-sm text-slate-400">Cliquez pour ajouter</p><p className="text-xs text-slate-600 mt-1">WebP auto • max 180KB</p></div>}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <button type="button" onClick={() => setImages(images.filter((_, idx) => idx!== i))} className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><X size={14} /></button>
                    {!url.startsWith('http') && <div className="absolute inset-0 bg-black/60 grid place-items-center"><Loader2 size={16} className="animate-spin text-white" /></div>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-5">
              <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Package size={16} /> Informations</div>
              <input required placeholder="Nom du produit *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none appearance-none focus:border-blue-500/50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50">
                  {ETATS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50" />
                <input placeholder="Référence OEM" value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input required type="number" min="0" placeholder="Prix FCFA *" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50" />
                <input type="number" min="0" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50" />
              </div>
            </section>

            <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-5">
              <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Car size={16} /> Compatibilité</div>
              <div className="grid md:grid-cols-2 gap-4">
                <input placeholder="Modèle véhicule (ex: Toyota Corolla)" value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50" />
                <input placeholder="Année (ex: 2018-2022)" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500/50" />
              </div>
              <textarea rows={3} placeholder="Description, état détaillé, défauts..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none resize-none focus:border-blue-500/50" />
            </section>

            <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-4 text-xs text-amber-200">
              Votre produit sera envoyé en validation à l'admin avant publication publique.
            </div>

            <button disabled={isLoading || isUploading || remaining <= 0} className="w-full py-5 bg-blue-600 rounded-2xl font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {isLoading? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={18}/> Publication...</span> : 'Publier l’annonce'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}