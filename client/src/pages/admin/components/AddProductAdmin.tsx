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
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-slate-200">
      <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white mb-6 md:mb-8">
        {productToEdit ? 'Modifier la pièce' : 'Publier une pièce'} (Admin)
      </h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-5 space-y-4">
          <div onClick={() => !isUploading && fileInputRef.current?.click()} className="aspect-video rounded-2xl md:rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 bg-[#0A0E14] transition-colors p-4">
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} accept="image/*" />
            {isUploading ? <Loader2 className="animate-spin text-blue-500 w-6 h-6 md:w-8 md:h-8" /> : <Upload className="text-slate-500 w-6 h-6 md:w-8 md:h-8" />}
            <span className="mt-2 text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{images.length} images</span>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#05070B] group">
                <img src={url} alt="produit" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/70 hover:bg-red-500/80 rounded-full p-1 transition-colors">
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          <section className="bg-[#0A0E14] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-4">
            <h3 className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-[10px] md:text-xs mb-2 md:mb-4">
              <Package size={14} className="md:w-4 md:h-4" /> Informations
            </h3>
            
            <select required value={formData.shop_id} onChange={e => setFormData({...formData, shop_id: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50 cursor-pointer">
              <option value="">Sélectionner une boutique</option>
              {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.store_name || shop.full_name}</option>)}
            </select>

            <input required placeholder="Nom du produit *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <input placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
              <input placeholder="Référence OEM" value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <input required type="number" placeholder="Prix FCFA *" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
              <input required type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50 cursor-pointer">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50 cursor-pointer">{ETATS.map(e => <option key={e} value={e}>{e}</option>)}</select>
            </div>

            {SPECIFIC_FIELDS[formData.category] && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 p-4 md:p-5 border border-blue-500/20 rounded-2xl bg-blue-500/5">
                {SPECIFIC_FIELDS[formData.category].map((field) => (
                  <input key={field.key} placeholder={field.label} value={formData.spec_fields[field.key] || ''} onChange={e => setFormData(p => ({...p, spec_fields: {...p.spec_fields, [field.key]: e.target.value}}))} className="w-full p-3.5 bg-[#05070B] border border-white/10 rounded-xl text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#0A0E14] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-4">
            <h3 className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-[10px] md:text-xs mb-2 md:mb-4">
              <Car size={14} className="md:w-4 md:h-4" /> Compatibilité
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <input placeholder="Modèle véhicule (ex: RAV4)" value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
              <input placeholder="Année (ex: 2018)" type="number" min="1950" max={new Date().getFullYear() + 1} value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50" />
            </div>
            <textarea rows={4} placeholder="Description détaillée..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3.5 md:p-4 bg-[#05070B] border border-white/10 rounded-xl outline-none text-[11px] md:text-sm text-white font-bold transition-colors focus:border-blue-500/50 resize-none custom-scrollbar" />
          </section>

          <button disabled={isLoading} className="w-full py-4 md:py-5 bg-blue-600 rounded-xl md:rounded-2xl font-[1000] text-[10px] md:text-xs uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]">
            {isLoading ? <><Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> Traitement...</> : 'Publier dans la boutique'}
          </button>
        </div>
      </form>
    </div>
  );
}