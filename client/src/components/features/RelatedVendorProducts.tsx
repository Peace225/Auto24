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
        // Logique de récupération (inchangée)
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
        setProducts(finalProducts);
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchRelated();
  }, [vendorId, currentProductId, category]);

  if (isLoading) return <div className="mt-8 flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-600/50" /></div>;
  if (products.length === 0) return null;

  return (
    <div className="mt-8 lg:mt-12 border-t border-slate-200 pt-6 lg:pt-8 font-sans">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">{sectionTitle}</h3>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sélection SpaceAuto24</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((item) => {
          const profileInfo = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          const isOfficial = ['admin', 'super_admin'].includes(profileInfo?.role) || !item.vendor_id;
          const storeName = isOfficial ? 'OFFICIEL' : (profileInfo?.store_name?.slice(0, 8) || 'PARTENAIRE');
          const finalPrice = getPublicPrice(item.price || 0);
          const safe_stock = item.stock ?? item.stock_quantity ?? 0;
          const isOutOfStock = safe_stock <= 0;
          const compatibility_text = Array.isArray(item.compatibility) ? item.compatibility.join(', ') : (item.compatibility || '');

          return (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              onClick={() => window.scrollTo(0, 0)}
              className="min-w-[160px] md:min-w-[200px] bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all snap-start flex flex-col overflow-hidden"
            >
              <div className="h-[120px] bg-slate-50 relative p-3 flex items-center justify-center border-b border-slate-100">
                <img src={item.image_url || fallbackImage} alt={item.name} className="max-h-full w-full object-contain" />
                <div className={`absolute top-2 left-2 text-[7px] font-black px-1.5 py-0.5 rounded text-white ${isOfficial ? 'bg-blue-900' : 'bg-slate-900'}`}>
                  {storeName}
                </div>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p className="text-[10px] font-black text-slate-900 uppercase line-clamp-2 leading-tight mb-2">
                  {item.name}
                </p>

                <div className="flex flex-col gap-1 mb-3 mt-auto bg-slate-50 p-2 rounded-lg text-[9px]">
                  {item.model && <div className="flex items-center gap-1"><Car size={9} className="text-blue-500"/> {item.model}</div>}
                  {item.year && <div className="flex items-center gap-1"><Calendar size={9} className="text-emerald-500"/> {item.year}</div>}
                  {item.reference && <div className="flex items-center gap-1"><Hash size={9} className="text-amber-500"/> {item.reference}</div>}
                  {compatibility_text && <div className="flex items-center gap-1 truncate"><Wrench size={9} className="text-slate-400"/> {compatibility_text}</div>}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-blue-600">{finalPrice.toLocaleString('fr-FR')}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">CFA</span>
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