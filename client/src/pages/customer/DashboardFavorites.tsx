import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, HeartCrack, ShoppingCart, Trash2, Tag, ArrowRight, Store, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';

export default function DashboardFavorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const addToCart = useCartStore((state) => state.addToCart);

  const fallbackImage = "https://placehold.co/400x300/f8fafc/94a3b8?text=Image+Indisponible";

  const fetchFavorites = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          product_id,
          products!inner (
            id,
            name,
            price,
            image_url,
            vendor:profiles!vendor_id (
              id,
              store_name,
              subscription_plan,
              role,
              commune
            )
          )
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error.message);
        toast.error("Erreur chargement favoris");
        throw error;
      }

      const formattedFavorites = (data || []).map(fav => {
        const product = fav.products;
        if (!product) return null;

        const vendor = product.vendor;
        const vendorPlan = vendor?.subscription_plan || 'free';
        const vendorRole = vendor?.role || 'vendor';

        let commissionRate = 0.10;
        if (vendorRole === 'admin') commissionRate = 0;
        else if (vendorPlan === 'premium') commissionRate = 0.01;
        else if (vendorPlan === 'pro') commissionRate = 0.05;

        const basePrice = product.price || 0;
        const finalPrice = Math.round(basePrice + (basePrice * commissionRate));

        return {
          ...product,
          final_price: finalPrice,
          original_price: basePrice,
          vendor_name: vendor?.store_name || 'Boutique Partenaire',
          vendor_plan: vendorPlan,
          vendor_role: vendorRole,
          vendor_commune: vendor?.commune
        };
      }).filter(prod => prod != null && prod.id != null);

      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Erreur favoris:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let channel: any;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchFavorites(user.id);
        channel = supabase
          .channel('realtime_favorites')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            if (payload.eventType === 'DELETE') {
              setFavorites(prev => prev.filter(p => p.id !== payload.old.product_id));
            } else {
              fetchFavorites(user.id);
            }
          })
          .subscribe();
      } else {
        setIsLoading(false);
      }
    };
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const removeFavorite = async (productId: string) => {
    if (!userId) return;
    setFavorites(prev => prev.filter(p => p.id !== productId));
    const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
    if (error) {
      toast.error("Erreur suppression");
      fetchFavorites(userId);
    }
  };

  const VendorBadge = ({ name, role }: { name: string, role: string }) => {
    if (role === 'admin' || role === 'super_admin') return (
      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20 bg-gradient-to-r from-blue-900 to-slate-900 text-blue-400 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[6px] md:text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-xl border border-blue-500/20 backdrop-blur-md">
        <CheckCircle2 size={8} className="text-blue-400 md:w-2.5 md:h-2.5" /> OFFICIEL
      </div>
    );
    return (
      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20 bg-white/95 backdrop-blur-md text-slate-700 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[6px] md:text-[8px] font-black uppercase tracking-wider border border-slate-200 shadow-sm flex items-center gap-1">
        <Store size={8} className="text-blue-600 md:w-2.5 md:h-2.5" />
        <span className="truncate max-w-[40px] md:max-w-[80px]">{name}</span>
      </div>
    );
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-10 md:py-20 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
      <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement des favoris...</p>
    </div>
  );

  if (favorites.length === 0) return (
    <div className="bg-white rounded-xl md:rounded-2xl border-2 border-dashed border-slate-100 p-8 md:p-12 text-center shadow-sm">
      <HeartCrack size={32} className="text-slate-200 mx-auto mb-3 md:w-10 md:h-10 md:mb-4" />
      <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase mb-1.5">Liste vide</h3>
      <p className="text-[8px] md:text-[10px] text-slate-400 uppercase mb-6">Vous n'avez aucune pièce sauvegardée.</p>
      <Link to="/catalog" className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">
        Boutique <ArrowRight size={12} className="md:w-3.5 md:h-3.5" />
      </Link>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
      {favorites.map((product) => (
        <div key={product.id} className="bg-white rounded-xl md:rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col group h-full">
          
          {/* 🟢 ZONE IMAGE (Réduite sur mobile) */}
          <div className="relative h-28 md:h-48 bg-slate-50 flex items-center justify-center p-3 md:p-6 overflow-hidden">
            <VendorBadge name={product.vendor_name} role={product.vendor_role} />
            <img 
              src={product.image_url || fallbackImage} 
              className="max-h-full w-auto object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-700" 
              alt={product.name} 
            />
          </div>

          {/* 🟢 ZONE CONTENU (Paddings réduits sur mobile) */}
          <div className="p-2.5 md:p-5 flex flex-col flex-1">
            <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
              <span className="text-[6px] md:text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-1.5 md:px-2 py-0.5 rounded md:rounded-md border border-blue-100 flex items-center gap-1 truncate max-w-[80px] md:max-w-none">
                <Tag size={6} className="md:w-2 md:h-2 shrink-0" /> {product.vendor_commune || 'Abidjan'}
              </span>
            </div>

            <h3 className="text-[9px] md:text-[11px] font-bold text-slate-900 uppercase line-clamp-2 leading-snug mb-1 md:mb-2 h-7 md:h-8">
              {product.name}
            </h3>
            
            <p className="text-[7px] md:text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-2 md:mb-4 truncate">
              Par <span className="text-slate-600">{product.vendor_name}</span>
            </p>

            <div className="mt-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-2 md:gap-2">
              <div className="flex flex-col">
                {product.original_price !== product.final_price && (
                  <span className="text-[7px] md:text-[9px] text-slate-400 line-through font-bold mb-0 md:mb-0.5">
                    {product.original_price.toLocaleString()} CFA
                  </span>
                )}
                <span className="text-xs md:text-sm font-[1000] text-slate-900 tracking-tighter italic uppercase">
                  {(product.final_price || 0).toLocaleString()} <span className="text-[7px] md:text-[9px] text-blue-600 not-italic">CFA</span>
                </span>
              </div>
              
              {/* 🟢 BOUTONS D'ACTION (Plus compacts sur mobile) */}
              <div className="flex gap-1 md:gap-2 w-full lg:w-auto">
                <button 
                  onClick={() => removeFavorite(product.id)} 
                  className="p-1.5 md:p-2.5 bg-red-50 text-red-500 rounded-lg md:rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-90"
                  title="Supprimer"
                >
                  <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                </button>
                <button 
                  onClick={() => addToCart(product)} 
                  className="flex-1 lg:flex-none flex items-center justify-center p-1.5 md:p-2.5 bg-slate-900 text-white rounded-lg md:rounded-xl hover:bg-blue-600 transition-all duration-300 shadow-lg active:scale-95"
                  title="Ajouter au panier"
                >
                  <ShoppingCart size={12} className="md:w-3.5 md:h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}