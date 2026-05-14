import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Package, TrendingUp, Crown, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function VendorProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorPlan, setVendorPlan] = useState<'standard' | 'pro' | 'premium'>('standard');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Récupérer le plan du vendeur
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();
      
      if (profile) setVendorPlan(profile.subscription_plan || 'standard');

      // 2. Récupérer les produits
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Produit supprimé');
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Logique de limitation (Exemple)
  const productLimit = vendorPlan === 'premium' ? Infinity : vendorPlan === 'pro' ? 50 : 10;
  const isLimitReached = products.length >= productLimit;

  // Style des badges selon le plan
  const planStyles = {
    standard: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    pro: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    premium: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  return (
    <div className="min-h-screen bg-[#020305] relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="relative mb-8">
          <div className="relative bg-[#080A0F]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Catalogue</h1>
                    <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${planStyles[vendorPlan]}`}>
                      {vendorPlan === 'premium' && <Crown size={12} />}
                      {vendorPlan === 'pro' && <ShieldCheck size={12} />}
                      {vendorPlan}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {products.length} / {productLimit === Infinity ? '∞' : productLimit} produits
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => isLimitReached ? toast.error("Limite de produits atteinte pour votre plan") : navigate('/vendor/products/new')}
                className={`group/btn relative ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {!isLimitReached && <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl blur opacity-70 group-hover/btn:opacity-100 transition" />}
                <div className="relative px-6 py-3 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2">
                  <Plus size={18} />
                  Nouveau produit
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm mt-4">Chargement de votre inventaire...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#080A0F]/40 border border-white/5 rounded-3xl p-16 text-center">
            <div className="inline-flex p-5 rounded-3xl bg-white/[0.02] mb-6">
              <Package className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucun produit</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Votre boutique est prête, il ne manque plus que vos articles.</p>
            <button onClick={() => navigate('/vendor/products/new')} className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:scale-105 transition">
              Créer mon premier produit
            </button>
          </div>
        ) : (
          /* GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="group relative bg-[#0A0E14] border border-white/[0.08] rounded-[2rem] p-3 hover:border-white/20 transition-all">
                <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-black mb-4">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900"><Package className="text-slate-700" /></div>
                  )}
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase">
                      {p.status || 'actif'}
                    </span>
                  </div>
                </div>

                <div className="px-2 pb-2">
                  <h3 className="font-bold text-white truncate mb-1">{p.name}</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Prix</p>
                      <p className="text-lg font-black text-white">
                        {Number(p.price).toLocaleString()} <span className="text-[10px] text-blue-500">FCFA</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2.5 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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