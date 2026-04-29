import { useState, useEffect } from 'react';
import { 
  Loader2, ArrowRight, PackagePlus, Zap, Hash, Car, Calendar,
  Package, DollarSign, Tag, AlignLeft, UploadCloud, X, Store, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore'; 

export default function AddProductAdmin() {
  const { user } = useAuthStore(); 
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<{id: string, store_name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  const [productData, setProductData] = useState({
    vendorId: user?.id || '', // 🟢 Par défaut, c'est TON ID d'admin
    name: '',
    price: '',
    categoryId: '', 
    stock: '1',
    description: '',
    reference: '',
    brand: '',
    model: '',
    phase: '',
    year: '',
    capacity: '',
    cca: '',
    batteryType: 'Standard'
  });
  
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isBatteryCategory = categories.find(c => c.id === productData.categoryId)?.name.toLowerCase().includes('batterie');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsResponse, categoriesResponse] = await Promise.all([
          supabase.from('profiles').select('id, store_name').eq('role', 'vendor'),
          supabase.from('categories').select('id, name')
        ]);
        if (vendorsResponse.data) setVendors(vendorsResponse.data);
        if (categoriesResponse.data) setCategories(categoriesResponse.data);
        
        // 🟢 Sécurité : s'assurer que le vendorId est bien le tien au chargement
        if (user) {
          setProductData(prev => ({ ...prev, vendorId: user.id }));
        }
      } catch (err) {
        toast.error("Erreur de chargement des paramètres.");
      }
    };
    fetchData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImage(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const resetForm = () => {
    setProductData({ 
      vendorId: user?.id || '', // 🟢 Reste sur TON ID après avoir vidé le formulaire
      name: '', price: '', categoryId: '', stock: '1', 
      description: '', reference: '', brand: '', model: '', 
      phase: '', year: '', capacity: '', cca: '', batteryType: 'Standard' 
    });
    setProductImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage || !productData.vendorId || !productData.categoryId) {
      toast.error("Champs obligatoires manquants.");
      return;
    }

    setIsLoading(true);

    try {
      const fileName = `prod_${Date.now()}.${productImage.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(`products/${fileName}`, productImage);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`products/${fileName}`);

      if (isBatteryCategory) {
        const { error } = await supabase.from('batteries').insert({
          vendor_id: productData.vendorId, 
          category_id: productData.categoryId, 
          name: productData.name,
          brand: productData.brand || 'Générique',
          price: parseInt(productData.price),
          stock: parseInt(productData.stock), 
          capacity: productData.capacity,
          cca: productData.cca,
          type: productData.batteryType,
          image_url: publicUrl,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({
          vendor_id: productData.vendorId, 
          category_id: productData.categoryId,
          name: productData.name,
          price: parseFloat(productData.price),
          stock: parseInt(productData.stock),
          description: productData.description,
          image_url: publicUrl,
          reference: productData.reference,
          brand: productData.brand,
          model: productData.model,
          phase: productData.phase,
          year: productData.year,
          status: 'approved',
          is_boosted: true
        });
        if (error) throw error;
      }

      toast.success("Publication réussie !");
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 max-w-5xl mx-auto">
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <PackagePlus className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter">Gestion Inventaire Admin</h2>
        </div>
      </div>

      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-6 md:p-12 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Section Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-2">Propriétaire du stock</label>
              <select name="vendorId" value={productData.vendorId} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-900 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 transition-all text-xs appearance-none">
                {/* 🟢 Option explicite garantissant l'envoi vers MyStoreInventory */}
                <option value={user?.id || ''}>👑 Ma Boutique (SpaceAuto Admin)</option>
                <option value="" disabled>─── Vendeurs Marketplace ───</option>
                {/* On filtre pour éviter d'afficher le compte admin deux fois s'il est aussi dans la table profils */}
                {vendors.filter(v => v.id !== user?.id).map(v => (
                  <option key={v.id} value={v.id}>{v.store_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-2">Rayon catalogue</label>
              <select name="categoryId" value={productData.categoryId} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-900 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 transition-all text-xs appearance-none">
                <option value="">Choisir une catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Identification de la pièce */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-l-2 border-blue-500 pl-4">Identification Technique</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Désignation Commerciale</label>
                <div className="relative">
                  <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="name" required value={productData.name} onChange={handleChange} className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 text-xs" placeholder="Ex: Turbo Diesel Haute Pression" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Référence Constructeur</label>
                <div className="relative">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="reference" required value={productData.reference} onChange={handleChange} className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 text-xs uppercase" placeholder="REF-0000" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Marque</label>
                <input type="text" name="brand" required value={productData.brand} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 text-xs" placeholder="BOSCH, VALEO..." />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Modèle Véhicule</label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="model" required value={productData.model} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 text-xs" placeholder="A3, Golf 7..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Phase (Opt.)</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="phase" value={productData.phase} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 text-xs" placeholder="Phase 2" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Année</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="year" required value={productData.year} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 text-xs" placeholder="2018" />
                </div>
              </div>
            </div>
          </div>

          {/* Media & Specs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Visuel Haute Définition</label>
              <div className="relative h-72 rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500/30 transition-all">
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                {imagePreview ? (
                  <img src={imagePreview} className="absolute inset-0 w-full h-full object-contain p-4" alt="Preview" />
                ) : (
                  <UploadCloud className="w-12 h-12 text-slate-600 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Prix de vente (CFA)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input type="number" name="price" required value={productData.price} onChange={handleChange} className="w-full pl-10 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-blue-500/50 text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Stock dispo</label>
                  <input type="number" name="stock" required value={productData.stock} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 text-sm" />
                </div>
              </div>

              {isBatteryCategory ? (
                <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl space-y-4 animate-in zoom-in duration-300">
                   <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-orange-500" /><span className="text-[9px] font-black text-white uppercase italic">Spécifications Batteries</span></div>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" name="capacity" value={productData.capacity} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-xs" placeholder="Capacité (Ah)" />
                      <input type="text" name="cca" value={productData.cca} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-xs" placeholder="Démarrage (CCA)" />
                   </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Description / Notes</label>
                  <textarea name="description" rows={5} value={productData.description} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-3xl font-bold text-white outline-none focus:border-blue-500/50 text-xs resize-none" placeholder="Compatibilité moteur, état..." />
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end">
            <button type="submit" disabled={isLoading} className="group relative px-14 py-6 rounded-2xl bg-blue-600 text-white font-[1000] text-[11px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_10px_30px_rgba(37,99,235,0.3)] disabled:opacity-50">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publier l'article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}