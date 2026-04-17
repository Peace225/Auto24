import { useState } from 'react';
import { 
  Store, User, Mail, Phone, MapPin, 
  Loader2, ArrowRight, ShieldCheck, CheckCircle2, Building2, PackagePlus,
  Package, DollarSign, Tag, AlignLeft, ArrowLeft, Save, ImagePlus, UploadCloud, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface CreateStoreProps {
  setActiveTab?: (tab: string) => void;
}

type Step = 'store-form' | 'success' | 'product-form';

export default function CreateStore({ setActiveTab }: CreateStoreProps) {
  const [step, setStep] = useState<Step>('store-form');
  const [isLoading, setIsLoading] = useState(false);
  const [createdStoreId, setCreatedStoreId] = useState<string | null>(null);
  
  // --- STATE BOUTIQUE ---
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    commune: '',
    activity: 'magasin',
  });

  // --- STATE PRODUIT (Avec Image) ---
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    category: 'Moteur',
    stock: '1',
    description: ''
  });
  
  // 🟢 NOUVEAU : États pour l'image du produit
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- HANDLERS ---
  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  // 🟢 NOUVEAU : Gestionnaire de l'upload d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImage(file);
      setImagePreview(URL.createObjectURL(file)); // Crée une URL locale pour la prévisualisation
    }
  };

  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
  };

  const resetFlow = () => {
    setStep('store-form');
    setFormData({ shopName: '', ownerName: '', email: '', phone: '', commune: '', activity: 'magasin' });
    setProductData({ name: '', price: '', category: 'Moteur', stock: '1', description: '' });
    removeImage();
    setCreatedStoreId(null);
  };

  // --- SOUMISSION BOUTIQUE ---
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      setCreatedStoreId(`store_${Math.random().toString(36).substr(2, 9)}`);
      toast.success("Boutique créée et certifiée avec succès !");
      setStep('success');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- SOUMISSION PRODUIT ---
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productImage) {
      toast.error("Veuillez ajouter une image pour ce produit.");
      return;
    }

    setIsLoading(true);

    try {
      // ⚠️ En prod : 
      // 1. Uploader productImage dans Supabase Storage
      // 2. Récupérer l'URL publique
      // 3. Insérer les données dans la table products
      console.log("Produit avec image à insérer pour", createdStoreId, productData, productImage.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Premier produit ajouté en ligne !");
      if (setActiveTab) setActiveTab('overview'); 
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout du produit.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // VUE 2 : ÉCRAN DE SUCCÈS
  // ==========================================
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#111625] border border-emerald-500/20 rounded-[2.5rem] animate-in zoom-in duration-500 shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 text-center px-6">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-[1000] text-white uppercase italic tracking-tighter mb-4">Boutique Opérationnelle</h2>
          <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em] mb-12">Les accès ont été envoyés à {formData.email}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <button onClick={resetFlow} className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">Terminer</button>
            <button onClick={() => setStep('product-form')} className="w-full sm:w-auto group relative px-8 py-4 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-3"><PackagePlus className="w-5 h-5 group-hover:-rotate-12 transition-transform" /> Ajouter un produit à {formData.shopName}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMULAIRE D'AJOUT DE PRODUIT (AVEC IMAGE)
  // ==========================================
  if (step === 'product-form') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
        <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="relative z-10 flex items-center gap-4">
            <button onClick={() => setStep('success')} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
            <div>
              <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter flex items-center gap-3">
                <PackagePlus className="w-6 h-6 text-blue-500" /> Premier Article
              </h2>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Catalogue de : {formData.shopName}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative">
          <form onSubmit={handleProductSubmit} className="space-y-8">
            
            {/* 🟢 ZONE D'UPLOAD D'IMAGE XXL */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Photo du Produit</label>
                 {imagePreview && (
                   <button type="button" onClick={removeImage} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                     <X className="w-3 h-3" /> Retirer l'image
                   </button>
                 )}
              </div>
              
              <div className="relative w-full h-56 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10 transition-all overflow-hidden flex flex-col items-center justify-center group">
                {/* L'input file invisible qui couvre toute la zone */}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  title="Choisir une image"
                />
                
                {imagePreview ? (
                  <div className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                     <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-300" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 z-10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="p-5 rounded-full bg-white/5 group-hover:bg-blue-500/20 transition-colors shadow-inner">
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-400" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Cliquez ou glissez une image</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Formats supportés: JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LE RESTE DU FORMULAIRE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nom de la pièce</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" name="name" required value={productData.name} onChange={handleProductChange} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs" placeholder="Ex: Moteur Toyota Yaris" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Prix (FCFA)</label>
                    <div className="relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <input type="number" name="price" required value={productData.price} onChange={handleProductChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs" placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Stock</label>
                    <div className="relative group">
                      <input type="number" name="stock" required value={productData.stock} onChange={handleProductChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs" />
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
                    <select name="category" value={productData.category} onChange={handleProductChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs appearance-none">
                      <option value="Moteur" className="bg-slate-900">Moteur</option>
                      <option value="Carrosserie" className="bg-slate-900">Carrosserie</option>
                      <option value="Électronique" className="bg-slate-900">Électronique</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Description</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-tl-2xl rounded-bl-2xl" />
                    <AlignLeft className="absolute left-4 top-5 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <textarea name="description" rows={3} required value={productData.description} onChange={handleProductChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs resize-none" placeholder="Détails de la pièce..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex justify-end gap-4">
              <button type="submit" disabled={isLoading} className="w-full md:w-auto group relative overflow-hidden px-10 py-5 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] disabled:opacity-50">
                <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Publier le produit <Save className="w-4 h-4" /></>}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 1 : FORMULAIRE DE CRÉATION BOUTIQUE (Inchangée)
  // ==========================================
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ... [Ton Header et ton Formulaire de Boutique restent exactement les mêmes ici] ... */}
      
      {/* 🔴 HEADER */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter">Création de Boutique</h2>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:ml-9">Génération manuelle de compte partenaire VIP</p>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Auto-Certification Active</span>
          </div>
        </div>
      </div>

      {/* 🔴 FORMULAIRE BOUTIQUE */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative">
        <form onSubmit={handleStoreSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6">Informations Commerciales</h3>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Enseigne (Nom du magasin)</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                  <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" name="shopName" required value={formData.shopName} onChange={handleStoreChange} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="Ex: AutoParts Abidjan" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Activité</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <select name="activity" value={formData.activity} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs appearance-none">
                      <option value="magasin" className="bg-slate-900">Magasin</option>
                      <option value="casse" className="bg-slate-900">Casse Auto</option>
                      <option value="garage" className="bg-slate-900">Garage</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Localisation</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" name="commune" required value={formData.commune} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="Ex: Marcory" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6">Identifiants de connexion</h3>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nom du gérant</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleStoreChange} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="Nom complet" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Pro</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="email" name="email" required value={formData.email} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="contact@..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Téléphone</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleStoreChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs placeholder:text-slate-600" placeholder="0700..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end">
            <button type="submit" disabled={isLoading} className="w-full sm:w-auto group relative overflow-hidden px-10 py-5 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] disabled:opacity-50">
              <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Générer la Boutique <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}