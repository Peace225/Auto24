import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Store, Crown, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

        // 1. Priorité : produits du même vendeur
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

        // 2. Fallback OBLIGATOIRE : même catégorie si 0-1 produit vendeur
        if (finalProducts.length < 2 && category) {
          const { data: categoryProducts } = await supabase
            .from('products')
            .select('*, profiles!products_vendor_id_fkey(store_name, role)')
            .eq('category', category)
            .neq('id', currentProductId)
            .limit(12);

          if (categoryProducts) {
            // Évite doublons + complète jusqu'à 12
            const existingIds = new Set(finalProducts.map(p => p.id));
            const newProducts = categoryProducts.filter(p => !existingIds.has(p.id));
            finalProducts = [...finalProducts, ...newProducts].slice(0, 12);
            if (finalProducts.length > 1) setSectionTitle('Pièces similaires');
          }
        }

        // 3. Fallback ultime : produits récents si toujours vide
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

  // Auto-scroll seulement si > 1 produit
  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const isEnd = scrollLeft + clientWidth >= scrollWidth - 10;
        scrollRef.current.scrollTo({
          left: isEnd ? 0 : scrollLeft + 216, // Adapté à la nouvelle largeur des cartes
          behavior: 'smooth'
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 216; // Adapté à la nouvelle largeur des cartes
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
            <button
              onClick={() => scroll('left')}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm"
            >
              <ChevronLeft size={16} className="text-slate-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm"
            >
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
          // Sécurisation de l'objet profile si Supabase renvoie un tableau ou un objet simple
          const profileInfo = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          const role = profileInfo?.role || 'admin';
          const store = profileInfo?.store_name;
          
          const isOfficial = role === 'admin' || role === 'super_admin' || !item.vendor_id;
          const fullStoreName = isOfficial ? 'SPACEAUTO24' : (store || 'Partenaire');
          
          // Badge coupé s'il est trop long pour ne pas casser le design
          const storeName = fullStoreName.length > 12 ? fullStoreName.slice(0, 10) + '...' : fullStoreName;
          const price = item.final_price || item.price || 0;

          return (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              onClick={() => window.scrollTo(0, 0)} // Remonte en haut de page au clic
              // 🟢 DIMENSIONS FIXES ICI pour l'uniformité
              className="min-w-[150px] md:min-w-[200px] max-w-[150px] md:max-w-[200px] h-[240px] md:h-[260px] bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 snap-start group flex flex-col overflow-hidden relative shrink-0"
            >
              {/* 🟢 HAUTEUR FIXE POUR LE CONTENEUR D'IMAGE */}
              <div className="h-[120px] md:h-[140px] bg-slate-50 relative p-3 flex items-center justify-center border-b border-slate-100 shrink-0">
                <img
                  src={item.image_url || fallbackImage}
                  alt={item.name}
                  className="max-h-[100px] md:max-h-[120px] w-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* 🟢 BADGE BOUTIQUE AJUSTÉ */}
                <div className={`absolute top-2 left-2 backdrop-blur-md text-white px-2 py-1 rounded shadow-md flex items-center gap-1 border ${isOfficial ? 'bg-gradient-to-r from-blue-900 to-black border-blue-500/50' : 'bg-slate-900/90 border-white/10'}`}>
                  {isOfficial ? <Crown size={10} className="text-amber-400" /> : <Store size={10} className="text-blue-400" />}
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">{storeName}</span>
                </div>
              </div>

              {/* 🟢 CONTENEUR DE TEXTE QUI S'ÉTIRE */}
              <div className="p-3 md:p-4 flex flex-col flex-1 justify-between bg-white">
                <p className="text-[10px] md:text-[11px] font-bold text-slate-900 uppercase line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                  {item.name}
                </p>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-baseline gap-1">
                  <span className="text-sm md:text-base font-black text-blue-600 tracking-tight">
                    {price.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">CFA</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}