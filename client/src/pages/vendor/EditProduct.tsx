import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2, Package, Car } from 'lucide-react';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) {
        toast.error("Erreur de chargement");
        navigate('/vendor/products');
      } else {
        setFormData(data);
      }
      setIsFetching(false);
    };
    fetchProduct();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          price: parseFloat(formData.price),
          condition: formData.condition,
          description: formData.description,
          oem_reference: formData.oem_reference,
          stock: parseInt(formData.stock),
          vehicle_model: formData.vehicle_model,
          year: formData.year
        })
        .eq('id', id);

      if (error) throw error;
      toast.success("Produit mis à jour avec succès !");
      navigate('/vendor/products');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="min-h-screen flex items-center justify-center bg-[#020305]"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-[#020305] text-slate-200 pb-20 p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white"><ArrowLeft size={18} /> Retour</button>
      
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* SECTION INFORMATIONS GÉNÉRALES */}
        <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <h3 className="text-sm font-bold text-blue-500 uppercase flex items-center gap-2"><Package size={16} /> Informations Générales</h3>
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Nom du produit" />
          <div className="grid md:grid-cols-2 gap-4">
            <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Marque" />
            <input value={formData.oem_reference} onChange={e => setFormData({...formData, oem_reference: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Référence OEM" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Prix" />
            <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Stock" />
          </div>
        </section>

        {/* SECTION COMPATIBILITÉ */}
        <section className="bg-[#0A0E14] border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <h3 className="text-sm font-bold text-blue-500 uppercase flex items-center gap-2"><Car size={16} /> Compatibilité</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Modèle véhicule" />
            <input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Année" />
          </div>
          <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-[#05070B] border border-white/10 rounded-2xl outline-none" placeholder="Description détaillée..." />
        </section>

        <button type="submit" disabled={isLoading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-bold text-lg hover:bg-blue-500 transition-all">
          {isLoading ? "Enregistrement..." : "Sauvegarder les modifications"}
        </button>
      </form>
    </div>
  );
}