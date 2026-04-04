import { useState, useEffect } from 'react';
import { 
  Wrench, Battery, Disc, Settings, 
  Shield, Loader2, ShoppingCart, ArrowRight 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import type { Product } from '../types'; 

// 1. Import de la bannière
import bannerImage from '../assets/tools/banniere.jpg';

// 2. Indexation des images locales
const toolImages = import.meta.glob('../assets/tools/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  import: 'default'
}) as Record<string, string>;

// Configuration des catégories avec Slugs pour la navigation
const toolCategories = [
  { 
    id: 'vidange', 
    title: 'Vidange & Fluides', 
    slug: 'vidange-fluides',
    icon: <Wrench className="w-6 h-6" />, 
    links: ['Lot vidange', 'Clé filtre', 'Pompe transfert'] 
  },
  { 
    id: 'direction', 
    title: 'Direction & Suspension', 
    slug: 'direction-suspension',
    icon: <Settings className="w-6 h-6" />, 
    links: ['Extracteur rotule', 'Compresseur ressort', 'Kit roulements'] 
  },
  { 
    id: 'freinage', 
    title: 'Système Freinage', 
    slug: 'systeme-freinage',
    icon: <Disc className="w-6 h-6" />, 
    links: ['Repousse piston', 'Purgeur frein', 'Douille étrier'] 
  },
  { 
    id: 'batteries', 
    title: 'Électricité & Batteries', 
    slug: 'electricite-batteries',
    icon: <Battery className="w-6 h-6" />, 
    links: ['Booster démarrage', 'Chargeur', 'Testeur'] 
  },
];

export default function Tools() {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTools = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`*, categories!inner(*)`)
          .eq('categories.section', 'outillage')
          .limit(10);

        if (error) throw error;
        // Correction doublons : on remplace l'état actuel, on ne l'ajoute pas
        setTopProducts(data || []); 
      } catch (error) {
        console.error("Erreur de chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTools();
  }, []);

  const getToolImage = (imageName: string | undefined) => {
    if (!imageName) return null;
    const cleanName = imageName.split('/').pop()?.toLowerCase();
    const matchingKey = Object.keys(toolImages).find(key => 
      key.toLowerCase().includes(cleanName || "")
    );
    return matchingKey ? toolImages[matchingKey] : null;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      
      {/* BANNIÈRE HERO */}
      <section className="relative bg-slate-900 border-b border-slate-800 py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImage} 
            className="w-full h-full object-cover opacity-30" 
            alt="Atelier" 
            onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 text-left">
             <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Shield className="w-4 h-4" /> Qualité Professionnelle
             </div>
             <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase">
                L'Outillage <br /> <span className="text-blue-500">Expert.</span>
             </h1>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-6 py-12">
        
        {/* GRILLE DES PRODUITS (TOP VENTES) */}
        <section className="mb-24">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10">Matériel Plébiscité</h2>
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {topProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-5 hover:shadow-xl transition-all group flex flex-col">
                  <Link to={`/product/${product.id}`} className="block relative">
                    <div className="w-full aspect-square bg-slate-50 rounded-[2rem] mb-4 flex items-center justify-center p-6 overflow-hidden">
                       <img 
                        src={getToolImage(product.image_url) || `https://placehold.co/400x400?text=${product.name}`} 
                        className="max-h-full w-auto object-contain group-hover:scale-110 transition-transform duration-500" 
                        alt={product.name}
                       />
                    </div>
                  </Link>
                  <div className="flex-grow px-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase mb-1 block">{product.brand}</span>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight mb-4">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between mt-auto px-2 pt-4 border-t border-slate-50">
                    <p className="text-lg font-black text-slate-900">{product.price?.toLocaleString()} <small className="text-[10px]">FCFA</small></p>
                    <button onClick={() => addToCart(product)} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-blue-600 transition-colors"><ShoppingCart className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION CATÉGORIES (FONCTIONNELLE) */}
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10">Parcourir par Univers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {toolCategories.map((category) => (
            <div key={category.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:border-blue-200 transition-all flex flex-col group">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {category.icon}
              </div>
              
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl mb-6">
                {category.title}
              </h3>

              <ul className="space-y-4 mb-8 flex-grow">
                {category.links.map((link, i) => (
                  <li key={i}>
                    {/* Lien vers la page de catégorie avec un paramètre de recherche spécifique */}
                    <Link 
                      to={`/category/${category.slug}?search=${encodeURIComponent(link)}`}
                      className="text-[11px] font-bold text-slate-500 hover:text-blue-600 cursor-pointer flex items-center gap-3 uppercase tracking-widest transition-colors"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100" /> 
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>

              <Link 
                to={`/category/${category.slug}`}
                className="w-full py-4 bg-slate-900 text-white text-center rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group"
              >
                Voir tout <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}