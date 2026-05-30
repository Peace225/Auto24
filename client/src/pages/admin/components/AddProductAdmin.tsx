import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, X, Package, Car } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const CATEGORIES = ['Pneus', 'Freinage', 'Moteur', 'Carrosserie', 'Électronique', 'Intérieur', 'Transmission', 'Suspension', 'Éclairage', 'Filtres', 'HuileMoteur', 'Outillage', 'Batteries'];
const ETATS = ['Neuf', 'Occasion - Comme neuf', 'Occasion - Bon état', 'Occasion - À rénover'];

const SPECIFIC_FIELDS: Record<string, { label: string; key: string }[]> = {
  'Batteries': [{ label: 'Capacité (Ah)', key: 'capacite' }, { label: 'Ampérage (A)', key: 'amperage' }],
  'HuileMoteur': [{ label: 'Viscosité (ex: 5W30)', key: 'viscosite' }, { label: 'Volume (L)', key: 'volume' }],
  'Outillage': [{ label: 'Type d\'outil', key: 'type_outil' }]
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
  const [shops, setShops] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '', brand: '', category: 'Pneus', price: '',
    condition: 'Neuf', description: '', oem_reference: '',
    stock: '1', vehicle_model: '', year: '',
    spec_fields: {} as Record<string, string>,
    shop_id: ''
  });

  useEffect(() => {
    const fetchShops = async () => {
      if (!user?.id) return;

      // Récupère uniquement les boutiques créées par l'admin connecté
      const { data, error } = await supabase
        .from('profiles')
        .select('id, store_name, full_name')
        .eq('role', 'vendor')
        .eq('created_by', user.id) 
        .order('store_name', { ascending: true });

      if (error) {
        console.error("Erreur de récupération:", error);
      } else {
        setShops(data || []);
      }
    };

    fetchShops();

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
        year: productToEdit.year || '',
        spec_fields: productToEdit.technical_specs || {},
        shop_id: productToEdit.vendor_id || ''
      });
      setImages(productToEdit.images || []);
    }
  }, [productToEdit, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setIsUploading(true);
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' });
        const fileName = `admin/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
        const { error } = await supabase.storage.from('images').upload(fileName, compressed);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
      }));
      setImages(prev => [...prev, ...urls]);
    } catch (err: any) { toast.error("Erreur upload"); } finally { setIsUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return toast.error("Ajoutez au moins une image.");
    if (!formData.shop_id) return toast.error("Sélectionnez une boutique.");

    setIsLoading(true);
    try {
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
        technical_specs: formData.spec_fields,
        images: images,
        image_url: images[0],
        status: 'approved',
        is_official: true,
        vendor_id: formData.shop_id
      };

      if (productToEdit) {
        await supabase.from('products').update(baseData).eq('id', productToEdit.id);
        toast.success("Produit mis à jour!");
        if (onClearEdit) onClearEdit();
      } else {
        await supabase.from('products').insert([baseData]);
        toast.success("Produit publié officiellement!");
      }
      setActiveTab('product-success');
    } catch (err: any) { toast.error("Erreur: " + err.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 text-slate-200">
      <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-8">
        {productToEdit ? 'Modifier la pièce' : 'Publier une pièce'} (Admin)
      </h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <div onClick={() => !isUploading && fileInputRef.current?.click()} className="aspect-video rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 bg-[#0A0E14]">
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} accept="image/*" />
            {isUploading ? <Loader2 className="animate-spin text-blue-500" /> : <Upload className="text-slate-500" />}
            <span className="mt-2 text-xs text-slate-400">{images.length} images</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#05070B]">
                <img src={url} alt="produit" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/70 rounded-full p-1"><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <section className="bg-[#0A0E14] border border-white/10 rounded-3xl p-8 space-y-4">
            <h3 className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Package size={16} /> Informations</h3>
            
            <select required value={formData.shop_id} onChange={e => setFormData({...formData, shop_id: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-white">
              <option value="">Sélectionner une boutique</option>
              {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.store_name || shop.full_name}</option>)}
            </select>

            <input required placeholder="Nom du produit *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
              <input placeholder="Référence OEM" value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input required type="number" placeholder="Prix FCFA *" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
              <input required type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none">{ETATS.map(e => <option key={e} value={e}>{e}</option>)}</select>
            </div>

            {SPECIFIC_FIELDS[formData.category] && (
              <div className="grid grid-cols-2 gap-4 p-4 border border-blue-500/20 rounded-2xl bg-blue-500/5">
                {SPECIFIC_FIELDS[formData.category].map((field) => (
                  <input key={field.key} placeholder={field.label} value={formData.spec_fields[field.key] || ''} onChange={e => setFormData(p => ({...p, spec_fields: {...p.spec_fields, [field.key]: e.target.value}}))} className="w-full p-3 bg-[#05070B] border border-white/10 rounded-xl" />
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#0A0E14] border border-white/10 rounded-3xl p-8 space-y-4">
            <h3 className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs"><Car size={16} /> Compatibilité</h3>
            <input placeholder="Modèle véhicule" value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
            <textarea rows={3} placeholder="Description détaillée..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none" />
          </section>

          <button disabled={isLoading} className="w-full py-5 bg-blue-600 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
            {isLoading ? 'Traitement...' : 'Publier dans la boutique'}
          </button>
        </div>
      </form>
    </div>
  );
}