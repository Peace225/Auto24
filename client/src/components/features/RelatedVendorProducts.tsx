import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
// 🟢 Ajout des icônes Hash et Car
import { ChevronLeft, ChevronRight, Store, Crown, Loader2, Hash, Car } from 'lucide-react';
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
    <div className="mt-8 lg:mt-12 border-t border-slate-200 pt-6 lg:pt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">{sectionTitle}</h3>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sélection SpaceAuto24 & Partenaires</p>
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

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pt-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((item) => {
          const profileInfo = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          const role = profileInfo?.role || 'admin';
          const isOfficial = role === 'admin' || role === 'super_admin' || !item.vendor_id;
          const storeName = isOfficial ? 'OFFICIEL' : (profileInfo?.store_name?.slice(0, 10) || 'PARTENAIRE');
          
          const basePrice = item.price || 0;
          const finalPrice = item.final_price || getPublicPrice(basePrice);

          return (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              onClick={() => window.scrollTo(0, 0)}
              className="min-w-[155px] md:min-w-[210px] max-w-[155px] md:max-w-[210px] h-auto bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 snap-start group flex flex-col overflow-hidden relative shrink-0"
            >
              <div className="h-[110px] md:h-[130px] bg-slate-50 relative p-3 flex items-center justify-center border-b border-slate-100 shrink-0">
                <img src={item.image_url || fallbackImage} alt={item.name} className="max-h-full w-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-500" />
                
                <div className={`absolute top-2 left-2 backdrop-blur-md text-white px-2 py-0.5 rounded shadow-md flex items-center gap-1 border ${isOfficial ? 'bg-blue-900/90 border-blue-500/50' : 'bg-slate-900/90 border-white/10'}`}>
                  {isOfficial ? <Crown size={9} className="text-amber-400" /> : <Store size={9} className="text-blue-400" />}
                  <span className="text-[7px] font-[1000] uppercase tracking-widest">{storeName}</span>
                </div>
              </div>

              <div className="p-3 flex flex-col flex-1 bg-white">
                {/* 🟢 MARQUE (Badge miniature) */}
                {item.brand && (
                  <span className="text-[7px] font-black text-blue-600 uppercase mb-1 bg-blue-50 w-fit px-1.5 py-0.5 rounded border border-blue-100">
                    {item.brand}
                  </span>
                )}

                <p className="text-[10px] md:text-[11px] font-bold text-slate-900 uppercase line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </p>

                {/* 🟢 MODÈLE & RÉFÉRENCE (Petite ligne technique) */}
                <div className="flex flex-col gap-0.5 mb-3">
                  {item.model && (
                    <div className="flex items-center gap-1 text-[7px] md:text-[8px] text-slate-500 font-bold uppercase">
                      <Car size={8} className="text-slate-300" /> {item.model}
                    </div>
                  )}
                  {item.reference && (
                    <div className="flex items-center gap-1 text-[7px] md:text-[8px] text-slate-500 font-bold uppercase">
                      <Hash size={8} className="text-slate-300" /> {item.reference}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-2 border-t border-slate-50">
                  {basePrice !== finalPrice && (
                    <span className="text-[7px] text-slate-300 line-through font-bold">
                      {basePrice.toLocaleString('fr-FR')}
                    </span>
                  )}
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-xs md:text-sm font-black text-slate-900 tracking-tight italic">
                      {finalPrice.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-[7px] font-black text-blue-600 uppercase">CFA</span>
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