import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, ShieldCheck, MessageCircle, ArrowLeft, Loader2,
  Info, CheckCircle2, Home, Store, Star, UserCircle2, Crown, 
  PenLine, X, Tag, Heart, ChevronDown, ChevronUp, Settings, 
  Wrench // Ajout de l'icône Wrench pour la compatibilité
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';
import RelatedVendorProducts from '../components/features/RelatedVendorProducts';
import { getPublicPrice } from '../utils/pricing';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const fallbackImage = "https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Indisponible";
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = fallbackImage; };

  const fetchProduct = async () => {
    if (!id) return; 
    setIsLoading(true);
    try {
      let { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      
      if (!data) { 
        const { data: b } = await supabase.from('batteries').select('*').eq('id', id).maybeSingle(); 
        data = b; 
      }
      
      if (data) {
        const { data: v } = await supabase.from('profiles').select('store_name,role,phone').eq('id', data.vendor_id).maybeSingle();
        data.vendor = v || { role: 'admin', store_name: 'SPACEAUTO24 OFFICIEL' };
        
        const { data: r } = await supabase.from('reviews').select('rating,comment,created_at,profiles(store_name)').eq('product_id', id).order('created_at', { ascending: false });
        data.reviews = r || []; 
        
        setProduct(data);
      }
    } catch (error) {
      console.error("Erreur chargement produit:", error);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return navigate('/login');
    const next = !isFavorite; 
    setIsFavorite(next);
    try { 
      next ? await supabase.from('favorites').insert({ user_id: user.id, product_id: id }) 
           : await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id); 
    } catch { 
      setIsFavorite(!next); 
    }
  };

  const handleSubmitReview = async () => {
    if (!user) return navigate('/login'); 
    if (!reviewComment.trim()) return;
    
    setIsSubmittingReview(true);
    await supabase.from('reviews').insert({ product_id: id, user_id: user.id, rating: reviewRating, comment: reviewComment.trim() });
    
    setShowReviewModal(false); 
    setReviewComment(''); 
    setReviewRating(5); 
    await fetchProduct(); 
    setIsSubmittingReview(false);
  };

  useEffect(() => { 
    supabase.auth.getUser().then(({ data }) => setUser(data.user)); 
    fetchProduct(); 
  }, [id]);

  useEffect(() => { 
    (async () => { 
      if(!user || !id) return; 
      const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('product_id', id).maybeSingle(); 
      setIsFavorite(!!data); 
    })(); 
  }, [user, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2"/>
        <p className="text-sm font-bold uppercase text-slate-400">Chargement...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <Info className="w-10 h-10 mx-auto text-slate-300 mb-2"/>
        <h2 className="font-black uppercase">Produit introuvable</h2>
        <Link to="/" className="mt-3 inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase">
          <Home size={14}/>Accueil
        </Link>
      </div>
    );
  }

  const isOfficial = ['admin','super_admin'].includes(product?.vendor?.role) || !product.vendor_id;
  const storeName = isOfficial ? 'SPACEAUTO24 OFFICIEL' : product.vendor?.store_name;
  const isNew = product?.condition?.toLowerCase() === 'neuf' || product?.is_new;
  const finalPrice = getPublicPrice(product?.original_price || product?.price || 0);
  const productWithFinalPrice = {...product, price: finalPrice};
  const reviewsArray = product?.reviews || [];
  const displayCategory = product?.category || product?.type || 'PIÈCE AUTO';
  const whatsappUrl = `https://wa.me/${product?.vendor?.phone||"2250100000000"}?text=${encodeURIComponent(`Bonjour, "${product.name}" à ${finalPrice.toLocaleString()} FCFA`)}`;
  
  const fullDescription = product?.description || product?.details || "";
  const canExpand = fullDescription.length > 150;

  // On sépare la vérification : Caractéristiques classiques vs Compatibilité
  const hasSpecs = product.brand || product.model || product.reference || product.oem_reference;
  const hasCompatibility = product.compatibility;

  const ReviewsSection = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h3 className="text-sm font-black uppercase">Avis Clients ({reviewsArray.length})</h3>
        <button onClick={()=>setShowReviewModal(true)} className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
          <PenLine size={12}/>Rédiger
        </button>
      </div>
      {reviewsArray.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2 text-center">Aucun avis pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {reviewsArray.slice(0, 3).map((r: any, i: number)=>(
            <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[11px] font-bold uppercase flex items-center gap-1 text-slate-700">
                  <UserCircle2 size={14} className="text-slate-400"/>
                  {r.profiles?.store_name || 'Client'}
                </p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s=><Star key={s} size={10} fill={s<=(r.rating||4)?"#FACC15":"none"} className={s<=(r.rating||4)?"text-amber-400":"text-slate-200"}/>)}
                </div>
              </div>
              <p className="text-sm text-slate-600">{r.comment || 'Conforme à la description.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-10 pt-4">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* NAVIGATION */}
        <div className="flex justify-between mb-4">
          <button onClick={()=>navigate(-1)} className="flex items-center gap-1.5 text-sm font-bold uppercase bg-white px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={14}/>Retour
          </button>
          <button onClick={handleToggleFavorite} className={`flex items-center gap-1.5 text-sm font-bold uppercase px-3 py-2 rounded-lg border transition-colors ${isFavorite?'bg-red-50 text-red-600 border-red-200':'bg-white text-slate-500 border-slate-200'}`}>
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"}/>
            {isFavorite ? 'Retirer' : 'Favoris'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLONNE GAUCHE */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 relative flex items-center justify-center min-h-[300px] shadow-sm">
              <img src={product.image_url || fallbackImage} onError={handleImageError} alt={product.name} className="max-h-[400px] object-contain"/>
              <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-black uppercase text-white flex items-center gap-1 border shadow-sm ${isOfficial ? 'bg-blue-900 border-blue-500/50' : 'bg-slate-900'}`}>
                {isOfficial ? <Crown size={12}/> : <Store size={12}/>}{storeName}
              </div>
            </div>

            <div className="hidden lg:block">
              <ReviewsSection />
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Titre et Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircle2 size={10}/>Disponible</span>
                {isNew && <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">Neuf</span>}
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 flex items-center gap-1"><Tag size={10}/>{displayCategory}</span>
              </div>
              <h1 className="text-xl font-black uppercase leading-tight text-slate-900">{product.name}</h1>
            </div>

            {/* Prix */}
            <div className="bg-white p-4 rounded-xl border-2 border-blue-50 shadow-sm">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-blue-600">{finalPrice.toLocaleString('fr-FR')}</span>
                <span className="text-sm font-bold text-slate-400 uppercase">FCFA</span>
              </div>
            </div>

            {/* BLOC 1 : SPÉCIFICATIONS TECHNIQUES */}
            {hasSpecs && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                  <Settings size={14}/> Caractéristiques
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {product.brand && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-medium text-slate-500">Marque</span>
                      <span className="text-xs font-black uppercase text-slate-800">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-medium text-slate-500">Modèle</span>
                      <span className="text-xs font-bold text-slate-800">{product.model}</span>
                    </div>
                  )}
                  {(product.reference || product.oem_reference) && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-medium text-slate-500">Référence</span>
                      <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{product.reference || product.oem_reference}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BLOC 2 : COMPATIBILITÉ */}
            {hasCompatibility && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                  <Wrench size={14}/> Compatibilité
                </h3>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {product.compatibility}
                  </p>
                  {product.year && (
                    <div className="inline-flex items-center gap-1.5 self-start bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100 mt-1">
                      <span>Année :</span>
                      <span>{product.year}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions (Panier / WhatsApp) */}
            <div className="space-y-2">
              <button onClick={() => { addToCart(productWithFinalPrice); navigate('/checkout'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200">
                <ShoppingCart size={18}/>Acheter maintenant
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="bg-white border-2 border-emerald-100 hover:bg-emerald-50 text-emerald-600 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors">
                  <MessageCircle size={16}/>WhatsApp
                </a>
                <button onClick={handleToggleFavorite} className={`border-2 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors ${isFavorite ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  <Heart size={16} fill={isFavorite ? "currentColor" : "none"}/>Favoris
                </button>
              </div>
            </div>

            {/* Garantie */}
            <div className="bg-slate-900 p-4 rounded-xl text-white flex items-center gap-4 shadow-md">
              <div className="bg-white/10 p-2 rounded-lg"><ShieldCheck size={20} className="text-emerald-400"/></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Certification SpaceAuto</p>
                <h4 className="text-sm font-black uppercase">Produit Garanti</h4>
              </div>
            </div>

            {/* DESCRIPTION DU PRODUIT */}
            {fullDescription && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-2">Description Complète</h3>
                <div className="relative">
                  <div className={`text-sm leading-relaxed text-slate-600 whitespace-pre-line transition-all duration-300 ${!isDescExpanded && canExpand ? 'max-h-[120px] overflow-hidden' : 'max-h-none'}`}>
                    {fullDescription}
                  </div>
                  
                  {canExpand && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDescExpanded(!isDescExpanded);
                      }}
                      className="mt-3 w-full py-2 text-[11px] font-black text-blue-600 uppercase flex items-center justify-center gap-1 bg-blue-50 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      {isDescExpanded ? (
                        <>Voir moins <ChevronUp size={14}/></>
                      ) : (
                        <>Lire la suite <ChevronDown size={14}/></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Avis Mobile */}
            <div className="block lg:hidden mt-2">
              <ReviewsSection />
            </div>
          </div>
        </div>

        {/* PRODUITS SIMILAIRES */}
        <div className="mt-10 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
            <Tag className="text-blue-600" size={20}/>Produits suggérés
          </h2>
          <RelatedVendorProducts vendorId={product?.vendor_id} currentProductId={product?.id} category={displayCategory}/>
        </div>
      </div>

      {/* MODAL AVIS */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase text-slate-800">Donner votre avis</h3>
              <button onClick={()=>setShowReviewModal(false)} className="p-1.5 bg-slate-100 rounded-full hover:bg-slate-200">
                <X size={18}/>
              </button>
            </div>
            <div className="flex gap-2 mb-6 justify-center">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={()=>setReviewRating(s)} className="transform hover:scale-110 transition-transform">
                  <Star size={32} fill={s <= reviewRating ? "#FACC15" : "none"} className={s <= reviewRating ? "text-amber-400" : "text-slate-200"}/>
                </button>
              ))}
            </div>
            <textarea 
              value={reviewComment} 
              onChange={e => setReviewComment(e.target.value)} 
              rows={4} 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-6 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Votre expérience avec ce produit..."
            />
            <button 
              onClick={handleSubmitReview} 
              disabled={isSubmittingReview} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold uppercase shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              Publier mon avis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}