import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, ShieldCheck, MessageCircle, ArrowLeft, Loader2, 
  Info, CheckCircle2, CreditCard, Banknote, Droplets, Gauge 
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCartStore } from '../store/useCartStore';
import type { Product } from '../types';

// 🟢 DÉTECTEUR D'IMAGES GLOBAL (Assets, Oils, Logos)
const allImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  import: 'default'
}) as Record<string, string>;

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Trouve l'image en cherchant le nom du fichier dans tous les dossiers assets
  const getImageUrl = (filename: string | undefined) => {
    if (!filename) return 'https://placehold.co/600x400?text=Image+Indisponible';
    const cleanName = filename.toLowerCase().split('/').pop()?.split('.')[0];
    const imagePath = Object.keys(allImages).find(path => 
      path.toLowerCase().includes(cleanName || "___none___")
    );
    return imagePath ? allImages[imagePath] : 'https://placehold.co/600x400?text=Image+Indisponible';
  };

  // Pour les logos de paiement
  const getLogoUrl = (keyword: string) => {
    const path = Object.keys(allImages).find(p => p.toLowerCase().includes(keyword.toLowerCase()));
    return path ? allImages[path] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Chargement des données...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Info className="w-16 h-16 text-slate-200 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-900 uppercase">Produit introuvable</h2>
        <button onClick={() => navigate(-1)} className="mt-6 text-blue-600 font-bold flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/2250102030405?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${product.name} (${product.price} FCFA)`)}`;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Retour au catalogue
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- BLOC IMAGE --- */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
            <img 
              src={getImageUrl(product.image_url)} 
              alt={product.name} 
              className="max-h-[500px] w-full object-contain hover:scale-105 transition-transform duration-700" 
            />
            {product.viscosity && (
              <div className="absolute top-6 left-6 bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                <Droplets className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">{product.viscosity}</span>
              </div>
            )}
          </div>

          {/* --- BLOC INFOS --- */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center flex-wrap gap-3">
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                {product.brand}
              </span>
              {product.in_stock && (
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Produit Disponible
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4 uppercase">
              {product.name}
            </h1>
            
            <div className="mb-8">
               <p className="text-5xl font-black text-slate-900 tracking-tighter">
                 {product.price.toLocaleString()} <span className="text-lg">FCFA</span>
               </p>
            </div>

            {/* --- GRILLE TECHNIQUE (HUILES / PNEUS) --- */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {product.viscosity && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg"><Gauge className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Viscosité</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{product.viscosity}</p>
                  </div>
                </div>
              )}
              {product.capacity && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg"><Droplets className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Contenance</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{product.capacity} Litres</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button 
                onClick={() => addToCart(product)}
                disabled={!product.in_stock}
                className="flex-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 bg-slate-900 text-white hover:bg-blue-600 shadow-xl transition-all active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" /> Ajouter au panier
              </button>
              
              <a href={whatsappUrl} target="_blank" className="flex-1 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 py-5 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            </div>

            {/* PAIEMENT SECURISE */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-6">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[9px] mb-5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" /> Paiement sécurisé CI
              </h4>
              <div className="flex gap-4">
                {['wave', 'orange', 'moov', 'mtn'].map((operator) => (
                  <div key={operator} className="h-10 w-14 bg-slate-50 rounded-lg border border-slate-100 p-2 flex items-center justify-center">
                    <img src={getLogoUrl(operator) || ''} alt={operator} className="max-h-full object-contain grayscale hover:grayscale-0 transition-all" />
                  </div>
                ))}
                <div className="h-10 w-14 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-5 rounded-[2rem] flex items-start gap-4 text-white shadow-lg shadow-blue-200">
              <ShieldCheck className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-black uppercase tracking-widest text-[9px] mb-1">Garantie Authenticité</h4>
                <p className="text-[10px] font-bold opacity-80 leading-relaxed">Produit 100% original. Nos experts vérifient chaque bidon/pneu avant livraison.</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- DESCRIPTION --- */}
        <div className="mt-16">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter border-b-4 border-blue-600 pb-2 w-fit mb-8">Informations Techniques</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                  {product.description || "Détails techniques en cours de rédaction."}
                </p>
                
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                  {product.spec && (
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase font-black mb-1">Normes & Specs</span>
                      <span className="text-slate-900 font-black text-xs uppercase bg-slate-50 px-3 py-1 rounded-lg">{product.spec}</span>
                    </div>
                  )}
                  {product.oem_reference && (
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase font-black mb-1">Référence</span>
                      <span className="text-slate-900 font-black text-xs uppercase">{product.oem_reference}</span>
                    </div>
                  )}
                </div>
             </div>

             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white h-fit shadow-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-blue-400">Recommandé pour</h3>
               <ul className="space-y-4">
                 <li className="flex items-center gap-3 text-[11px] font-black uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Essence & Diesel
                 </li>
                 <li className="flex items-center gap-3 text-[11px] font-black uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Haute Protection
                 </li>
                 <li className="flex items-center gap-3 text-[11px] font-black uppercase opacity-60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Économie Carburant
                 </li>
               </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}