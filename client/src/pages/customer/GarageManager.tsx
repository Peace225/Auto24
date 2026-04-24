import { useState } from 'react';
import { Car, Plus, Trash2, X, ShieldCheck, Zap, Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const POPULAR_BRANDS = ["Toyota", "Hyundai", "Suzuki", "Kia", "Mitsubishi", "Mercedes-Benz", "BMW", "Ford", "Nissan", "Range Rover"];

// On ajoute setActiveTab et setShopVehicleFilter dans les props pour la liaison avec le catalogue
export default function GarageManager({ vehicles, refresh, setActiveTab, setShopVehicleFilter }: { vehicles: any[], refresh: () => void, setActiveTab?: any, setShopVehicleFilter?: any }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // États pour l'image
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    make: '', 
    model: '', 
    year: new Date().getFullYear(), 
    fuel_type: 'Essence' 
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); // Prévisualisation locale
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      let image_url = null;

      // 1. Upload de l'image si elle existe
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `vehicles/${fileName}`; // Le chemin dans le bucket

        // Upload vers le bucket "vehicle-images"
        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(filePath, selectedImage);

        if (uploadError) {
          console.error("Erreur d'upload de l'image:", uploadError);
          toast.error("L'image n'a pas pu être téléchargée. Vérifiez que le bucket 'vehicle-images' existe et est public.");
        } else {
          // Récupération de l'URL publique
          const { data: publicUrlData } = supabase.storage
            .from('vehicle-images')
            .getPublicUrl(filePath);
          
          image_url = publicUrlData.publicUrl;
        }
      }

      // 2. Insertion dans la base de données (table user_vehicles)
      const { error } = await supabase.from('user_vehicles').insert([{ 
        ...formData, 
        image_url: image_url, // On ajoute l'URL de l'image
        user_id: user.id 
      }]);
      
      if (error) throw error;
      
      toast.success("Véhicule ajouté à votre garage !");
      
      // Réinitialisation du formulaire
      setShowAddForm(false);
      setSelectedImage(null);
      setImagePreview(null);
      setFormData({ make: '', model: '', year: new Date().getFullYear(), fuel_type: 'Essence' });
      
      // Rafraîchissement des données
      refresh();
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de l'ajout du véhicule.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm("Voulez-vous vraiment retirer ce véhicule de votre garage ?")) return;
    
    setIsDeleting(vehicleId);
    try {
      const { error } = await supabase.from('user_vehicles').delete().eq('id', vehicleId);
      if (error) throw error;
      
      toast.success("Véhicule supprimé du garage.");
      refresh();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Mon Garage Privé</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Ajouter un véhicule
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
          <Car className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-[1000] text-slate-400 uppercase italic tracking-tighter">Garage Vide</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Ajoutez votre premier véhicule pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 relative group overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col min-h-[300px]">
              
              {/* Bouton Supprimer */}
              <button 
                onClick={() => handleDeleteVehicle(v.id)}
                disabled={isDeleting === v.id}
                className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all z-20 opacity-100 lg:opacity-0 group-hover:opacity-100 shadow-sm"
                title="Retirer du garage"
              >
                {isDeleting === v.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
              </button>

              {/* Affichage de l'image (si url) ou de l'icône par défaut */}
              {v.image_url ? (
                <div className="absolute top-0 right-0 w-40 h-40 opacity-30 group-hover:opacity-100 transition-all duration-500 z-0 pointer-events-none mask-image-gradient">
                  <img src={v.image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover object-center mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                </div>
              ) : (
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:text-blue-600 group-hover:opacity-10 transition-all pointer-events-none z-0">
                  <Car className="w-24 h-24 -mr-4 -mt-4" />
                </div>
              )}
              
              <div className="relative z-10 flex-1">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{v.year} • {v.fuel_type}</p>
                <h3 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter mb-6">
                  {v.make} <span className="text-blue-600 block sm:inline">{v.model}</span>
                </h3>
              </div>
              
              <div className="mt-auto relative z-10">
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-6">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Pièces compatibles vérifiées
                </div>

                <button 
                  onClick={() => {
                    if(setShopVehicleFilter && setActiveTab) {
                      setShopVehicleFilter({ id: v.id, name: `${v.make} ${v.model}` });
                      setActiveTab('shop'); // Redirection vers le catalogue avec filtre
                    } else {
                      toast.error("Le catalogue n'est pas encore connecté.");
                    }
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Voir les pièces
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORMULAIRE AVEC UPLOAD IMAGE --- */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button 
              onClick={() => {
                setShowAddForm(false);
                setSelectedImage(null);
                setImagePreview(null);
              }} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors z-10 bg-slate-50 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6 mt-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Car className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Nouveau Véhicule</h3>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              
              {/* Zone d'upload d'image */}
              <div className="w-full">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-2">Photo du véhicule (Optionnel)</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 hover:bg-slate-50 hover:border-blue-400 transition-all text-center cursor-pointer overflow-hidden group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {imagePreview ? (
                    <div className="relative h-24 w-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Changer l'image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Cliquez ou glissez une image</span>
                    </div>
                  )}
                </div>
              </div>

              <select 
                required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 focus:bg-white outline-none transition-all cursor-pointer"
                onChange={(e) => setFormData({...formData, make: e.target.value})}
              >
                <option value="">Sélectionner la marque</option>
                {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <input 
                type="text" placeholder="MODÈLE (EX: RAV4, ELANTRA...)" required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" placeholder="ANNÉE" required min="1950" max={new Date().getFullYear() + 1}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                />
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 focus:bg-white outline-none transition-all cursor-pointer"
                  onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                  defaultValue="Essence"
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
                className="w-full py-5 mt-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer le véhicule"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}