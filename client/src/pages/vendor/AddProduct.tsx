import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Loader2, X, Package, Car } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const PLAN_LIMITS = {
  standard: { maxProducts: 10, maxImages: 3 },
  pro: { maxProducts: 100, maxImages: 6 },
  premium: { maxProducts: Infinity, maxImages: 10 }
};

const CATEGORIES = ['Pneus', 'Freinage', 'Moteur', 'Carrosserie', 'Électronique', 'Intérieur', 'Transmission', 'Suspension', 'Éclairage', 'Filtres', 'HuileMoteur', 'Outillage', 'Batteries'];
const ETATS = ['Neuf', 'Occasion - Comme neuf', 'Occasion - Bon état', 'Occasion - À rénover'];

const SPECIFIC_FIELDS: Record<string, { label: string; key: string }[]> = {
  'Batteries': [{ label: 'Capacité (Ah)', key: 'capacite' }, { label: 'Ampérage (A)', key: 'amperage' }],
  'HuileMoteur': [{ label: 'Viscosité (ex: 5W30)', key: 'viscosite' }, { label: 'Volume (L)', key: 'volume' }],
  'Outillage': [{ label: 'Type d\'outil', key: 'type_outil' }]
};

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const [userPlan, setUserPlan] = useState<'standard' | 'pro' | 'premium'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', brand: '', category: 'Pneus', price: '',
    condition: 'Neuf', description: '', oem_reference: '',
    stock: '1', vehicle_model: '', year: '',
    spec_fields: {} as Record<string, string>
  });

  const currentLimits = PLAN_LIMITS[userPlan];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setIsLoadingLimits(false); return; }
      const { data } = await supabase.from('profiles').select('subscription_plan').eq('id', user.id).single();
      if (data?.subscription_plan) setUserPlan(data.subscription_plan.toLowerCase() as any);
      setIsLoadingLimits(false);
    };
    fetchProfile();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!user) return toast.error('Connectez-vous');
    if (images.length + files.length > currentLimits.maxImages) {
      return toast.error(`Limite ${userPlan.toUpperCase()} : ${currentLimits.maxImages} images max.`);
    }
    setIsUploading(true);
    try {
      for (const file of files) {
        const localUrl = URL.createObjectURL(file);
        setImages(prev => [...prev, localUrl]);
        try {
          const compressed = await imageCompression(file, { maxSizeMB: 0.18, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/webp' });
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
          const { error } = await supabase.storage.from('images').upload(fileName, compressed, { cacheControl: '3600', upsert: false });
          if (error) throw error;
          const { data } = supabase.storage.from('images').getPublicUrl(fileName);
          setImages(prev => prev.map(u => u === localUrl? data.publicUrl : u));
        } catch (err: any) {
          setImages(prev => prev.filter(u => u!== localUrl));
          toast.error(err.message || 'Upload échoué');
        } finally {
          URL.revokeObjectURL(localUrl);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i!== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Connectez-vous");
    if (!formData.name ||!formData.price) return toast.error("Nom et prix requis");

    setIsLoading(true);
    try {
      const isAutoApproved = userPlan === 'pro' || userPlan === 'premium';

      const payload = {
      ...formData,
        price: Number(formData.price),
        stock: formData.stock? parseInt(formData.stock, 10) : 1,
        images: images.filter(u => u.startsWith('http')),
        vendor_id: user.id,
        status: isAutoApproved? 'approved' : 'pending', // ← CORRIGÉ ICI
      };

      const { error } = await supabase.from('products').insert([payload]).select();
      if (error) throw error;

      toast.success(isAutoApproved
      ? "Produit publié et visible immédiatement!"
        : "Produit soumis pour validation!"
      );
      navigate('/vendor/products');
    } catch (err: any) {
      console.error('INSERT ERROR:', err);
      toast.error(err.message || 'Erreur insertion');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingLimits) return <div className="min-h-screen flex items-center justify-center bg-[#020305]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#020305] text-slate-200 pb-20">
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#05070B]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/vendor/products" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><ArrowLeft size={18} /></Link>
          <h1 className="text-xl font-bold text-white">Publier une pièce</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
          {/*... le reste est identique... */}
          <div className="lg:col-span-5">
            <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-sm font-bold uppercase flex items-center gap-2 mb-6"><Upload size={16} className="text-blue-500" /> Photos ({images.length}/{currentLimits.maxImages})</h3>
              <div onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition">
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} accept="image/*" />
                {isUploading? <Loader2 className="animate-spin text-blue-500" /> : <p className="text-slate-400">Ajouter des images</p>}
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {images.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#05070B]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black transition">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-5">
              <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Package size={16} /> Informations</div>
              <input required placeholder="Nom du produit *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
              <div className="grid md:grid-cols-2 gap-4">
                <input placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
                <input placeholder="Référence OEM" value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500">{ETATS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                <input required type="number" placeholder="Prix (FCFA) *" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
              </div>
              <input type="number" placeholder="Quantité en stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
              <div className="relative">
                <input list="categories-list" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" placeholder="Catégorie *" />
                <datalist id="categories-list">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              {SPECIFIC_FIELDS[formData.category] && (
                <div className="grid md:grid-cols-2 gap-4 p-4 border border-blue-500/20 rounded-2xl bg-blue-500/5">
                  {SPECIFIC_FIELDS[formData.category].map((field) => (
                    <input key={field.key} placeholder={field.label} value={formData.spec_fields[field.key] || ''} onChange={e => setFormData(p => ({...p, spec_fields: {...p.spec_fields, [field.key]: e.target.value}}))} className="w-full px-5 py-3 bg-[#05070B] border border-white/10 rounded-xl outline-none focus:border-blue-500" />
                  ))}
                </div>
              )}
            </section>

            <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-5">
              <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Car size={16} /> Compatibilité</div>
              <div className="grid md:grid-cols-2 gap-4">
                <input placeholder="Modèle véhicule" value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
                <input placeholder="Année" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
              </div>
              <textarea rows={3} placeholder="Description détaillée..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none focus:border-blue-500" />
            </section>

            <button disabled={isLoading || isUploading} className="w-full py-5 bg-blue-600 rounded-2xl font-bold hover:bg-blue-500 transition disabled:opacity-50">
              {isLoading? 'Publication...' : 'Publier l’annonce'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}