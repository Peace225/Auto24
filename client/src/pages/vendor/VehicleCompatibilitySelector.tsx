import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Upload, Plus, Info, Check, 
  Image as ImageIcon, Loader2, Trash2, X, Lock, Zap, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';
import toast from 'react-hot-toast';
// 🟢 Import du sélecteur de compatibilité reel
import VehicleCompatibilitySelector from './VehicleCompatibilitySelector';

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- ÉTATS FREEMIUM ---
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [userPlan, setUserPlan] = useState('free');
  
  // --- ÉTATS FORMULAIRE & UPLOAD ---
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Pneus',
    price: '',
    stock: '1',
    condition: 'Neuf',
    description: '',
    oem_reference: '' // Ajouté pour la recherche pro
  });

  // 🟢 État pour la Matrice de Compatibilité (Pilier C)
  const [compatibleVehicles, setCompatibleVehicles] = useState<string[]>([]);

  // 1. VÉRIFICATION DES LIMITES AU CHARGEMENT
  useEffect(() => {
    const checkLimits = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .single();
          
        if (profile?.subscription_plan) setUserPlan(profile.subscription_plan);

        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', user.id);

        if (error) throw error;
        setProductCount(count || 0);

      } catch (err) {
        console.error("Erreur de vérification des limites:", err);
      } finally {
        setIsLoadingLimits(false);
      }
    };

    checkLimits();
  }, [user]);

  const MAX_FREE_PRODUCTS = 10;
  const isLimitReached = userPlan === 'free' && productCount >= MAX_FREE_PRODUCTS;

  // --- LOGIQUE CLOUDINARY ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [...images];

    for (let file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "spaceauto_preset"); 
      data.append("cloud_name", "votre_cloud_name"); 

      try {
        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/votre_cloud_name/image/upload",
          data
        );
        uploadedUrls.push(res.data.secure_url);
      } catch (err) {
        console.error("Erreur upload:", err);
        toast.error("Erreur lors de l'upload de l'image.");
      }
    }
    
    setImages(uploadedUrls);
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // --- LOGIQUE SUPABASE (INSERTION PILLIER B + C) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) return;
    if (images.length === 0) return toast.error("Ajoutez au moins une image !");
    
    setIsLoading(true);
    try {
      if (!user) throw new Error("Non connecté");

      // ÉTAPE 1 : Insertion de la pièce (Pilier B)
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          price: parseFloat(formData.price),
          condition: formData.condition,
          description: formData.description,
          oem_reference: formData.oem_reference,
          images: images, 
          vendor_id: user.id,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (productError) throw productError;

      // ÉTAPE 2 : Insertion des compatibilités (Pilier C)
      if (compatibleVehicles.length > 0 && newProduct) {
        const compatibilities = compatibleVehicles.map(vId => ({
          product_id: newProduct.id,
          vehicle_id: vId
        }));

        const { error: compatError } = await supabase
          .from('part_compatibilities')
          .insert(compatibilities);

        if (compatError) throw compatError;
      }
      
      toast.success("Produit et compatibilités publiés !");
      navigate('/vendor/dashboard');
    } catch (error: any) {
      console.error("Erreur publication:", error);
      toast.error(error.message || "Erreur lors de la publication.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingLimits) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      {/* HEADER AVEC JAUGE */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/vendor/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition font-black text-[10px] uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <h1 className="text-xs font-[1000] uppercase tracking-[0.25em] text-slate-900 hidden sm:block">Mettre en vente</h1>
          </div>

          {userPlan === 'free' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[200px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plan Gratuit</span>
                <span className={`text-[10px] font-black ${isLimitReached ? 'text-red-500' : 'text-blue-600'}`}>
                  {productCount} / {MAX_FREE_PRODUCTS}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isLimitReached ? 'bg-red-500' : productCount >= 8 ? 'bg-orange-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min((productCount / MAX_FREE_PRODUCTS) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLimitReached ? (
        <div className="max-w-3xl mx-auto mt-10 px-6">
          {/* ... Mur de blocage Premium (Gardé tel quel) ... */}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* COLONNE GAUCHE : IMAGES */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Galerie Photos</label>
              <input 
                type="file" multiple className="hidden" 
                ref={fileInputRef} onChange={handleFileUpload}
                accept="image/*"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-100 transition-all"
              >
                {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-blue-600" /> : <><div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><Upload className="w-6 h-6" /></div><p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Ajouter</p></>}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-white/90 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : FORMULAIRE & COMPATIBILITÉ */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <h2 className="text-xs font-[1000] uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> Caractéristiques
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Titre de l'annonce</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Marque (Bosch, Brembo...)</label>
                  <input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Référence OEM (Optionnel)</label>
                  <input type="text" value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Prix (CFA)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-600 outline-none" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">État</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                     {['Neuf', 'Occasion'].map(state => (
                       <button key={state} type="button" onClick={() => setFormData({...formData, condition: state})} className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase transition-all ${formData.condition === state ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{state}</button>
                     ))}
                  </div>
                </div>

                {/* 🟢 LE CERVEAU : MOTEUR DE COMPATIBILITÉ RÉEL */}
                <div className="md:col-span-2">
                  <VehicleCompatibilitySelector 
                    selectedVehicleIds={compatibleVehicles} 
                    onChange={setCompatibleVehicles} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Description</label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-600 resize-none"></textarea>
                </div>
              </div>

              <button 
                 type="submit" 
                 disabled={isLoading || isUploading || images.length === 0}
                 className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50 flex justify-center items-center gap-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Publier l'annonce <Plus className="w-5 h-5" /></>}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}