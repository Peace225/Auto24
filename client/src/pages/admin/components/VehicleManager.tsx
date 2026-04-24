import { useState, useEffect } from 'react';
import { 
  Plus, Search, Car, Trash2, Loader2, 
  ChevronRight, Filter, Database, AlertCircle 
} from 'lucide-react';
import { supabase } from "../../../lib/supabase";
import { toast } from 'react-hot-toast';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  fuel_type: string;
}

export default function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    engine: '',
    fuel_type: 'Essence'
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement de la base K-Type");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([formData]);

      if (error) throw error;

      toast.success(`${formData.make} ${formData.model} ajouté !`);
      setFormData({ ...formData, model: '', engine: '' }); // On garde la marque et l'année pour gagner du temps
      fetchVehicles();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!window.confirm("Supprimer ce modèle ? Cela impactera les compatibilités liées.")) return;
    
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      setVehicles(vehicles.filter(v => v.id !== id));
      toast.success("Modèle retiré");
    } catch (error) {
      toast.error("Erreur de suppression");
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    `${v.make} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* --- SECTION 1 : FORMULAIRE D'AJOUT RAPIDE --- */}
      <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Database size={120} className="text-blue-600" />
        </div>

        <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter mb-8 flex items-center gap-2">
          <Plus className="text-blue-600" size={20} /> Enregistrer un nouveau modèle
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
          <input 
            required placeholder="MARQUE (EX: TOYOTA)"
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-blue-600 transition-all"
            value={formData.make} onChange={e => setFormData({...formData, make: e.target.value.toUpperCase()})}
          />
          <input 
            required placeholder="MODÈLE (EX: RAV4)"
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-blue-600 transition-all"
            value={formData.model} onChange={e => setFormData({...formData, model: e.target.value.toUpperCase()})}
          />
          <input 
            required type="number" placeholder="ANNÉE"
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:border-blue-600 transition-all"
            value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
          />
          <select 
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none cursor-pointer"
            value={formData.fuel_type} onChange={e => setFormData({...formData, fuel_type: e.target.value})}
          >
            <option value="Essence">Essence</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybride">Hybride</option>
            <option value="Electrique">Électrique</option>
          </select>

          <button 
            disabled={isSubmitting}
            className="bg-slate-900 text-white rounded-2xl font-[1000] text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Ajouter"}
          </button>
        </form>
      </div>

      {/* --- SECTION 2 : LISTE & RECHERCHE --- */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-4">
          <div>
            <h3 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Référentiel K-Type</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total : {vehicles.length} modèles actifs</p>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" placeholder="RECHERCHER UN MODÈLE..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm focus:border-blue-600 transition-all"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interrogation de la base...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-20 text-center">
            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun véhicule trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredVehicles.map(v => (
              <div key={v.id} className="bg-white border border-slate-50 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Car size={20} />
                  </div>
                  <button 
                    onClick={() => deleteVehicle(v.id)}
                    className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{v.make}</p>
                <h4 className="text-lg font-[1000] text-slate-900 uppercase italic tracking-tighter leading-tight mb-4">
                  {v.model}
                </h4>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.year}</span>
                  <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg tracking-widest">
                    {v.fuel_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}