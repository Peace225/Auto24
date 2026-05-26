import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, X, Package, Car, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const CATEGORIES = ['Pneus', 'Freinage', 'Moteur', 'Carrosserie', 'Électronique', 'Intérieur', 'Transmission', 'Suspension', 'Éclairage', 'Filtres'];
const ETATS = ['Neuf', 'Occasion - Comme neuf', 'Occasion - Bon état', 'Occasion - À rénover'];

const PLANS = {
  standard: { name: 'Standard', max: 10, price: '0' },
  pro: { name: 'Pro', max: 100, price: '10.000' },
  premium: { name: 'Premium', max: 9999, price: '25.000' },
};

interface AddProductAdminProps {
  setActiveTab: (tab: string) => void;
  productToEdit?: any;
  onClearEdit?: () => void;
}

export default function AddProductAdmin({ setActiveTab, productToEdit, onClearEdit }: AddProductAdminProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [userPlan, setUserPlan] = useState<'standard' | 'pro' | 'premium'>('standard');

  const [formData, setFormData] = useState({
    name: '', brand: '', category: 'Pneus', price: '',
    condition: 'Neuf', description: '', oem_reference: '',
    stock: '1', vehicle_model: '', year: ''
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        brand: productToEdit.brand || '',
        category: productToEdit.category || 'Pneus',
        price: productToEdit.price?.toString() || '',
        condition: productToEdit.condition || 'Neuf',
        description: productToEdit.description || '',
        oem_reference: productToEdit.oem_reference || '',
        stock: productToEdit.stock?.toString() || '1',
        vehicle_model: productToEdit.vehicle_model || '',
        year: productToEdit.year || ''
      });
      setImages(productToEdit.images || []);
    } else {
      fetchUserPlan();
    }
  }, [productToEdit]);

  const fetchUserPlan = async () => {
    if (!user?.id) return;
    const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', user.id)
    .single();

    const plan = (profile?.subscription_plan || 'standard') as 'standard' | 'pro' | 'premium';
    setUserPlan(plan);

    const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', user.id);

    setProductCount(count || 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) return toast.error("Maximum 3 images.");

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp'
        });
        const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
        const { error } = await supabase.storage.from('images').upload(fileName, compressed);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setImages(prev => [...prev,...urls]);
    } catch (err: any) {
      toast.error("Erreur upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length < 3) return toast.error("3 photos requises.");

    setIsLoading(true);
    try {
      // VÉRIFICATION LIMITE ABONNEMENT
      if (!productToEdit) {
        const maxProducts = PLANS[userPlan].max;
        if (productCount >= maxProducts) {
          setIsLoading(false);
          toast.error(`Limite atteinte (${maxProducts} produits)`);
          setActiveTab('subscriptions');
          return;
        }
      }

      const baseData = {
        name: formData.name,
        brand: formData.brand || null,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        condition: formData.condition,
        description: formData.description || null,
        oem_reference: formData.oem_reference || null,
        vehicle_model: formData.vehicle_model || null,
        year: formData.year || null,
        images: images,
        is_official: true
      };

      if (productToEdit) {
        const { error } = await supabase.from('products').update(baseData).eq('id', productToEdit.id);
        if (error) throw error;
        toast.success("Produit mis à jour!");
        if (onClearEdit) onClearEdit();
      } else {
        const productData = {
        ...baseData,
          vendor_id: user?.id,
          status: 'published',
        };
        const { data, error } = await supabase.from('products').insert([productData]).select().single();
        if (error) throw error;
        localStorage.setItem('last_published_product', JSON.stringify(data));
        toast.success("Produit publié!");
      }

      setActiveTab('product-success');
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = PLANS[userPlan];
  const isLimitReached = productCount >= currentPlan.max;

  return (
    <div className="max-w-6xl mx-auto p-6 text-slate-200">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black uppercase tracking-widest text-white">
          {productToEdit? 'Modifier la pièce' : 'Publier une pièce'}
        </h1>
        {!productToEdit && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${isLimitReached? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
            <Package size={14} />
            {productCount} / {currentPlan.max === 9999? '∞' : currentPlan.max} • {currentPlan.name}
          </div>
        )}
      </div>

      {!productToEdit && isLimitReached && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-amber-500" size={20} />
          <div className="flex-1">
            <p className="text-amber-400 font-bold text-sm">Limite atteinte</p>
            <p className="text-xs text-slate-400">Passe en {userPlan === 'standard'? 'Pro (10.000F)' : 'Premium (25.000F)'} pour continuer</p>
          </div>
          <button onClick={() => setActiveTab('subscriptions')} className="px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-black uppercase">
            Upgrader
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <div onClick={() =>!isUploading && fileInputRef.current?.click()} className="aspect-video rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 bg-[#0A0E14]">
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} accept="image/*" />
            {isUploading? <Loader2 className="animate-spin text-blue-500" /> : <Upload className="text-slate-500" />}
            <span className="mt-2 text-xs text-slate-400">{images.length} / 3 images</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                <img src={url} alt="produit" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx!== i))} className="absolute top-1 right-1 bg-black/70 rounded-full p-1"><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <section className="bg-[#0A0E14] border border-white/10 rounded-3xl p-8 space-y-4">
            <h3 className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Package size={16} /> Informations</h3>
            <input required placeholder="Nom du produit *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none focus:border-blue-500" />
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none">{ETATS.map(e => <option key={e} value={e}>{e}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
              <input placeholder="Référence OEM" value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input required type="number" placeholder="Prix FCFA *" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
              <input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            </div>
          </section>

          <section className="bg-[#0A0E14] border border-white/10 rounded-3xl p-8 space-y-4">
            <h3 className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Car size={16} /> Compatibilité</h3>
            <input placeholder="Modèle véhicule" value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            <input placeholder="Année" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            <textarea rows={3} placeholder="Description détaillée..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
          </section>

          <button disabled={isLoading || (!productToEdit && isLimitReached)} className="w-full py-5 bg-blue-600 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading? 'Traitement...' : (productToEdit? 'Enregistrer' : 'Publier l\'annonce')}
          </button>
        </div>
      </form>
    </div>
  );
}