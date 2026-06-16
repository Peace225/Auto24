import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Loader2, X, Package, Car, Settings } from 'lucide-react';
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

const CATEGORIES = ['Pneus', 'Freinage', 'Moteur', 'Carrosserie', 'Électronique', 'Intérieur', 'Transmission', 'Suspension', 'Éclairage', 'Filtres', 'HuileMoteur', 'Outillage', 'Batteries', 'Direction / Suspension / Train'];
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

  // Alignement strict avec les colonnes de ta table "products"
  const [formData, setFormData] = useState({
    name: '', 
    brand: '', 
    category: 'Pneus', 
    price: '',
    condition: 'Neuf', 
    description: '', 
    reference: '', // Remplacé oem_reference par reference
    stock: '1', 
    model: '', // Remplacé vehicle_model par model
    year: '',
    compatibility: '', // Nouveau champ
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
          setImages(prev => prev.map(u => u === localUrl ? data.publicUrl : u));
        } catch (err: any) {
          setImages(prev => prev.filter(u => u !== localUrl));
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

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Connectez-vous");
    if (!formData.name || !formData.price) return toast.error("Nom et prix requis");

    setIsLoading(true);
    try {
      const isAutoApproved = userPlan === 'pro' || userPlan === 'premium';

      // Mapping exact avec ta base de données Supabase
      const payload = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        price: Number(formData.price),
        condition: formData.condition,
        description: formData.description,
        reference: formData.reference,
        stock: formData.stock ? parseInt(formData.stock, 10) : 1,
        model: formData.model,
        year: formData.year,
        compatibility: formData.compatibility,
        spec_fields: formData.spec_fields,
        images: images.filter(u => u.startsWith('http')),
        vendor_id: user.id,
        status: isAutoApproved ? 'approved' : 'pending',
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
    <div className="min-h-screen bg-[#020305] text-slate-200 pb-20 font-sans">
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#05070B]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/vendor/products" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><ArrowLeft size={18} /></Link>
          <h1 className="text-xl font-black italic uppercase tracking-widest text-white">Publier une <span className="text-blue-500">pièce</span></h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
          
          {/* --- COLONNE GAUCHE : PHOTOS --- */}
          <div className="lg:col-span-5">
            <section className="bg-[#0A0E14] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-6"><Upload size={16} className="text-blue-500" /> Photos ({images.length}/{currentLimits.maxImages})</h3>
              
              <div onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} accept="image/*" />
                {isUploading ? <Loader2 className="animate-spin text-blue-500" /> : <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] group-hover:text-blue-400 transition-colors">Ajouter des images</p>}
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {images.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#05070B] group">
                      <img src={url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-all shadow-lg border border-white/20">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* --- COLONNE DROITE : FORMULAIRE --- */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-[#0A0E14] border border-white/5 rounded-[2.5rem] p-8 space-y-5 shadow-2xl">
              <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-[10px] mb-2"><Package size={16} /> Informations Principales</div>
              
              <input required placeholder="Nom du produit *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
              
              <div className="grid md:grid-cols-2 gap-4">
                <input placeholder="Marque (ex: SUZUKI)" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
                <input placeholder="Référence constructeur" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm appearance-none cursor-pointer">
                  {ETATS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <div className="relative">
                  <input required type="number" placeholder="Prix (FCFA) *" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 uppercase">FCFA</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <input list="categories-list" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" placeholder="Catégorie *" />
                  <datalist id="categories-list">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <input type="number" placeholder="Quantité en stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
              </div>

              {SPECIFIC_FIELDS[formData.category] && (
                <div className="grid md:grid-cols-2 gap-4 p-5 border border-blue-500/20 rounded-2xl bg-blue-500/5 mt-4">
                  <div className="col-span-full flex items-center gap-2 text-blue-400 font-black uppercase text-[10px] mb-2"><Settings size={14} /> Spécificités techniques</div>
                  {SPECIFIC_FIELDS[formData.category].map((field) => (
                    <input key={field.key} placeholder={field.label} value={formData.spec_fields[field.key] || ''} onChange={e => setFormData(p => ({...p, spec_fields: {...p.spec_fields, [field.key]: e.target.value}}))} className="w-full px-4 py-3 bg-[#05070B] border border-white/5 rounded-xl outline-none focus:border-blue-500 font-semibold text-xs transition-colors" />
                  ))}
                </div>
              )}
            </section>

            <section className="bg-[#0A0E14] border border-white/5 rounded-[2.5rem] p-8 space-y-5 shadow-2xl">
              <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-[10px] mb-2"><Car size={16} /> Compatibilité & Détails</div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <input placeholder="Modèle compatible (ex: Dzire)" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
                <input placeholder="Année (ex: 2026)" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
              </div>
              
              <input placeholder="Compatibilité étendue (ex: Compatible sur les Suzuki S-Presso)" value={formData.compatibility} onChange={e => setFormData({...formData, compatibility: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm" />
              
              <textarea rows={4} placeholder="Description détaillée..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-[#05070B] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-colors font-semibold text-sm resize-none custom-scrollbar" />
            </section>

            <button disabled={isLoading || isUploading} className="w-full py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all disabled:opacity-50 active:scale-[0.98] shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
              {isLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> Publication en cours...</span> : 'Publier la pièce'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}