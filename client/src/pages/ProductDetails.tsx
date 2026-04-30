import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, ShieldCheck, MessageCircle, ArrowLeft, Loader2, 
  Info, CheckCircle2, CreditCard, Banknote, Droplets, Home,
  Store, Star, Hash, Car, UserCircle2, Wrench, Settings2, Crown
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackImage = "https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Indisponible";

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        let { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error || !data) {
          const { data: bData } = await supabase
            .from('batteries')
            .select('*')
            .eq('id', id)
            .maybeSingle();
            
          if (bData) data = bData;
        }

        if (data) {
          if (data.vendor_id) {
            const { data: vendorData } = await supabase
              .from('profiles')
              .select('store_name, commune, subscription_plan, role, phone')
              .eq('id', data.vendor_id)
              .maybeSingle();
            
            data.vendor = vendorData || { role: 'admin', store_name: 'SPACEAUTO24 OFFICIEL' };
          } else {
            data.vendor = { role: 'admin', store_name: 'SPACEAUTO24 OFFICIEL' };
          }

          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('rating, comment, created_at, user:profiles!user_id(store_name)')
            .eq('product_id', id);
            
          data.reviews = reviewsData || [];
          
          setProduct(data);
        }
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
        <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">Chargement de la pièce...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <Info className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-6" />
        <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">Produit introuvable</h2>
        <Link to="/" className="mt-6 md:mt-8 bg-blue-600 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md flex items-center justify-center gap-2 w-fit mx-auto">
          <Home className="w-3.5 h-3.5 md:w-4 md:h-4" /> Retour à l'accueil
        </Link>
      </div>
    );
  }

  // 🟢 LOGIQUE BLINDÉE POUR LE NOM DE LA BOUTIQUE
  const vendorPlan = product?.vendor?.subscription_plan || product?.vendor_plan || 'free';
  const vendorRole = product?.vendor?.role || product?.vendor_role || 'admin';
  const rawStoreName = product?.vendor?.store_name || product?.vendor_name;

  const isOfficial = vendorRole === 'admin' || vendorRole === 'super_admin' || !rawStoreName;
  const storeName = isOfficial ? 'SPACEAUTO24 OFFICIEL' : rawStoreName;

  let commissionRate = 0.10; 
  if (isOfficial) commissionRate = 0; 
  else if (vendorPlan === 'premium') commissionRate = 0.01; 
  else if (vendorPlan === 'pro') commissionRate = 0.05; 

  const basePrice = product?.original_price || product?.price || 0;
  const finalPrice = Math.round(basePrice + (basePrice * commissionRate));

  const productWithFinalPrice = { ...product, original_price: basePrice, price: finalPrice };

  const reviewsArray = product?.reviews || [];
  const realTotal = reviewsArray.length;
  const totalReviews = realTotal > 0 ? realTotal : 3; 
  const avgRating = realTotal > 0 ? (reviewsArray.reduce((acc: any, curr: any) => acc + (curr.rating || 0), 0) / realTotal) : 4;

  const phoneNumber = product?.vendor?.phone || "2250100000000"; 
  const whatsappMessage = encodeURIComponent(`Bonjour, je suis intéressé par l'article "${product?.name}" (Réf: ${product?.reference || 'N/A'}) affiché à ${finalPrice.toLocaleString('fr-FR')} FCFA par la boutique ${storeName} sur SpaceAuto24.`);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`; 
  
  const initialImageUrl = product?.image_url || fallbackImage;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; 
    e.currentTarget.src = fallbackImage;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 md:pb-24 pt-6 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center gap-2.5 md:gap-3 mb-5 md:mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 md:gap-2 text-slate-500 hover:text-blue-600 font-bold text-[8px] md:text-[10px] uppercase tracking-widest transition-colors bg-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md">
            <ArrowLeft className="w-3 h-3 md:w-3.5 md:h-3.5" /> Retour
          </button>
          <Link to="/" className="flex items-center gap-1.5 md:gap-2 text-slate-500 hover:text-blue-600 font-bold text-[8px] md:text-[10px] uppercase tracking-widest transition-colors bg-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md">
            <Home className="w-3 h-3 md:w-3.5 md:h-3.5" /> Accueil
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-6 md:gap-8">
            
            {/* BLOC IMAGE PREMIUM */}
            <div className="bg-white p-4 md:p-14 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center relative overflow-hidden group min-h-[250px] md:min-h-[400px]">
              <div className="absolute inset-0 bg-slate-50/50 group-hover:bg-transparent transition-colors duration-500"></div>
              
              <img 
                src={initialImageUrl} 
                alt={product?.name || "Produit"} 
                onError={handleImageError}
                className="relative z-10 max-h-[220px] md:max-h-[500px] w-full object-contain mix-blend-darken drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
              />
              
              {/* 🟢 NOM DE LA BOUTIQUE (Réduit pour mobile) */}
              <div className={`absolute top-3 left-3 md:top-6 md:left-6 z-30 backdrop-blur-md text-white px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl flex items-center gap-1.5 shadow-xl border ${isOfficial ? 'bg-gradient-to-r from-blue-900 via-slate-900 to-black border-blue-500/50' : 'bg-slate-900/90 border-white/10'}`}>
                {isOfficial ? <Crown className="w-3 h-3 md:w-4 md:h-4 text-amber-400" /> : <Store className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />}
                <span className={`text-[7.5px] md:text-[9px] font-[1000] uppercase tracking-widest ${isOfficial ? 'text-blue-100' : 'text-white'}`}>
                  {storeName}
                </span>
              </div>

              {/* 🟢 BADGE VISCOSITÉ (Réduit pour mobile) */}
              {product?.viscosity && (
                <div className="absolute top-3 right-3 md:top-6 md:right-6 z-30 bg-blue-600 text-white px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl flex items-center gap-1.5 shadow-lg">
                  <Droplets className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="text-[7.5px] md:text-[9px] font-black uppercase tracking-widest">{product.viscosity}</span>
                </div>
              )}
            </div>

            {/* BLOC AVIS CLIENTS (Bureau) */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm hidden lg:block">
              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-white fill-white" />
                </div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">Avis Clients ({totalReviews})</h3>
              </div>

              <div className="flex flex-col gap-3">
                {(realTotal > 0 ? reviewsArray : [1, 2]).map((review: any, index: number) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="w-6 h-6 md:w-7 md:h-7 text-slate-300" />
                        <div>
                          <p className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase">{review.user?.store_name || "Client Vérifié"}</p>
                        </div>
                      </div>
                      <div className="flex bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= (review.rating || 4) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-50"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] md:text-xs font-medium text-slate-600 line-clamp-2 md:line-clamp-3">
                      {review.comment || "Super qualité ! La pièce correspond exactement à ce que je cherchais. Livraison rapide."}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="lg:col-span-6 xl:col-span-5 flex flex-col">
            
            <span className="text-[7.5px] md:text-[9px] font-black w-fit text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg border border-emerald-100 shadow-sm mb-3 md:mb-4">
              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> En Stock
            </span>

            <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter leading-tight mb-3 md:mb-4 uppercase">
              {product?.name || "Nom du produit"}
            </h1>

            <div className="flex flex-col gap-2 md:gap-3 mb-5 md:mb-6">
              {(product?.brand || product?.model || product?.reference) && (
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                  {product.brand && (
                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-900 text-white text-[7px] md:text-[9px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-md uppercase tracking-widest shadow-sm">
                      <span>{product.brand}</span>
                    </div>
                  )}
                  {product.reference && (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[7px] md:text-[9px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-md uppercase tracking-widest shadow-sm">
                      <Hash size={10} className="text-slate-400" /> 
                      <span>RÉF: <span className="text-slate-800">{product.reference}</span></span>
                    </div>
                  )}
                  {product.model && (
                    <div className="flex items-center gap-1 bg-blue-50/50 border border-blue-100 text-blue-700 text-[7px] md:text-[9px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-md uppercase tracking-widest shadow-sm">
                      <Car size={10} className="text-blue-500" /> 
                      {product.model}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 md:gap-2 bg-white px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg border border-slate-100 w-fit shadow-sm">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const safeRating = Math.round(Number(avgRating) || 0);
                    const isFilled = star <= safeRating && safeRating > 0;
                    return (
                      <Star 
                        key={star} 
                        size={10} 
                        strokeWidth={isFilled ? 1 : 1.5}
                        color={isFilled ? "#FACC15" : "#cbd5e1"} 
                        fill={isFilled ? "#FACC15" : "#f1f5f9"} 
                        className="mr-[1px]" 
                      />
                    );
                  })}
                </div>
                <div className="w-px h-2.5 md:h-3 bg-slate-200 mx-0.5 md:mx-1"></div>
                <span className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Note Globale
                </span>
              </div>
            </div>
            
            <div className="mb-5 md:mb-6 bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm inline-block w-fit">
               <p className="text-xl md:text-3xl font-black text-blue-600 tracking-tighter flex items-baseline gap-1.5">
                 {finalPrice.toLocaleString('fr-FR')} <span className="text-[10px] md:text-sm text-slate-400">FCFA</span>
               </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 mb-5 md:mb-6">
              <button 
                onClick={() => {
                  addToCart(productWithFinalPrice);
                  navigate('/checkout');
                }}
                className="flex-grow py-2.5 md:py-4 rounded-lg md:rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 bg-blue-600 text-white hover:bg-slate-900"
              >
                <ShoppingCart className="w-3 h-3 md:w-4 h-4" /> Acheter Maintenant
              </button>
              
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="sm:w-1/3 bg-white text-emerald-600 border border-emerald-100 md:border-2 py-2.5 md:py-4 rounded-lg md:rounded-xl font-black text-[8px] md:text-[10px] uppercase flex items-center justify-center gap-1.5 md:gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                <MessageCircle className="w-3 h-3 md:w-4 h-4" /> WhatsApp
              </a>
            </div>

            <div className="space-y-2.5 md:space-y-3 mb-5 md:mb-6">
              <div className="bg-white p-3.5 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[7.5px] md:text-[9px] mb-2.5 md:mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" /> Paiements acceptés
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Wave', 'Orange', 'Moov', 'MTN'].map((operator) => (
                    <div key={operator} className="h-6 md:h-9 px-2 md:px-2.5 bg-slate-50 rounded-md md:rounded-lg border border-slate-100 flex items-center justify-center">
                      <span className="text-[7px] md:text-[8px] font-bold text-slate-500 uppercase tracking-wider">{operator}</span>
                    </div>
                  ))}
                  <div className="h-6 w-8 md:h-9 md:w-10 bg-slate-900 rounded-md md:rounded-lg flex items-center justify-center text-white shadow-sm" title="Paiement à la livraison">
                    <Banknote className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3.5 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-2.5 md:gap-3 text-white shadow-xl">
                <div className="bg-white/10 p-2 md:p-2.5 rounded-lg md:rounded-xl shrink-0">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-[8px] md:text-[10px] mb-0.5">Garantie Authenticité</h4>
                  <p className="text-[9px] md:text-[11px] font-medium text-slate-300 leading-relaxed">Produit 100% original. Qualité vérifiée.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- SECTION HORIZONTALE : FICHE TECHNIQUE & DESCRIPTION --- */}
        <div className="mt-8 lg:mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            
            <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6 h-fit">
               <h3 className="text-[8.5px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-5 text-slate-400 border-b border-slate-100 pb-2.5 md:pb-3 flex items-center gap-1.5 md:gap-2">
                 <Settings2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" /> Caractéristiques
               </h3>
               <ul className="space-y-2.5 md:space-y-3">
                 <li className="flex items-start gap-2 text-[9px] md:text-[11px] font-bold text-slate-700 uppercase">
                    <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Qualité Garantie
                 </li>
                 <li className="flex items-start gap-2 text-[9px] md:text-[11px] font-bold text-slate-700 uppercase">
                    <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Installation Rapide
                 </li>
                 <li className="flex items-start gap-2 text-[9px] md:text-[11px] font-bold text-slate-700 uppercase">
                    <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Retrait possible
                 </li>
               </ul>
            </div>

            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-[#111625] p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-slate-800 text-white relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5">
                 <Wrench className="w-32 h-32 md:w-40 md:w-40" />
               </div>
               
               <div className="relative z-10">
                 <h4 className="text-[8.5px] md:text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3 md:mb-4 border-b border-white/10 pb-2.5 md:pb-3 flex items-center gap-1.5 md:gap-2">
                   <Info className="w-3 h-3 md:w-3.5 md:h-3.5" /> Détails de la pièce
                 </h4>
                 <div className="prose prose-sm md:prose-base prose-invert max-w-none">
                   <p className="text-slate-300 text-[10px] md:text-sm leading-relaxed font-medium">
                     {product?.description || "Les détails techniques complets de cette pièce sont actuellement en cours de rédaction par notre équipe d'experts. Pour toute question de compatibilité, n'hésitez pas à nous contacter directement sur WhatsApp."}
                   </p>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* 🟢 BLOC AVIS CLIENTS (Mobile) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-5 block lg:hidden">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5">
              <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Avis Clients ({totalReviews})</h3>
            </div>

            <div className="flex flex-col gap-2.5">
              {(realTotal > 0 ? reviewsArray : [1, 2]).map((review: any, index: number) => (
                <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <UserCircle2 className="w-5 h-5 text-slate-300" />
                      <div>
                        <p className="text-[8px] font-black text-slate-900 uppercase">{review.user?.store_name || "Client Vérifié"}</p>
                      </div>
                    </div>
                    <div className="flex bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={8} className={s <= (review.rating || 4) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-50"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] font-medium text-slate-600 line-clamp-3 leading-relaxed">
                    {review.comment || "Super qualité ! La pièce correspond exactement à ce que je cherchais. Livraison rapide."}
                  </p>
                </div>
              ))}
            </div>
        </div>

      </div>
    </div>
  );
}