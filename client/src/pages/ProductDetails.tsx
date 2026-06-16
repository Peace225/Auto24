import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, ShieldCheck, MessageCircle, ArrowLeft, Loader2,
  Info, CheckCircle2, Home, Store, Star, UserCircle2, Crown, 
  PenLine, X, Tag, Heart, ChevronDown, ChevronUp, Settings, 
  Wrench, AlertCircle, PackageCheck, Calendar, Shield, Hash, Car,
  Settings2, Eye, ShoppingBag
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
  const [activeImage, setActiveImage] = useState<string>('');

  // États pour le Social Proof
  const [socialViews, setSocialViews] = useState(0);
  const [socialPurchases, setSocialPurchases] = useState(0);

  const fallbackImage = "https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Indisponible";
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = fallbackImage; };

  // Fonction pour générer un nombre pseudo-aléatoire stable basé sur une chaîne (pour simuler des stats réalistes si la DB est vide)
  const generateStableNumber = (str: string, min: number, max: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.floor(Math.abs(hash) % (max - min + 1)) + min;
  };

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
        const { data: v } = await supabase.from('profiles').select('store_name,role,phone,subscription_plan').eq('id', data.vendor_id).maybeSingle();
        data.vendor = v || { role: 'admin', store_name: 'SPACEAUTO24 OFFICIEL', subscription_plan: 'premium' };
        
        const { data: r } = await supabase.from('reviews').select('rating,comment,created_at,profiles(store_name)').eq('product_id', id).order('created_at', { ascending: false });
        data.reviews = r || []; 
        
        // --- GESTION DES IMAGES ---
        let parsedImages: string[] = [];
        if (Array.isArray(data.images) && data.images.length > 0) parsedImages = data.images;
        else if (typeof data.images === 'string' && data.images.length > 5) {
          try { parsedImages = JSON.parse(data.images); if (!Array.isArray(parsedImages)) parsedImages = [data.images]; } 
          catch (e) { parsedImages = [data.images]; }
        }
        if (parsedImages.length === 0 && data.image_url) parsedImages = [data.image_url];
        if (parsedImages.length === 0) parsedImages = [fallbackImage];
        parsedImages = parsedImages.map(img => img.replace(/^["']|["']$/g, ''));

        const role = data.vendor?.role;
        const plan = (data.vendor?.subscription_plan || 'standard').toLowerCase();
        let maxAllowedImages = (role === 'admin' || role === 'super_admin' || plan === 'premium') ? 15 : (plan === 'pro' ? 6 : 3);

        data.displayImages = parsedImages.slice(0, maxAllowedImages);
        setActiveImage(data.displayImages[0]);
        setProduct(data);

        // --- SOCIAL PROOF LOGIC ---
        // Utilise les vraies données de Supabase si elles existent, sinon génère un nombre réaliste et stable
        setSocialViews(data.views_count || generateStableNumber(id + "views", 12, 187));
        setSocialPurchases(data.sales_count || generateStableNumber(id + "sales", 3, 42));
      }
    } catch (error) {
      console.error("Erreur chargement produit:", error);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return navigate('/login');
    const next = !isFavorite; setIsFavorite(next);
    try { 
      next ? await supabase.from('favorites').insert({ user_id: user.id, product_id: id }) 
           : await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id); 
    } catch { setIsFavorite(!next); }
  };

  const handleSubmitReview = async () => {
    if (!user) return navigate('/login'); 
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    await supabase.from('reviews').insert({ product_id: id, user_id: user.id, rating: reviewRating, comment: reviewComment.trim() });
    setShowReviewModal(false); setReviewComment(''); setReviewRating(5); 
    await fetchProduct(); setIsSubmittingReview(false);
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

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2"/><p className="text-sm font-bold uppercase text-slate-400">Chargement...</p></div>;
  if (!product) return <div className="py-12 text-center"><Info className="w-10 h-10 mx-auto text-slate-300 mb-2"/><h2 className="font-black uppercase">Produit introuvable</h2><Link to="/" className="mt-3 inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase"><Home size={14}/>Accueil</Link></div>;

  const isOfficial = ['admin','super_admin'].includes(product?.vendor?.role) || !product.vendor_id;
  const storeName = isOfficial ? 'SPACEAUTO24 OFFICIEL' : product.vendor?.store_name;
  const finalPrice = getPublicPrice(product?.original_price || product?.price || 0);
  const productWithFinalPrice = {...product, price: finalPrice};
  const reviewsArray = product?.reviews || [];
  const displayCategory = product?.category || product?.type || 'PIÈCE AUTO';
  
  // DONNÉES TECHNIQUES
  const safe_reference = product?.reference || product?.oem_reference || '';
  const safe_model = product?.model || product?.vehicle_model || '';
  const safe_year = product?.year || '';
  const safe_stock = product?.stock !== undefined ? product.stock : (product?.stock_quantity || 0);
  const safe_condition = product?.condition || 'Neuf';
  
  const isOutOfStock = safe_stock <= 0;
  const isConditionNeuf = safe_condition.toLowerCase().includes('neuf');
  const compatibility_text = Array.isArray(product?.compatibility) ? product.compatibility.join(', ') : (product?.compatibility || '');

  // SPEC_FIELDS DYNAMIQUES
  let specFields: Record<string, string> = {};
  if (product.spec_fields) {
    if (typeof product.spec_fields === 'string') {
      try { specFields = JSON.parse(product.spec_fields); } catch(e){}
    } else if (typeof product.spec_fields === 'object') {
      specFields = product.spec_fields;
    }
  }

  const hasDynamicSpecs = Object.keys(specFields).length > 0;
  const hasSpecs = product?.brand || safe_model || safe_reference || safe_year || hasDynamicSpecs;
  const hasCompatibility = compatibility_text.length > 0;
  const fullDescription = product?.description || product?.details || "";
  const canExpand = fullDescription.length > 150;

  const whatsappUrl = `https://wa.me/${product?.vendor?.phone||"2250100000000"}?text=${encodeURIComponent(`Bonjour, je suis intéressé par "${product.name}" (Réf: ${safe_reference || 'N/A'}) affiché à ${finalPrice.toLocaleString()} FCFA sur SpaceAuto24.`)}`;

  const ReviewsSection = () => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-black uppercase text-slate-800">Avis Clients ({reviewsArray.length})</h3>
        <button onClick={()=>setShowReviewModal(true)} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
          <PenLine size={12}/>Rédiger
        </button>
      </div>
      {reviewsArray.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-4 text-center">Aucun avis pour le moment. Soyez le premier !</p>
      ) : (
        <div className="space-y-3">
          {reviewsArray.slice(0, 3).map((r: any, i: number)=>(
            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[11px] font-bold uppercase flex items-center gap-1.5 text-slate-700">
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
    <div className="bg-slate-50 min-h-screen pb-10 pt-4 font-sans">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* NAVIGATION */}
        <div className="flex justify-between mb-4">
          <button onClick={()=>navigate(-1)} className="flex items-center gap-1.5 text-sm font-bold uppercase bg-white px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft size={14}/>Retour
          </button>
          <button onClick={handleToggleFavorite} className={`flex items-center gap-1.5 text-sm font-bold uppercase px-3 py-2 rounded-lg border transition-colors shadow-sm ${isFavorite?'bg-red-50 text-red-600 border-red-200':'bg-white text-slate-500 border-slate-200'}`}>
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"}/>
            {isFavorite ? 'Retirer' : 'Favoris'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE (IMAGE + GALERIE) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 relative flex items-center justify-center min-h-[300px] md:min-h-[450px] shadow-sm order-1">
                <img src={activeImage || fallbackImage} onError={handleImageError} alt={product.name} className="max-h-[350px] md:max-h-[500px] w-full object-contain transition-all duration-300"/>
                <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-white flex items-center gap-1 border shadow-sm backdrop-blur-md ${isOfficial ? 'bg-blue-900/90 border-blue-500/50' : 'bg-slate-900/90 border-slate-700'}`}>
                  {isOfficial ? <Crown size={12}/> : <Store size={12}/>}{storeName}
                </div>
              </div>
              {product.displayImages.length > 1 && (
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[450px] md:w-24 shrink-0 p-1 order-2 snap-x custom-scrollbar">
                  {product.displayImages.map((img: string, idx: number) => (
                    <button key={idx} onClick={() => setActiveImage(img)} className={`relative aspect-[4/3] md:aspect-square w-24 md:w-full rounded-xl overflow-hidden shrink-0 snap-start border-2 transition-all duration-300 ${activeImage === img ? 'border-blue-600 shadow-md scale-100 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-blue-400 opacity-60 hover:opacity-100 scale-95 hover:scale-100'}`}>
                      <img src={img} alt={`miniature-${idx}`} className="w-full h-full object-cover" onError={handleImageError} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <ReviewsSection />
              {/* COLONNE GAUCHE (IMAGE + GALERIE + AVIS + SOCIAL PROOF) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Galerie d'images */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* ... (ton code de galerie reste inchangé) ... */}
            </div>

            {/* AVIS CLIENTS */}
            <div className="hidden lg:block">
              {/* 🟢 SOCIAL PROOF DÉPLACÉ ICI */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <Eye size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vues</p>
                    <p className="text-lg font-black text-slate-900">{socialViews} <span className="text-xs font-medium text-slate-500">visites</span></p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Achats</p>
                    <p className="text-lg font-black text-slate-900">{socialPurchases} <span className="text-xs font-medium text-slate-500">ventes</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>

          {/* COLONNE DROITE (DÉTAILS ET PAIEMENT) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Titre et Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border flex items-center gap-1 ${isConditionNeuf ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {safe_condition}
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border flex items-center gap-1 ${isOutOfStock ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                  {isOutOfStock ? <AlertCircle size={10}/> : <PackageCheck size={10}/>}
                  {isOutOfStock ? 'Rupture de Stock' : `${safe_stock} en stock`}
                </span>
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                  <Tag size={10}/>{displayCategory}
                </span>
              </div>
              <h1 className="text-2xl font-black uppercase leading-tight text-slate-900 tracking-tight">{product.name}</h1>
            </div>

            {/* Prix */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prix TTC</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-blue-600 tracking-tighter">{finalPrice.toLocaleString('fr-FR')}</span>
                  <span className="text-sm font-bold text-slate-400 uppercase">FCFA</span>
                </div>
              </div>
            </div>


            {/* BLOC 1 : SPÉCIFICATIONS TECHNIQUES (Style Tableau comme l'image) */}
            {(hasSpecs || hasCompatibility) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-2">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-lg text-slate-500 font-light">
                    Détails <span className="font-black text-slate-900">{product.name}</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-[1px] bg-slate-200">
                  
                  {product.brand && (
                    <div className="bg-white p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <Shield size={24} strokeWidth={1.5} className="text-red-500 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marque</span>
                        <span className="text-sm font-bold text-slate-800 truncate" title={product.brand}>{product.brand}</span>
                      </div>
                    </div>
                  )}

                  {safe_model && (
                    <div className="bg-white p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <Car size={24} strokeWidth={1.5} className="text-red-500 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modèle</span>
                        <span className="text-sm font-bold text-slate-800 truncate" title={safe_model}>{safe_model}</span>
                      </div>
                    </div>
                  )}

                  {safe_year && (
                    <div className="bg-white p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <Calendar size={24} strokeWidth={1.5} className="text-red-500 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Année</span>
                        <span className="text-sm font-bold text-slate-800 truncate">{safe_year}</span>
                      </div>
                    </div>
                  )}

                  {safe_reference && (
                    <div className="bg-white p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <Hash size={24} strokeWidth={1.5} className="text-red-500 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Référence</span>
                        <span className="text-sm font-bold text-slate-800 truncate" title={safe_reference}>{safe_reference}</span>
                      </div>
                    </div>
                  )}
                  
                  {Object.entries(specFields).map(([key, value]) => (
                    value && (
                      <div key={key} className="bg-white p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                        <Settings2 size={24} strokeWidth={1.5} className="text-red-500 shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate" title={key.replace(/_/g, ' ')}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-bold text-slate-800 truncate" title={String(value)}>
                            {String(value)}
                          </span>
                        </div>
                      </div>
                    )
                  ))}

                  {/* COMPATIBILITÉ INSÉRÉE DIRECTEMENT DANS LE TABLEAU */}
                  {hasCompatibility && (
                    <div className="bg-white p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors col-span-2 sm:col-span-3">
                      <Wrench size={24} strokeWidth={1.5} className="text-red-500 shrink-0" />
                      <div className="flex flex-col overflow-hidden w-full">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compatibilité</span>
                        <span className="text-sm font-bold text-slate-800 truncate" title={compatibility_text}>
                          {compatibility_text}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Actions (Panier / WhatsApp) */}
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-2">
              <button 
                disabled={isOutOfStock}
                onClick={() => { addToCart(productWithFinalPrice); navigate('/checkout'); }} 
                className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isOutOfStock 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5'
                }`}
              >
                <ShoppingCart size={18}/> {isOutOfStock ? 'Rupture de Stock' : 'Acheter maintenant'}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-emerald-600 py-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all">
                  <MessageCircle size={16}/>WhatsApp
                </a>
                <button onClick={handleToggleFavorite} className={`border border-slate-200 py-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all hover:bg-slate-50 ${isFavorite ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-slate-700'}`}>
                  <Heart size={16} fill={isFavorite ? "currentColor" : "none"}/>Favoris
                </button>
              </div>
            </div>

            {/* Garantie */}
            <div className="bg-slate-900 p-4 rounded-2xl text-white flex items-center gap-4 shadow-xl shadow-slate-900/10 border border-slate-800">
              <div className="bg-white/10 p-3 rounded-xl"><ShieldCheck size={24} className="text-emerald-400"/></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Certification SpaceAuto</p>
                <h4 className="text-base font-black uppercase tracking-tight">Paiement 100% Sécurisé</h4>
              </div>
            </div>

            {/* DESCRIPTION DU PRODUIT */}
            {fullDescription && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-100 pb-3">Description du produit</h3>
                <div className="relative">
                  <div className={`text-sm leading-relaxed text-slate-600 whitespace-pre-line transition-all duration-300 ${!isDescExpanded && canExpand ? 'max-h-[120px] overflow-hidden' : 'max-h-none'}`}>
                    {fullDescription}
                  </div>
                  {canExpand && (
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsDescExpanded(!isDescExpanded); }} className="mt-4 w-full py-2.5 text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center justify-center gap-1 bg-slate-100 rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors">
                      {isDescExpanded ? <>Voir moins <ChevronUp size={14}/></> : <>Lire la suite <ChevronDown size={14}/></>}
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
        <div className="mt-12 pt-10 border-t border-slate-200">
          <h2 className="text-xl font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
            <Tag className="text-blue-600" size={20}/>Produits suggérés
          </h2>
          <RelatedVendorProducts vendorId={product?.vendor_id} currentProductId={product?.id} category={displayCategory}/>
        </div>
      </div>

      {/* MODAL AVIS */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase text-slate-800">Donner votre avis</h3>
              <button onClick={()=>setShowReviewModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <X size={18} className="text-slate-600"/>
              </button>
            </div>
            <div className="flex gap-2 mb-6 justify-center">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={()=>setReviewRating(s)} className="transform hover:scale-110 transition-transform p-1">
                  <Star size={36} fill={s <= reviewRating ? "#FACC15" : "none"} className={s <= reviewRating ? "text-amber-400 drop-shadow-sm" : "text-slate-200"}/>
                </button>
              ))}
            </div>
            <textarea 
              value={reviewComment} 
              onChange={e => setReviewComment(e.target.value)} 
              rows={4} 
              className="w-full border border-slate-200 rounded-2xl p-4 text-sm mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-slate-50 transition-all" 
              placeholder="Partagez votre expérience avec ce produit..."
            />
            <button 
              onClick={handleSubmitReview} 
              disabled={isSubmittingReview} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
            >
              Publier mon avis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}