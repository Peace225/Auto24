import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, ShieldCheck, MessageCircle, ArrowLeft, Loader2, 
  Info, CheckCircle2, CreditCard, Banknote, Droplets, Gauge, Home 
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCartStore } from '../store/useCartStore';
import type { Product } from '../types';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Image de secours
  const fallbackImage = "https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Indisponible";

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

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Chargement de la pièce...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <Info className="w-16 h-16 text-slate-300 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Produit introuvable</h2>
        <Link to="/" className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md flex items-center justify-center gap-2">
          <Home className="w-4 h-4" /> Retour à l'accueil
        </Link>
      </div>
    );
  }

  // ⚠️ N'oublie pas de mettre ton vrai numéro WhatsApp ici
  const whatsappUrl = `https://wa.me/22500000000?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${product.name} (${product.price} FCFA)`)}`; 
  
  const initialImageUrl = product.image_url || fallbackImage;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; 
    e.currentTarget.src = fallbackImage;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* 🟢 BARRE DE NAVIGATION (Retour & Accueil) */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest transition-colors bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest transition-colors bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md">
            <Home className="w-4 h-4" /> Accueil
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- BLOC IMAGE PREMIUM --- */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="bg-white p-8 md:p-14 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center relative overflow-hidden group h-full min-h-[400px]">
              {/* Fond très léger pour le contraste */}
              <div className="absolute inset-0 bg-slate-50/50 group-hover:bg-transparent transition-colors duration-500"></div>
              
              <img 
                src={initialImageUrl as string} 
                alt={product.name} 
                onError={handleImageError}
                className="relative z-10 max-h-[400px] md:max-h-[500px] w-full object-contain mix-blend-darken drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
              />
              
              {product.viscosity && (
                <div className="absolute top-6 left-6 z-20 bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                  <Droplets className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{product.viscosity}</span>
                </div>
              )}
            </div>
          </div>

          {/* --- BLOC INFOS & ACHAT --- */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center">
            <div className="mb-6 flex items-center flex-wrap gap-3">
              <span className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-sm">
                {product.brand}
              </span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" /> En Stock
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-6 uppercase">
              {product.name}
            </h1>
            
            <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm inline-block w-fit">
               <p className="text-4xl md:text-5xl font-black text-blue-600 tracking-tighter flex items-baseline gap-2">
                 {product.price.toLocaleString()} <span className="text-base text-slate-400">FCFA</span>
               </p>
            </div>

            {/* --- GRILLE TECHNIQUE (Ex: Viscosité) --- */}
            {product.viscosity && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg"><Gauge className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Viscosité</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{product.viscosity}</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- BOUTONS D'ACTION --- */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button 
                onClick={() => {
                  addToCart(product);
                  navigate('/checkout');
                }}
                className="flex-grow py-5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all active:scale-95 bg-blue-600 text-white hover:bg-slate-900"
              >
                <ShoppingCart className="w-5 h-5" /> Acheter Maintenant
              </button>
              
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="sm:w-1/3 bg-white text-emerald-600 border-2 border-emerald-100 py-5 rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            </div>

            {/* --- REASSURANCE (Paiement & Garantie) --- */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[9px] mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Moyens de paiement acceptés
                </h4>
                <div className="flex gap-3">
                  {['Wave', 'Orange', 'Moov', 'MTN'].map((operator) => (
                    <div key={operator} className="h-10 px-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{operator}</span>
                    </div>
                  ))}
                  <div className="h-10 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm title='Paiement à la livraison'">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl flex items-center gap-4 text-white shadow-xl">
                <div className="bg-white/10 p-3 rounded-xl shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-[10px] mb-1">Garantie Authenticité</h4>
                  <p className="text-[11px] font-medium text-slate-300 leading-relaxed">Produit 100% original. Qualité vérifiée par nos experts.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- DESCRIPTION DÉTAILLÉE --- */}
        <div className="mt-16 border-t border-slate-200 pt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Info className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Fiche Technique</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-4">Description du produit</h4>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                  {product.description || "Les détails techniques complets de cette pièce sont actuellement en cours de rédaction par notre équipe d'experts."}
                </p>
             </div>

             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 h-fit">
               <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-slate-400 border-b border-slate-100 pb-4">Points Forts</h3>
               <ul className="space-y-4">
                 <li className="flex items-start gap-3 text-[11px] font-bold text-slate-700 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Compatibilité universelle
                 </li>
                 <li className="flex items-start gap-3 text-[11px] font-bold text-slate-700 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Haute durabilité
                 </li>
                 <li className="flex items-start gap-3 text-[11px] font-bold text-slate-700 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Installation simplifiée
                 </li>
               </ul>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}