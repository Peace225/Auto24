import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Pencil, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

// Composant pour gérer le carousel d'images par produit
const ImageCarousel = ({ images }: { images: string[] | null }) => {
  const [index, setIndex] = useState(0);
  const safeImages = images || [];
  
  if (safeImages.length === 0) return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700 text-xs">No image</div>;

  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((prev) => (prev + 1) % safeImages.length); };
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length); };

  return (
    <div className="relative w-full h-full group">
      <img src={safeImages[index]} alt="Product" className="w-full h-full object-cover" />
      {safeImages.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">❮</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">❯</button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {safeImages.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function VendorProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorPlan, setVendorPlan] = useState<'standard' | 'pro' | 'premium'>('standard');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();

      const plan = (profile?.subscription_plan || 'standard').toLowerCase();
      setVendorPlan(plan === 'pro' || plan === 'premium' ? plan : 'standard');

      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .or(`vendor_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(productsData || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    loadData(); 

    if (!user) return;

    // 🟢 BRANCHEMENT DU CANAL REALTIME SUR LA TABLE 'PRODUCTS'
    const channel = supabase
      .channel(`vendor-products-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Écoute absolute (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'products',
          // Filtre optionnel si ta colonne Supabase s'appelle exactement vendor_id
          filter: `vendor_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Changement détecté par Supabase Realtime:', payload);
          
          // Gestion granulaire de l'état local pour éviter un spinner de chargement agressif
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
            toast.success('Mise à jour synchronisée en direct', { icon: '🔄' });
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id === payload.old.id));
          }
        }
      )
      .subscribe();

    // 🟢 Nettoyage de l'abonnement lorsque le composant est démonté
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ? Cette action est définitive.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Produit supprimé');
      // Le filtre ici reste une sécurité, bien que le Realtime s'occupe déjà de le retirer
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const productLimit = vendorPlan === 'premium' ? Infinity : vendorPlan === 'pro' ? 50 : 10;
  const isLimitReached = products.length >= productLimit;

  return (
    <div className="min-h-screen bg-[#020305] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative mb-8 bg-[#080A0F]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-black text-white">Catalogue ({products.length})</h1>
          <button 
            onClick={() => isLimitReached ? toast.error("Limite atteinte") : navigate('/vendor/products/new')} 
            className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition"
          >
            <Plus size={18} /> Nouveau produit
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-slate-500">Aucun produit trouvé.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-[#0A0E14] border border-white/[0.08] rounded-3xl p-4 flex flex-col h-full">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-black">
                  <ImageCarousel images={p.images} />
                </div>
                
                <h3 className="font-bold text-white mb-1 truncate">{p.name}</h3>
                
                <div className="text-xs text-slate-400 space-y-1 mb-4 flex-grow">
                  <p>Stock: <span className="text-white">{p.stock || 0}</span></p>
                  <p>Marque: {p.brand || 'N/A'}</p>
                  <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold uppercase ${p.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {p.status === 'approved' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {p.status === 'approved' ? 'Validé' : p.status === 'pending' ? 'En attente' : p.status || 'En attente'}
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-auto">
                  <p className="text-lg font-black text-white">{Number(p.price || 0).toLocaleString()} <span className="text-xs text-blue-500">FCFA</span></p>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/vendor/products/edit/${p.id}`)} className="p-2 bg-white/5 rounded-lg text-white hover:bg-blue-600 transition"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 bg-white/5 rounded-lg text-red-400 hover:bg-red-600 transition"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}