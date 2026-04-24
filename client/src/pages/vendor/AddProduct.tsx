import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Upload, Plus, Info, Check, 
  Loader2, X, Lock, Zap, AlertCircle
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
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Pneus',
    price: '',
    condition: 'Neuf',
    description: '',
    oem_reference: '' 
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

    // ⚠️ REMPLACER PAR VOS INFOS CLOUDINARY
    const CLOUD_NAME = "votre_cloud_name"; 
    const UPLOAD_PRESET = "spaceauto_preset";

    for (let file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", UPLOAD_PRESET); 

      try {
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          data
        );
        uploadedUrls.push(res.data.secure_url);
      } catch (err) {
        console.error("Erreur upload Cloudinary:", err);
        toast.error("Erreur lors de l'upload d'une image.");
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

      // ÉTAPE 1 : Insertion de la pièce dans 'products' (Pilier B)
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

      // ÉTAPE 2 : Insertion des compatibilités dans 'part_compatibilities' (Pilier C)
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
      
      toast.success("Produit et compatibilités publiés avec succès !");
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      {/* HEADER FIXE */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/vendor/dashboard" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-[1000] uppercase italic tracking-tighter text-slate-900">Mettre en vente</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Étape unique : Publication</p>
            </div>
          </div>

          {userPlan === 'free' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[240px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Quota Stock Gratuit</span>
                <span className={`text-[10px] font-black ${isLimitReached ? 'text-red-500' : 'text-blue-600'}`}>
                  {productCount} / {MAX_FREE_PRODUCTS}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${isLimitReached ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min((productCount / MAX_FREE_PRODUCTS) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLimitReached ? (
        <div className="max-w-3xl mx-auto mt-20 px-6">
           {/* DESIGN PREMIUM DU BLOCAGE */}
           <div className="bg-slate-900 rounded-[3rem] p-16 text-center text-white shadow-2xl relative border border-slate-800">
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Lock className="w-10 h-10 text-orange-400" />
              </div>
              <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter mb-4">Quota Épuisé</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-10 leading-relaxed uppercase font-bold tracking-tight">
                Passez au plan <span className="text-white">ULTRA-PREMIUM</span> pour débloquer le stock illimité.
              </p>
              <Link to="/vendor/settings" className="inline-flex items-center gap-3 bg-blue-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 transition-all">
                <Zap size={18} /> Débloquer maintenant
              </Link>
           </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLONNE GAUCHE : IMAGES (4 col) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Galerie Multi-Photos</label>
              
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all group"
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                ) : (
                  <>
                    <div className="p-5 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform"><Upload size={24} /></div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Choisir photos</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Format JPG/PNG</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20">
              <div className="flex gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><Info size={20}/></div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Optimisation</h4>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">Un titre précis et des photos HD augmentent vos ventes de 40%.</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : DATA (8 col) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Titre de l'annonce</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Turbo Compresseur Garret - Mercedes Classe C" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 transition-all" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Marque de la pièce</label>
                  <input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Ex: Valeo, Bosch..." className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Référence OEM</label>
                  <input type="text" value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} placeholder="Ex: A2045000203" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Prix de vente (CFA)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0" className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-[1000] text-blue-600 outline-none focus:border-blue-600" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">État</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                     {['Neuf', 'Occasion'].map(state => (
                       <button key={state} type="button" onClick={() => setFormData({...formData, condition: state})} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${formData.condition === state ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-500'}`}>{state}</button>
                     ))}
                  </div>
                </div>

                {/* 🟢 COMPOSANT RÉEL DE COMPATIBILITÉ */}
                <div className="md:col-span-2 pt-4">
                  <VehicleCompatibilitySelector 
                    selectedVehicleIds={compatibleVehicles} 
                    onChange={setCompatibleVehicles} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Description Technique</label>
                  <textarea rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Détails sur l'origine, garantie, état de marche..." className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-600 resize-none transition-all"></textarea>
                </div>
              </div>

              <button 
                 type="submit" 
                 disabled={isLoading || isUploading || images.length === 0}
                 className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-[1000] text-xs uppercase tracking-[0.35em] shadow-2xl hover:bg-blue-600 transition-all disabled:opacity-50 flex justify-center items-center gap-4 active:scale-95"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Publier l'annonce <Check size={20} /></>}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}