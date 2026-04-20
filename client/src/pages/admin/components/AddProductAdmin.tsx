import { useState, useEffect } from 'react';
import { 
  Loader2, ArrowRight, PackagePlus,
  Package, DollarSign, Tag, AlignLeft, Save, UploadCloud, X, Store
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase'; // Ajuste le chemin selon ton architecture

export default function AddProductAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  
  // --- DONNÉES DYNAMIQUES DEPUIS SUPABASE ---
  const [vendors, setVendors] = useState<{id: string, store_name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // --- STATE PRODUIT ---
  const [productData, setProductData] = useState({
    vendorId: '',   // 🟢 Pour choisir à quelle boutique appartient la pièce
    name: '',
    price: '',
    categoryId: '', 
    stock: '1',
    description: ''
  });
  
  // --- ÉTATS IMAGE ---
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 🟢 CHARGEMENT DES BOUTIQUES ET CATÉGORIES AU DÉMARRAGE
  useEffect(() => {
    const fetchData = async () => {
      try {
        // On charge les vendeurs et les catégories en même temps pour aller plus vite
        const [vendorsResponse, categoriesResponse] = await Promise.all([
          supabase.from('profiles').select('id, store_name').eq('role', 'vendor'),
          supabase.from('categories').select('id, name')
        ]);

        if (vendorsResponse.error) throw vendorsResponse.error;
        if (categoriesResponse.error) throw categoriesResponse.error;

        if (vendorsResponse.data) setVendors(vendorsResponse.data);
        if (categoriesResponse.data) setCategories(categoriesResponse.data);

      } catch (err) {
        console.error("Erreur de chargement des données", err);
        toast.error("Impossible de charger les boutiques ou catégories.");
      }
    };
    fetchData();
  }, []);

  // --- HANDLERS ---
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

  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setProductData({ vendorId: '', name: '', price: '', categoryId: '', stock: '1', description: '' });
    removeImage();
  };

  // ==========================================
  // 🟢 LOGIQUE D'AJOUT DU PRODUIT
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productImage) {
      toast.error("Veuillez ajouter une photo de la pièce.");
      return;
    }
    if (!productData.vendorId) {
      toast.error("Veuillez sélectionner la boutique vendeuse.");
      return;
    }
    if (!productData.categoryId) {
      toast.error("Veuillez sélectionner une catégorie.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload de l'image
      const fileExt = productImage.name.split('.').pop();
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images') 
        .upload(filePath, productImage);

      if (uploadError) throw uploadError;

      // 2. Récupération URL Publique
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // 3. Insertion Produit dans la base
      const { error: productError } = await supabase.from('products').insert({
        vendor_id: productData.vendorId, // L'ID de la boutique choisie
        category_id: productData.categoryId,
        name: productData.name,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        description: productData.description,
        image_url: publicUrlData.publicUrl,
        status: 'approved', // Approuvé par défaut car créé par l'Admin
        is_boosted: true    // Boosté pour apparaître direct en Accueil
      });

      if (productError) throw productError;

      toast.success("Pièce ajoutée au catalogue avec succès !");
      resetForm();

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de l'ajout du produit.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 max-w-5xl mx-auto">
      
      {/* 🔴 HEADER */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <PackagePlus className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl md:text-3xl font-[1000] text-white uppercase italic tracking-tighter">
              Ajouter une pièce
            </h2>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest md:ml-11">
            Insertion directe dans le catalogue
          </p>
        </div>
      </div>

      {/* 🔴 FORMULAIRE PRODUIT */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SÉLECTION DE LA BOUTIQUE (LE PLUS IMPORTANT POUR L'ADMIN) */}
          <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl mb-8">
            <label className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">
              Assigner cette pièce à la boutique :
            </label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-xl" />
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
              <select 
                name="vendorId" 
                value={productData.vendorId} 
                onChange={handleChange} 
                required
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-sm appearance-none"
              >
                <option value="" className="bg-slate-900">-- Sélectionner un vendeur partenaire --</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id} className="bg-slate-900">
                    {vendor.store_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ZONE D'UPLOAD D'IMAGE */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Photo du Produit</label>
               {imagePreview && (
                 <button type="button" onClick={removeImage} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                   <X className="w-3 h-3" /> Retirer l'image
                 </button>
               )}
            </div>
            
            <div className="relative w-full h-64 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10 transition-all overflow-hidden flex flex-col items-center justify-center group">
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" title="Choisir une image" />
              {imagePreview ? (
                <div className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                   <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-300" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 z-10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="p-5 rounded-full bg-white/5 group-hover:bg-blue-500/20 transition-colors shadow-inner">
                    <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-400" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Cliquez ou glissez la photo de la pièce</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Formats supportés: JPG, PNG, WEBP (Max 5MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DÉTAILS DU PRODUIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nom de la pièce</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                  <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" name="name" required value={productData.name} onChange={handleChange} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs" placeholder="Ex: Amortisseur Avant BMW" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Prix (FCFA)</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="number" name="price" required value={productData.price} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs" placeholder="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Stock</label>
                  <div className="relative group">
                    <input type="number" name="stock" required value={productData.stock} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs" min="1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Catégorie</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <select 
                    name="categoryId" 
                    value={productData.categoryId} 
                    onChange={handleChange} 
                    required
                    className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs appearance-none"
                  >
                    <option value="" className="bg-slate-900">Choisir un rayon</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Description</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-tl-2xl rounded-bl-2xl" />
                  <AlignLeft className="absolute left-4 top-5 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <textarea name="description" rows={3} required value={productData.description} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs resize-none" placeholder="État de la pièce, compatibilité, etc..." />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end">
            <button type="submit" disabled={isLoading} className="w-full sm:w-auto group relative overflow-hidden px-12 py-5 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] disabled:opacity-50">
              <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Publier le produit <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}