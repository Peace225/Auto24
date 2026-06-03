import { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, MapPin, Filter, Loader2, 
  Store, CheckCircle2, Tag, Search, Star, Heart, 
  Hash, CarFront, ArrowRight, X 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const CATEGORIES = ['All', 'Moteur', 'Freinage', 'Suspension', 'Carrosserie', 'Électricité', 'Intérieur', 'Pneus & Jantes'];

// 🟢 SORTI DU COMPOSANT PRINCIPAL pour éviter les re-rendus inutiles
const VendorBadge = ({ name, role }: { name: string, role: string }) => {
  const isAdmin = role === 'admin' || role === 'super_admin';
  return (
    <div className={`absolute top-2 right-2 z-20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg text-[6px] md:text-[7px] font-black uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 shadow-sm
      ${isAdmin ? 'bg-blue-900/90 text-blue-400 border-blue-500/30' : 'bg-white/90 text-slate-700 border-slate-200'}`}>
      {isAdmin ? <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <Store className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-600" />}
      <span className="truncate max-w-[50px] md:max-w-[70px]">{name}</span>
    </div>
  );
};

export default function ShopCatalogue({ vehicleFilter, clearVehicleFilter }: { vehicleFilter?: any, clearVehicleFilter?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addToCart);

  const fallbackImage = "https://placehold.co/400x300/f8fafc/94a3b8?text=Image+Indisponible";

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles!vendor_id (id, store_name, subscription_plan, role, commune),
          reviews (rating)
        `)
        .eq('status', 'approved')
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts = (data || []).map(product => {
        const ratings = product.reviews || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((acc: number, r: any) => acc + r.rating, 0) / ratings.length 
          : 0;

        const vendorPlan = product.vendor?.subscription_plan || 'free';
        let rate = vendorPlan === 'premium' ? 0.01 : vendorPlan === 'pro' ? 0.05 : 0.10;
        if (product.vendor?.role === 'admin') rate = 0;

        return {
          ...product,
          final_price: Math.round(product.price * (1 + rate)),
          original_price: product.price,
          vendor_name: product.vendor?.store_name || 'Boutique Partenaire',
          vendor_role: product.vendor?.role || 'vendor',
          vendor_commune: product.vendor?.commune || 'Abidjan',
          avgRating,
          totalReviews: ratings.length
        };
      });

      setProducts(formattedProducts);
    } catch (error: any) {
      console.error(error.message);
      toast.error("Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (user) {
      supabase.from('favorites')
        .select('product_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) {
            setFavorites(data.map((f: any) => f.product_id));
          }
        });
    }
  }, [user]);

  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');

    const isFavorited = favorites.includes(productId);
    setFavorites(prev => isFavorited ? prev.filter(id => id !== productId) : [...prev, productId]);

    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      }
    } catch {
      toast.error("Erreur favoris");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.vendor_name && p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchVehicle = vehicleFilter && vehicleFilter.model
      ? (p.model && p.model.toLowerCase().includes(vehicleFilter.model.toLowerCase())) || 
        p.name.toLowerCase().includes(vehicleFilter.model.toLowerCase())
      : true;

    return matchCategory && matchSearch && matchVehicle;
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700">
      
      {/* BANNIÈRE VÉHICULE ACTIF */}
      {vehicleFilter && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50 border border-blue-100 p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] shadow-sm animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md shrink-0">
              <CarFront className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">
                Compatibilité garantie
              </p>
              <p className="text-[10px] md:text-[13px] font-[1000] text-blue-900 uppercase tracking-widest leading-tight">
                Pièces pour : {vehicleFilter.name || vehicleFilter.model}
              </p>
            </div>
          </div>
          <button
            onClick={clearVehicleFilter}
            className="flex items-center justify-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white text-red-500 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm w-full sm:w-auto active:scale-95"
          >
            <X size={12} /> Retirer le filtre
          </button>
        </div>
      )}

      {/* RECHERCHE & FILTRES */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="MARQUE, RÉFÉRENCE, MODÈLE..."
            className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-slate-50 border-none rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl text-[8px] md:text-[9px] font-[1000] uppercase tracking-widest transition-all whitespace-nowrap border ${
                filterCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
              }`}
            >
              {cat === 'All' ? 'Tout voir' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DE PRODUITS RESPONSIVE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 gap-3 md:gap-4">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-blue-600 animate-spin" />
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Recherche de pièces compatibles...</p>
        </div>
      ) : (
        <>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group relative h-full">
                  
                  <button 
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-2 left-2 z-30 p-2 md:p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-slate-100 active:scale-90 transition-transform"
                  >
                    <Heart size={12} className={`md:w-3.5 md:h-3.5 ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-slate-300"}`} />
                  </button>

                  <VendorBadge name={product.vendor_name} role={product.vendor_role} />

                  <Link to={`/product/${product.id}`} className="relative h-32 md:h-52 bg-slate-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    <img src={product.image_url || fallbackImage} className="max-h-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                  </Link>

                  <div className="p-3 md:p-6 flex flex-col flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-2">
                      <span className="text-[6px] md:text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 md:px-2 py-0.5 rounded-md border border-blue-100 self-start sm:self-auto">
                        {product.brand || 'Premium'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={8} className="md:w-2.5 md:h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[7px] md:text-[9px] font-black text-slate-700">{product.avgRating.toFixed(1)}</span>
                        <span className="text-[6px] md:text-[8px] font-bold text-slate-300">({product.totalReviews})</span>
                      </div>
                    </div>

                    <h3 className="text-[9px] md:text-[11px] font-[1000] text-slate-900 uppercase line-clamp-2 md:line-clamp-1 mb-1 leading-tight h-6 md:h-auto">{product.name}</h3>
                    
                    <div className="space-y-0.5 md:space-y-1 mb-3 md:mb-4">
                      <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <CarFront size={8} className="md:w-2.5 md:h-2.5 text-slate-300 shrink-0" /> <span className="hidden sm:inline">Modèle:</span> <span className="text-slate-600 truncate">{product.model || 'Standard'}</span>
                      </p>
                      <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Hash size={8} className="md:w-2.5 md:h-2.5 text-slate-300 shrink-0" /> <span className="hidden sm:inline">Réf:</span> <span className="text-slate-600 font-mono tracking-tighter truncate">{product.reference || 'REF-AUTO'}</span>
                      </p>
                    </div>

                    {/* 🟢 Le conteneur du prix : Retrait du prix barré et ajustement */}
                    <div className="mt-auto pt-3 md:pt-4 border-t border-slate-50 flex items-center justify-between">
                      <p className="text-[11px] sm:text-sm md:text-xl font-[1000] text-slate-900 italic tracking-tighter uppercase leading-none">
                        {product.final_price.toLocaleString()} <span className="text-[7px] md:text-[9px] text-blue-600 not-italic font-black">CFA</span>
                      </p>
                      <button 
                        onClick={() => { addToCart(product); toast.success("Ajouté au panier"); }}
                        className="p-2 md:p-3 bg-slate-900 text-white rounded-xl md:rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                      >
                        <ShoppingCart size={12} className="md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ETAT VIDE OPTIMISÉ POUR MOBILE */
            <div className="bg-white rounded-3xl md:rounded-[3rem] p-8 md:p-16 text-center border-2 border-dashed border-slate-100 flex flex-col items-center">
              <Package className="w-10 h-10 md:w-12 md:h-12 text-slate-200 mx-auto mb-3 md:mb-4" />
              <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-1 md:mb-2">Aucune pièce compatible</h3>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-sm">
                {vehicleFilter 
                  ? `Nous n'avons pas encore de pièces pour ${vehicleFilter.name} dans la catégorie ${filterCategory}.` 
                  : `Le catalogue est actuellement vide pour cette recherche.`}
              </p>
              {vehicleFilter && (
                <button 
                  onClick={clearVehicleFilter}
                  className="mt-4 md:mt-6 px-4 py-2.5 md:px-6 md:py-3 bg-blue-50 text-blue-600 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                >
                  Voir tout le catalogue
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}