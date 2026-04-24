import { useState, useEffect } from 'react';
import { Battery, Zap, ShieldCheck, ShoppingCart, Filter, Loader2, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore'; // 🟢 Pour vérifier si c'est l'admin
import { supabase } from '../lib/supabase'; // 🟢 Import de Supabase
import { toast } from 'react-hot-toast';

const CATEGORIES = ["Toutes", "Standard", "Start & Stop", "Haute Performance"];

export default function Batteries() {
  const { user } = useAuthStore();
  const [batteries, setBatteries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Toutes");
  
  const addToCart = useCartStore((state) => state.addToCart);
  const openCart = useCartStore((state) => state.openCart);

  // 🟢 FETCH INITIAL ET REALTIME
  useEffect(() => {
    fetchBatteries();

    // Abonnement aux changements en temps réel
    const channel = supabase
      .channel('realtime-batteries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batteries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBatteries(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setBatteries(prev => prev.filter(b => b.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setBatteries(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBatteries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('batteries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) toast.error("Erreur de chargement");
    else setBatteries(data || []);
    setLoading(false);
  };

  // 🟢 SUPPRESSION (Réservé au Super Admin)
  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette batterie ?")) return;
    
    const { error } = await supabase.from('batteries').delete().eq('id', id);
    if (error) toast.error("Erreur de suppression");
    else toast.success("Batterie retirée");
  };

  const filteredBatteries = activeCategory === "Toutes" 
    ? batteries 
    : batteries.filter(b => b.type === activeCategory);

  const handleAddToCart = (battery: any) => {
    addToCart({
      id: battery.id,
      name: battery.name,
      price: battery.price,
      quantity: 1,
      image_url: battery.image_url,
      brand: battery.brand
    });
    toast.success(`${battery.name} ajouté`);
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      
      {/* HEADER PREMIUM */}
      <div className="bg-slate-900 text-white pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="flex items-center gap-3 text-orange-500 font-black uppercase tracking-widest text-[10px] mb-4">
            <Zap className="w-4 h-4" /> Énergie Certifiée
          </div>
          <h1 className="text-4xl sm:text-6xl font-[1000] italic tracking-tighter uppercase mb-4">
            Batteries <span className="text-blue-500">Premium</span>
          </h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-8">
        
        {/* FILTRES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 scrollbar-hide">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GRILLE PRODUITS */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBatteries.map((battery) => (
              <div key={battery.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 group hover:shadow-2xl transition-all relative overflow-hidden">
                
                {/* 🔴 BOUTON SUPPRIMER : Visible seulement pour l'Admin */}
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => handleDelete(battery.id)}
                    className="absolute top-4 right-4 z-20 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {battery.brand}
                  </span>
                </div>

                <div className="h-48 mb-6 bg-slate-50 rounded-[1.5rem] p-4">
                  <img src={battery.image_url || 'https://placehold.co/400'} alt={battery.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Capacité</p>
                    <p className="text-sm font-black text-slate-900">{battery.capacity}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Démarrage</p>
                    <p className="text-sm font-black text-slate-900">{battery.cca}</p>
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-900 leading-tight uppercase mb-4">{battery.name}</h3>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <p className="text-xl font-black text-slate-900 tracking-tighter">
                    {battery.price.toLocaleString('fr-FR')} <small className="text-[10px]">CFA</small>
                  </p>
                  <button 
                    onClick={() => handleAddToCart(battery)}
                    className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}