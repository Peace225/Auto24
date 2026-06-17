import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Store, Crown, Loader2, 
  Hash, Car, Calendar, Wrench, PackageCheck, AlertCircle 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getPublicPrice } from '../../utils/pricing';

interface RelatedVendorProductsProps {
  vendorId?: string | null;
  currentProductId: string;
  category?: string;
}

export default function RelatedVendorProducts({ vendorId, currentProductId, category }: RelatedVendorProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState('Pièces recommandées');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fallbackImage = "https://placehold.co/400x300/f8fafc/94a3b8?text=Image+Indisponible";

  useEffect(() => {
    const fetchRelated = async () => {
      if (!currentProductId) return;
      setIsLoading(true);
      try {
        let finalProducts: any[] = [];

        if (vendorId) {
          const { data: vendorProducts } = await supabase
            .from('products')
            .select('*, profiles!products_vendor_id_fkey(store_name, role)')
            .eq('vendor_id', vendorId)
            .neq('id', currentProductId)
            .limit(12);

          if (vendorProducts && vendorProducts.length > 0) {
            finalProducts = vendorProducts;
            setSectionTitle('Autres pièces du vendeur');
          }
        }

        if (finalProducts.length < 2 && category) {
          const { data: categoryProducts } = await supabase
            .from('products')
            .select('*, profiles!products_vendor_id_fkey(store_name, role)')
            .eq('category', category)
            .neq('id', currentProductId)
            .limit(12);

          if (categoryProducts) {
            const existingIds = new Set(finalProducts.map(p => p.id));
            const newProducts = categoryProducts.filter(p => !existingIds.has(p.id));
            finalProducts = [...finalProducts, ...newProducts].slice(0, 12);
            if (finalProducts.length > 1) setSectionTitle('Pièces similaires');
          }
        }

        if (finalProducts.length === 0) {
          const { data: recentProducts } = await supabase
            .from('products')
            .select('*, profiles!products_vendor_id_fkey(store_name, role)')
            .neq('id', currentProductId)
            .order('created_at', { ascending: false })
            .limit(12);

          if (recentProducts) {
            finalProducts = recentProducts;
            setSectionTitle('Vous pourriez aussi aimer');
          }
        }

        setProducts(finalProducts);
      } catch (err) {
        console.error('Erreur fetch related:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [vendorId, currentProductId, category]);

  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const isEnd = scrollLeft + clientWidth >= scrollWidth - 10;
        scrollRef.current.scrollTo({
          left: isEnd ? 0 : scrollLeft + 216,
          behavior: 'smooth'
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 216;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600/50" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-8 lg:mt-12 border-t border-slate-200 pt-6 lg:pt-8 font-sans">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">{sectionTitle}</h3>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sélection SpaceAuto24</p>
        </div>
        {products.length > 1 && (
          <div className="hidden md:flex gap-2">
            <button onClick={() => scroll('left')} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
              <ChevronLeft size={16} className="text-slate-700" />
            </button>
            <button onClick={() => scroll('right')} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
              <ChevronRight size={16} className="text-slate-700" />
            </button>
          </div>
        )}
      </div>

      {/* Le conteneur scrollable : optimisation mobile (snap-mandatory, scrollbar cachée) */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pt-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((item) => {
          // LOGIQUE DES PROFILS
          const profileInfo = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          const role = profileInfo?.role || 'admin';
          const isOfficial = role === 'admin' || role === 'super_admin' || !item.vendor_id;
          const storeName = isOfficial ? 'OFFICIEL' : (profileInfo?.store_name?.slice(0, 10) || 'PARTENAIRE');
          
          // LOGIQUE DES PRIX
          const basePrice = item.price || 0;
          const finalPrice = item.final_price || getPublicPrice(basePrice);

          // LOGIQUE DES DONNÉES TECHNIQUES
          const safe_reference = item.reference || item.oem_reference || '';
          const safe_model = item.model || item.vehicle_model || '';
          const safe_year = item.year || '';
          const safe_stock = item.stock !== undefined ? item.stock : (item.stock_quantity || 0);
          const safe_condition = item.condition || 'Neuf';
          
          const isOutOfStock = safe_stock <= 0;
          const isConditionNeuf = safe_condition.toLowerCase().includes('neuf');
          const compatibility_text = Array.isArray(item.compatibility) ? item.compatibility.join(', ') : (item.compatibility || '');

          return (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              onClick={() => window.scrollTo(0, 0)}
              // Dimensions ultra-réfléchies pour le mobile : 160px de large
              className="min-w-[160px] md:min-w-[220px] max-w-[160px] md:max-w-[220px] h-auto bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 snap-start group flex flex-col overflow-hidden relative shrink-0"
            >
              {/* IMAGE */}
              <div className="h-[120px] md:h-[140px] bg-slate-50 relative p-3 flex items-center justify-center border-b border-slate-100 shrink-0">
                <img src={item.image_url || fallbackImage} alt={item.name} className="max-h-full w-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-500" />
                
                <div className={`absolute top-2 left-2 backdrop-blur-md text-white px-2 py-0.5 rounded shadow-md flex items-center gap-1 border ${isOfficial ? 'bg-blue-900/90 border-blue-500/50' : 'bg-slate-900/90 border-white/10'}`}>
                  {isOfficial ? <Crown size={9} className="text-amber-400" /> : <Store size={9} className="text-blue-400" />}
                  <span className="text-[7px] font-[1000] uppercase tracking-widest">{storeName}</span>
                </div>
              </div>

              {/* CONTENU */}
              <div className="p-2.5 md:p-3 flex flex-col flex-1 bg-white">
                
                {/* BADGES : ÉTAT & STOCK */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className={`text-[7px] md:text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${isConditionNeuf ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {safe_condition}
                  </span>
                  <span className={`text-[7px] md:text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${isOutOfStock ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {isOutOfStock ? <AlertCircle size={8}/> : <PackageCheck size={8}/>}
                    {isOutOfStock ? 'Rupture' : `${safe_stock} Stock`}
                  </span>
                </div>

                {/* TITRE PRODUIT */}
                <p className="text-[11px] md:text-[12px] font-black text-slate-900 uppercase line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </p>

                {/* MINI-GRILLE DES CARACTÉRISTIQUES TECHNIQUES */}
                <div className="flex flex-col gap-1 mb-3 mt-auto bg-slate-50 p-1.5 md:p-2 rounded-lg border border-slate-100">
                  {safe_model && (
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] text-slate-600 font-medium truncate">
                      <Car size={10} className="text-blue-500 shrink-0" /> 
                      <span className="truncate font-bold uppercase">{safe_model}</span>
                    </div>
                  )}
                  {safe_year && (
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] text-slate-600 font-medium truncate">
                      <Calendar size={10} className="text-emerald-500 shrink-0" /> 
                      <span className="truncate font-bold">{safe_year}</span>
                    </div>
                  )}
                  {safe_reference && (
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] text-slate-600 font-medium truncate">
                      <Hash size={10} className="text-amber-500 shrink-0" /> 
                      <span className="truncate font-bold uppercase">{safe_reference}</span>
                    </div>
                  )}
                  {compatibility_text && (
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] text-slate-600 font-medium truncate">
                      <Wrench size={10} className="text-slate-400 shrink-0" /> 
                      <span className="truncate">{compatibility_text}</span>
                    </div>
                  )}
                </div>

                {/* PRIX */}
                <div className="mt-auto pt-2 border-t border-slate-100 flex flex-col">
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-sm md:text-base font-black text-blue-600 tracking-tight">
                      {finalPrice.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">FCFA</span>
                  </div>
                </div>
                
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}