import { useState } from 'react';
// 🟢 J'ai ajouté Loader2 dans les imports ici 👇
import { Car, Plus, Trash2, X, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const POPULAR_BRANDS = ["Toyota", "Hyundai", "Suzuki", "Kia", "Mitsubishi", "Mercedes-Benz", "BMW", "Ford", "Nissan", "Range Rover"];

export default function GarageManager({ vehicles, refresh }: { vehicles: any[], refresh: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ make: '', model: '', year: new Date().getFullYear(), fuel_type: 'Essence' });

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('user_vehicles').insert([{ ...formData, user_id: user?.id }]);
      if (error) throw error;
      
      toast.success("Véhicule ajouté à votre garage !");
      setShowAddForm(false);
      refresh();
    } catch (error) {
      toast.error("Erreur lors de l'ajout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Mon Garage Privé</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Ajouter un véhicule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 relative group overflow-hidden shadow-sm hover:shadow-xl transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:text-blue-600 group-hover:opacity-20 transition-all">
                <Car className="w-16 h-16" />
             </div>
             <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{v.year} • {v.fuel_type}</p>
             <h3 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter mb-6">{v.make} <span className="text-blue-600">{v.model}</span></h3>
             
             <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Pièces compatibles vérifiées
             </div>

             <button className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-colors">
                Voir les pièces adaptées
             </button>
          </div>
        ))}
      </div>

      {/* --- MODAL FORMULAIRE --- */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowAddForm(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X /></button>
            
            <div className="text-center mb-8">
              <Car className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Nouveau Véhicule</h3>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-5">
              <select 
                required
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all"
                onChange={(e) => setFormData({...formData, make: e.target.value})}
              >
                <option value="">Sélectionner la marque</option>
                {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <input 
                type="text" placeholder="MODÈLE (EX: RAV4, ELANTRA...)" required
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all"
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" placeholder="ANNÉE" required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all"
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                />
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase focus:border-blue-600 outline-none transition-all"
                  onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                >
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybride">Hybride</option>
                </select>
              </div>

              <button 
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-100"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Enregistrer dans mon garage"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}