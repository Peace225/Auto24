import { useState, useEffect } from 'react';
import { Car, Plus, Trash2, X, ShieldCheck, Zap, Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const POPULAR_BRANDS = ["Toyota", "Hyundai", "Suzuki", "Kia", "Mitsubishi", "Mercedes-Benz", "BMW", "Ford", "Nissan", "Range Rover"];

export default function GarageManager({ vehicles, refresh, setActiveTab, setShopVehicleFilter }: { vehicles: any[], refresh: () => void, setActiveTab?: any, setShopVehicleFilter?: any }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    make: '', 
    model: '', 
    year: new Date().getFullYear(), 
    fuel_type: 'Essence' 
  });

  // 🟢 Nettoyage de la mémoire à la destruction du composant ou fermeture de modale
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview); // Libère l'ancienne URL
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({ make: '', model: '', year: new Date().getFullYear(), fuel_type: 'Essence' });
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      let image_url = null;

      if (selectedImage) {
        // 🟢 Sécurisation de l'extension de fichier
        const fileExt = selectedImage.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `vehicles/${fileName}`; 

        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(filePath, selectedImage);

        if (uploadError) {
          toast.error("Erreur d'upload de l'image.");
        } else {
          const { data: publicUrlData } = supabase.storage.from('vehicle-images').getPublicUrl(filePath);
          image_url = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase.from('user_vehicles').insert([{ 
        ...formData, 
        image_url: image_url,
        user_id: user.id 
      }]);
      
      if (error) throw error;
      
      toast.success("Véhicule ajouté !");
      resetForm();
      refresh();
      
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm("Retirer ce véhicule du garage ?")) return;
    setIsDeleting(vehicleId);
    try {
      // 💡 Note : Si tu veux être rigoureux, tu devrais aussi supprimer l'image du Storage Supabase ici
      // pour éviter de payer pour des fichiers orphelins (ex: supabase.storage.from('vehicle-images').remove([...]))
      const { error } = await supabase.from('user_vehicles').delete().eq('id', vehicleId);
      if (error) throw error;
      toast.success("Véhicule supprimé.");
      refresh();
    } catch (error) {
      toast.error("Erreur de suppression.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER GARAGE COMPACT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <h2 className="text-lg md:text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Mon Garage Privé</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg w-full sm:w-auto justify-center active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> Ajouter véhicule
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl md:rounded-[3rem]">
          <Car className="w-10 h-10 md:w-16 md:h-16 text-slate-300 mb-2 md:mb-4" />
          <h3 className="text-base md:text-xl font-[1000] text-slate-400 uppercase italic tracking-tighter">Garage Vide</h3>
          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-2">Ajoutez votre premier véhicule</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 relative group overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col min-h-[220px] md:min-h-[300px]">
              
              <button 
                onClick={() => handleDeleteVehicle(v.id)}
                disabled={isDeleting === v.id}
                className="absolute top-3 right-3 md:top-6 md:right-6 p-1.5 md:p-2 bg-white/80 backdrop-blur-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-lg md:rounded-xl transition-all z-20 opacity-100 lg:opacity-0 group-hover:opacity-100 shadow-sm"
              >
                {isDeleting === v.id ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-red-500" /> : <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>

              {v.image_url ? (
                <div className="absolute top-0 right-0 w-28 h-28 md:w-40 md:h-40 opacity-20 group-hover:opacity-100 transition-all duration-500 z-0 pointer-events-none mask-image-gradient">
                  <img src={v.image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover object-center mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                </div>
              ) : (
                <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 group-hover:text-blue-600 group-hover:opacity-10 transition-all pointer-events-none z-0">
                  <Car className="w-16 h-16 md:w-24 md:h-24 -mr-2 -mt-2" />
                </div>
              )}
              
              <div className="relative z-10 flex-1">
                <p className="text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 md:mb-2">{v.year} • {v.fuel_type}</p>
                <h3 className="text-xl md:text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter mb-4">
                  {v.make} <span className="text-blue-600 block sm:inline">{v.model}</span>
                </h3>
              </div>
              
              <div className="mt-auto relative z-10">
                <div className="flex items-center gap-1.5 md:gap-2 text-[7px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-6">
                  <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> Pièces compatibles
                </div>

                <button 
                  onClick={() => {
                    if(setShopVehicleFilter && setActiveTab) {
                      setShopVehicleFilter({ 
                        id: v.id, 
                        make: v.make, 
                        model: v.model,
                        name: `${v.make} ${v.model}` 
                      });
                      setActiveTab('shop');
                    } else {
                      toast.error("Catalogue non connecté.");
                    }
                  }}
                  className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" /> Trouver des pièces
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL D'AJOUT DE VÉHICULE COMPACTE */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl md:rounded-[3rem] p-5 md:p-8 shadow-2xl relative animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button 
              onClick={resetForm} 
              className="absolute top-3 right-3 md:top-6 md:right-6 text-slate-400 hover:text-slate-900 transition-colors z-10 bg-slate-50 p-1.5 md:p-2 rounded-full"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            <div className="text-center mb-4 md:mb-6 mt-2">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                <Car className="w-5 h-5 md:w-7 md:h-7 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Nouveau Véhicule</h3>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 md:space-y-4">
              
              <div className="w-full">
                <label className="block text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Photo (Optionnel)</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-3 md:p-4 hover:bg-slate-50 hover:border-blue-400 transition-all text-center cursor-pointer overflow-hidden group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {imagePreview ? (
                    <div className="relative h-16 md:h-24 w-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3 md:w-4 md:h-4" /> Changer
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                      <UploadCloud className="w-6 h-6 md:w-8 md:h-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image du véhicule</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🟢 AJOUT DU PARAMÈTRE 'value' SUR TOUS LES CHAMPS POUR LES CONTRÔLER */}
              <select 
                required
                value={formData.make}
                className="w-full px-4 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-200 rounded-xl text-[9px] md:text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all cursor-pointer"
                onChange={(e) => setFormData({...formData, make: e.target.value})}
              >
                <option value="">Sélectionner la marque</option>
                {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <input 
                type="text" placeholder="MODÈLE (EX: RAV4...)" required
                value={formData.model}
                className="w-full px-4 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-200 rounded-xl text-[9px] md:text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all"
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <input 
                  type="number" placeholder="ANNÉE" required min="1950" max={new Date().getFullYear() + 1}
                  value={formData.year}
                  className="w-full px-4 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-200 rounded-xl text-[9px] md:text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all"
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                />
                <select 
                  value={formData.fuel_type}
                  className="w-full px-4 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-200 rounded-xl text-[9px] md:text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all cursor-pointer"
                  onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                >
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybride">Hybride</option>
                  <option value="Electrique">Électrique</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 md:py-5 mt-2 bg-blue-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}