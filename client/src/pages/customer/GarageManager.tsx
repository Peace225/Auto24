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

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
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
        const fileExt = selectedImage.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `vehicles/${fileName}`; 

        const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(filePath, selectedImage);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('vehicle-images').getPublicUrl(filePath);
        image_url = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('user_vehicles').insert([{ ...formData, image_url, user_id: user.id }]);
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
      const { error } = await supabase.from('user_vehicles').delete().eq('id', vehicleId);
      if (error) throw error;
      toast.success("Véhicule supprimé.");
      refresh();
    } catch {
      toast.error("Erreur de suppression.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg md:text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Mon Garage</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all active:scale-95 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Ajouter véhicule
        </button>
      </div>

      {/* LISTE DES VÉHICULES */}
      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
          <Car className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun véhicule enregistré</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white border border-slate-100 rounded-3xl p-6 relative group shadow-sm hover:shadow-xl transition-all">
              <button 
                onClick={() => handleDeleteVehicle(v.id)}
                disabled={isDeleting === v.id}
                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
              >
                {isDeleting === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
              
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">{v.year} • {v.fuel_type}</p>
              <h3 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter mb-6">
                {v.make} <span className="text-blue-600 block sm:inline">{v.model}</span>
              </h3>
              
              <button 
                onClick={() => {
                  setShopVehicleFilter?.({ id: v.id, make: v.make, model: v.model, name: `${v.make} ${v.model}` });
                  setActiveTab?.('shop');
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Trouver des pièces
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-[1000] uppercase italic">Nouveau Véhicule</h3>
              <button onClick={resetForm} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="vehicle-img" />
              <label htmlFor="vehicle-img" className="block w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500">
                {imagePreview ? <img src={imagePreview} className="h-full object-contain" /> : <><UploadCloud className="text-slate-400" /> <span className="text-[10px] uppercase font-bold">Ajouter photo</span></>}
              </label>

              <select required value={formData.make} className="w-full px-4 py-4 bg-slate-50 rounded-xl text-[11px] font-bold uppercase" onChange={(e) => setFormData({...formData, make: e.target.value})}>
                <option value="">Sélectionner marque</option>
                {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <input required type="text" placeholder="MODÈLE" value={formData.model} className="w-full px-4 py-4 bg-slate-50 rounded-xl text-[11px] font-bold uppercase" onChange={(e) => setFormData({...formData, model: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="ANNÉE" value={formData.year} className="w-full px-4 py-4 bg-slate-50 rounded-xl text-[11px] font-bold uppercase" onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} />
                <select value={formData.fuel_type} className="w-full px-4 py-4 bg-slate-50 rounded-xl text-[11px] font-bold uppercase" onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}>
                  {["Essence", "Diesel", "Hybride", "Electrique"].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}