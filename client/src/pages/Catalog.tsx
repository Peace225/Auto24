import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ShoppingCart, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';
import { productService } from '../services/productService'; 
import { getPublicPrice } from '../utils/pricing'; 
import type { Product } from '../types';

// Import local pour les images qui ne sont pas des URL
const allImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const CATALOG_CATEGORIES = [
  "Outillage & Atelier", "Pneumatiques", "Huiles & Filtration",
  "Pièces moteur", "Injection", "Turbo",
  "Direction / Suspension / Train", "Freinage", "Distribution et Accessoires", 
  "Embrayage et Boîte de vitesse", "Démarrage électrique", "Optiques / Phares / Ampoules", 
  "Capteurs et Sondes", "Essuie-glaces et pièces", "Echappement", 
  "Carrosserie / Vitres / Peinture", "Pièces Habitacle", "Joints et Étanchéité", 
  "Chauffage et Climatisation"
];

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeCategory = searchParams.get('category') || 'Toutes les pièces';
  const searchTerm = searchParams.get('searchTerm') || '';
  
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getProducts({
          searchTerm: searchTerm.trim() !== '' ? searchTerm : undefined
        }); 
        setProducts(data || []);
      } catch (error) {
        console.error("Erreur chargement catalogue:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, [searchTerm]);

  // Fonction corrigée : Priorité aux URL, fallback aux assets
  const getImageUrl = (p: Product) => {
    // 1. Si c'est déjà une URL (Supabase Storage), on la retourne telle quelle
    if (p.image_url?.startsWith('http')) return p.image_url;

    // 2. Sinon, on cherche dans les assets locaux
    if (p.image_url) {
      const searchName = p.image_url.toLowerCase().trim();
      const imagePath = Object.keys(allImages).find(path => 
        path.toLowerCase().split('/').pop() === searchName
      );
      if (imagePath) return allImages[imagePath];
    }

    // 3. Sinon placeholder
    return `https://placehold.co/400x400/f8fafc/2563eb?text=${p.brand || 'Piece'}`;
  };

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'Toutes les pièces') newParams.delete('category');
    else newParams.set('category', category);
    setSearchParams(newParams);
  };

  const filteredProducts = useMemo(() => {
    if (searchTerm) return products;
    return products.filter(product => {
      const prod = product as any;
      const prodCat = (prod.categories?.name || prod.category || "").toLowerCase().trim();
      const activeCat = activeCategory.toLowerCase().trim();
      return activeCategory === 'Toutes les pièces' || prodCat.includes(activeCat);
    });
  }, [products, activeCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <div className="bg-slate-900 py-12 px-6 border-b border-slate-800">
        <div className="max-w-[1440px] mx-auto text-white">
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {searchTerm ? `Résultats pour : "${searchTerm}"` : activeCategory}
          </h1>
          <p className="text-blue-400 font-bold mt-2">{filteredProducts.length} produit(s) trouvé(s)</p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-10 flex gap-8">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-28">
            <h3 className="font-black text-xs uppercase mb-4 text-slate-900">Catégories</h3>
            <div className="flex flex-col gap-1">
              {['Toutes les pièces', ...CATALOG_CATEGORIES].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => handleCategoryChange(cat)}
                  className={`text-left text-[10px] font-black uppercase px-4 py-3 rounded-xl transition ${activeCategory === cat ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 text-blue-600" /></div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl p-5 border border-slate-100 flex flex-col group shadow-sm hover:shadow-xl transition-shadow">
                  <Link to={`/product/${p.id}`} className="h-40 flex items-center justify-center">
                    <img 
                      src={getImageUrl(p)} 
                      className="h-full object-contain" 
                      alt={p.name} 
                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=Erreur')}
                    />
                  </Link>
                  <h3 className="text-xs font-black uppercase mt-4 line-clamp-2">{p.name}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-lg font-black italic">{getPublicPrice(p.price || 0).toLocaleString()} CFA</span>
                    <button onClick={() => addToCart({ ...p, price: getPublicPrice(p.price || 0) })} className="p-3 bg-slate-900 text-white rounded-2xl"><ShoppingCart size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="font-black uppercase">Aucun produit trouvé.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}