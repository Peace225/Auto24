import { useEffect, useState } from 'react';
import { Loader2, Flame, Tag, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../../utils/pricing';

export default function BlackFridayPromo() {
  const addToCart = useCartStore((state) => state.addToCart);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Image de secours en cas de problème
  const fallbackImage = "https://placehold.co/300x300?text=Image+Indisponible";
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = fallbackImage;
  };

  const loadPromoProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles!products_vendor_id_fkey (store_name, role)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(item => {
        const vendorProfile = Array.isArray(item.vendor) ? item.vendor[0] : item.vendor;
        const isAdmin = vendorProfile?.role === 'admin' || vendorProfile?.role === 'super_admin';
        
        // --- LOGIQUE D'IMAGE INFAILLIBLE ---
        let img = item.image_url; // On cherche d'abord dans image_url
        
        // Si image_url est vide, on cherche dans le tableau "images"
        if (!img && item.images) {
          try {
            const parsed = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
            if (Array.isArray(parsed) && parsed.length > 0) {
              img = parsed[0];
            }
          } catch (e) {
            // Erreur de parsing, on ignore
          }
        }

        // On nettoie les guillemets résiduels si c'est une chaîne
        if (typeof img === 'string') {
          img = img.replace(/^["']|["']$/g, '');
        }

        // Si vraiment on n'a rien trouvé, on met le fallback
        if (!img || img === 'null' || img.trim() === '') {
          img = fallbackImage;
        }
        // ------------------------------------

        const normalPrice = Number(item.price) || 0;
        const promoPrice = Number(item.promo_price) || 0; 
        
        let discountPercent = 0;
        if (promoPrice > 0 && promoPrice < normalPrice) {
          discountPercent = Math.round(((normalPrice - promoPrice) / normalPrice) * 100);
        }

        return { 
          ...item, 
          normal_price: getPublicPrice(normalPrice),
          final_price: getPublicPrice(promoPrice > 0 ? promoPrice : normalPrice), 
          discount: discountPercent,
          image: img, 
          vendor_name: isAdmin ? 'SPACEAUTO' : (vendorProfile?.store_name || 'Boutique')
        };
      });

      // On filtre pour ne garder que les produits avec une vraie réduction
      const validPromos = formatted.filter(p => p.discount > 0).slice(0, 10);
      setProducts(validPromos);

    } catch (e: any) { 
      console.error("Erreur de chargement:", e);
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { 
    loadPromoProducts(); 
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10 text-red-600" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 px-4">
        <p className="font-bold text-lg">Aucune promotion en cours !</p>
        <p className="text-sm mt-2">Les produits avec un "promo_price" inférieur au prix normal apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <section className="py-6 px-4">
      <div className="max-w-6xl mx-auto bg-[#0F172A] rounded-3xl shadow-xl overflow-hidden border border-slate-800">
        
        <div className="bg-gradient-to-r from-red-600 to-red-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-1.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]">
              <Flame className="text-red-600 fill-red-600" size={20} />
            </div>
            <h2 className="font-black text-white text-lg md:text-xl uppercase tracking-widest">
              Black Friday <span className="text-yellow-400">Deals</span>
            </h2>
          </div>
          <span className="hidden sm:flex bg-black/40 text-yellow-400 text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase items-center gap-1.5 border border-yellow-400/20">
            <Tag size={12} /> Quantité Limitée
          </span>
        </div>

        <div className="p-4 md:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map(p => (
            <div key={p.id} className="group relative bg-white rounded-2xl p-2.5 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all duration-300 flex flex-col border-2 border-transparent hover:border-red-500">
              
              {p.discount > 0 && (
                <div className="absolute -top-2 -right-2 z-10 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg transform rotate-3">
                  -{p.discount}%
                </div>
              )}
              
              <Link to={`/product/${p.id}`} className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
                {/* L'image est maintenant protégée avec onError */}
                <img src={p.image} onError={handleImageError} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" alt={p.name} />
              </Link>

              <div className="px-1 flex flex-col flex-1">
                <div className="text-[10px] text-slate-400 uppercase font-black mb-1 truncate">{p.vendor_name}</div>
                <h3 className="text-xs font-bold text-slate-800 line-clamp-2 mb-2 leading-tight">{p.name}</h3>
                
                <div className="mt-auto">
                  <div className="flex flex-col mb-3">
                    <span className="font-black text-lg text-red-600 leading-none">
                      {p.final_price.toLocaleString()} <span className="text-[10px]">FCFA</span>
                    </span>
                    {p.discount > 0 && (
                      <span className="text-[11px] text-slate-400 line-through font-medium mt-0.5">
                        {p.normal_price.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => { 
                      addToCart({...p, price: p.final_price}); 
                      toast.success('Ajouté au panier !', { icon: '🛒' }); 
                    }}
                    className="w-full py-2 bg-slate-900 text-white text-[11px] font-black uppercase rounded-xl hover:bg-red-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart size={14} />
                    Profiter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}