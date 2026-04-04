import { useState, useRef } from 'react';
import { 
  ArrowLeft, Upload, Plus, Info, Check, 
  Image as ImageIcon, Loader2, Trash2, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

export default function AddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États
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
    compatibility: ''
  });

  // --- LOGIQUE CLOUDINARY ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [...images];

    for (let file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "spaceauto_preset"); // Créer ce preset dans Cloudinary
      data.append("cloud_name", "votre_cloud_name");

      try {
        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/votre_cloud_name/image/upload",
          data
        );
        uploadedUrls.push(res.data.secure_url);
      } catch (err) {
        console.error("Erreur upload:", err);
      }
    }
    
    setImages(uploadedUrls);
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // --- LOGIQUE SUPABASE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return alert("Ajoutez au moins une image !");
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('products')
        .insert([{
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          price: parseFloat(formData.price),
          condition: formData.condition,
          compatibility: formData.compatibility,
          images: images, // Array de liens Cloudinary
          vendor_id: user?.id,
          status: 'active',
          created_at: new Date()
        }]);

      if (error) throw error;
      navigate('/vendor/dashboard');
    } catch (error) {
      console.error("Erreur publication:", error);
      alert("Erreur lors de la publication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/vendor/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition font-black text-[10px] uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Annuler
          </Link>
          <h1 className="text-xs font-[1000] uppercase tracking-[0.25em] text-slate-900">Mettre en vente</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLONNE GAUCHE : MULTI-IMAGES */}
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
              className={`aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                dragActive ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              ) : (
                <>
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400"><Upload className="w-6 h-6" /></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Ajouter des photos</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">HD Recommandé</p>
                  </div>
                </>
              )}
            </div>

            {/* PREVIEW DES IMAGES UPLOADÉES */}
            <div className="grid grid-cols-3 gap-3 mt-4">
               {images.map((url, i) => (
                 <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 bg-white/90 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 p-7 rounded-[2rem] text-white shadow-xl">
             <div className="flex gap-4 items-start">
               <div className="p-2 bg-orange-500 rounded-lg"><Info className="w-4 h-4 text-white" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Visibilité Pro</p>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">
                    Renseignez bien les **modèles compatibles**. Nos clients utilisent des filtres précis pour trouver leurs pièces.
                  </p>
               </div>
             </div>
          </div>
        </div>

        {/* COLONNE DROITE : FORMULAIRE */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h2 className="text-xs font-[1000] uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" /> Caractéristiques
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Titre de l'annonce</label>
                <input 
                  type="text" required placeholder="Ex: Plaquettes de frein Brembo - Toyota Hilux"
                  className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Prix de vente (CFA)</label>
                <div className="relative">
                  <input 
                    type="number" required placeholder="0"
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 transition"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">État de la pièce</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                   {['Neuf', 'Occasion'].map(state => (
                     <button 
                       key={state} type="button"
                       onClick={() => setFormData({...formData, condition: state})}
                       className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase transition-all ${formData.condition === state ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                     >
                       {state}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Modèles de véhicules compatibles</label>
              <textarea 
                rows={4} placeholder="Soyez précis : Marque, Modèle, Années..."
                className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition resize-none"
                value={formData.compatibility} onChange={e => setFormData({...formData, compatibility: e.target.value})}
              ></textarea>
            </div>

            <button 
               type="submit" 
               disabled={isLoading || isUploading}
               className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Publier l'article <Plus className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}