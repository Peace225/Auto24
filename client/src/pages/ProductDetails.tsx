import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, ShieldCheck, MessageCircle, ArrowLeft, Loader2,
  Info, CheckCircle2, Home, Store, Star, Car, UserCircle2, Crown, PenLine, X, Tag, AlertTriangle, Flag
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';
import RelatedVendorProducts from '../components/features/RelatedVendorProducts';
import { getPublicPrice } from '../utils/pricing'; // 🟢 1. Import de la logique globale

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fallbackImage = "https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Indisponible";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallbackImage;
  };

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
          const { data: vData } = await supabase
            .from('profiles')
            .select('store_name, role, phone')
            .eq('id', data.vendor_id)
            .maybeSingle();
          data.vendor = vData || { role: 'admin', store_name: 'SPACEAUTO24 OFFICIEL' };
        } else {
          data.vendor = { role: 'admin', store_name: 'SPACEAUTO24 OFFICIEL' };
        }

        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            rating,
            comment,
            created_at,
            profiles (store_name)
          `)
          .eq('product_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) {
          console.warn('Reviews join failed:', reviewsError.message);
          data.reviews = [];
        } else {
          data.reviews = reviewsData || [];
        }

        setProduct(data);
      }
    } catch (error) {
      console.error("Erreur technique:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Le commentaire est obligatoire');
      return;
    }
    setIsSubmittingReview(true);
    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: id,
        user_id: user.id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });

    if (error) {
      alert('Erreur: ' + error.message);
    } else {
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      await fetchProduct();
    }
    setIsSubmittingReview(false);
  };

  const handleSubmitReport = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!reportReason.trim()) {
      alert('Veuillez sélectionner un motif');
      return;
    }
    setIsSubmittingReport(true);

    try {
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          product_id: id,
          vendor_id: product.vendor_id,
          user_id: user.id,
          reason: reportReason,
          details: reportDetails.trim(),
          status: 'pending'
        });

      if (reportError) throw reportError;

      const vendorName = product.vendor?.store_name || 'Boutique Partenaire';
      const productName = product.name;

      if (product.vendor_id) {
        await supabase.from('notifications').insert({
          user_id: product.vendor_id,
          title: '⚠️ Alerte Litige',
          message: `Un litige a été ouvert par un client concernant votre produit : ${productName}. Motif : ${reportReason}.`,
          type: 'report_alert',
          is_read: false
        });
      }

      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin']);

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map((admin) => ({
          user_id: admin.id,
          title: '🚨 Nouveau Litige à modérer',
          message: `Un client a signalé le produit "${productName}" de la boutique ${vendorName}.`,
          type: 'admin_report_alert',
          is_read: false
        }));

        await supabase.from('notifications').insert(adminNotifications);
      }

      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      alert('Signalement envoyé. Notre équipe et le vendeur ont été notifiés.');

    } catch (error: any) {
      alert('Erreur lors du signalement : ' + error.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Chargement...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-black text-slate-900 uppercase">Produit introuvable</h2>
        <Link to="/" className="mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase flex items-center gap-2 mx-auto w-fit">
          <Home className="w-3.5 h-3.5" /> Accueil
        </Link>
      </div>
    );
  }

  const vendorRole = product?.vendor?.role || 'admin';
  const isOfficial = vendorRole === 'admin' || vendorRole === 'super_admin' || !product.vendor_id;
  const storeName = isOfficial ? 'SPACEAUTO24 OFFICIEL' : (product.vendor?.store_name || 'Boutique Partenaire');
  const isNew = product?.condition?.toLowerCase() === 'neuf' || product?.is_new === true;
  
  // 🟢 2. CALCUL DES PRIX PAR PALIERS
  const basePrice = product?.original_price || product?.price || 0;
  const finalPrice = getPublicPrice(basePrice);
  
  // On prépare l'objet pour le panier avec les deux infos
  const productWithFinalPrice = { 
    ...product, 
    price: finalPrice, 
    original_price: basePrice 
  };

  const reviewsArray = product?.reviews || [];
  const realTotal = reviewsArray.length;

  const displayCategory =
    product?.category ||
    product?.categorie ||
    product?.type ||
    product?.type_piece ||
    product?.family ||
    'PIÈCE AUTO';

  const phoneNumber = product?.vendor?.phone || "2250100000000";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Bonjour, je suis intéressé par "${product.name}"${isNew ? ' (NEUF)' : ''} affiché à ${finalPrice.toLocaleString()} FCFA sur SpaceAuto24.`)}`;

  return (
    <div className="bg-slate-50 min-h-screen pb-16 pt-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">

        <div className="flex items-center justify-between gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-[10px] uppercase bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm transition-all">
            <ArrowLeft size={12} /> Retour
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative overflow-hidden group min-h-[250px] md:min-h-[350px]">
              <img
                src={product.image_url || fallbackImage}
                alt={product.name}
                onError={handleImageError}
                className="relative z-10 max-h-[200px] md:max-h-[280px] w-auto object-contain mix-blend-darken hover:scale-105 transition-transform duration-700"
              />

              <div className={`absolute top-2 left-2 z-30 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1 shadow-md border ${isOfficial ? 'bg-gradient-to-r from-blue-900 to-black border-blue-500/50' : 'bg-slate-900/90 border-white/10'}`}>
                {isOfficial ? <Crown size={10} className="text-amber-400" /> : <Store size={10} className="text-blue-400" />}
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">{storeName}</span>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase">Avis Clients ({realTotal})</h3>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <PenLine size={12} /> Rédiger un avis
                  </button>
                </div>
                <div className="space-y-3">
                  {(realTotal > 0 ? reviewsArray : [{}, {}]).map((review: any, index: number) => (
                    <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <UserCircle2 className="text-slate-300" size={20} />
                          <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-900">
                            {review.profiles?.store_name || "Client Vérifié"}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={9} fill={s <= (review.rating || 4) ? "#FACC15" : "none"} className={s <= (review.rating || 4) ? "text-amber-400" : "text-slate-200"} />)}
                        </div>
                      </div>
                      <p className="text-[10px] md:text-[11px] text-slate-600 leading-relaxed">{review.comment || "Produit conforme à la description, je recommande vivement."}</p>
                    </div>
                  ))}
                </div>
              </div>

              {!isOfficial && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full bg-white border border-red-200 border-dashed text-red-500 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all group"
                >
                  <AlertTriangle size={14} className="group-hover:scale-110 transition-transform" />
                  Signaler un litige avec le vendeur
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Disponible
                </span>
                {isNew && (
                  <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-md border bg-blue-50 text-blue-600 border-blue-100">
                    NEUF
                  </span>
                )}
              </div>
              {displayCategory && (
                <span className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1 w-fit mt-1">
                  <Tag size={10} /> {displayCategory}
                </span>
              )}
            </div>

            <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter mb-3 leading-tight">{product.name}</h1>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {product.brand && <span className="bg-slate-900 text-white text-[8px] md:text-[9px] font-bold px-2.5 py-1 rounded uppercase">{product.brand}</span>}
              {product.reference && <span className="bg-white border border-slate-200 text-slate-500 text-[8px] md:text-[9px] font-bold px-2.5 py-1 rounded uppercase">RÉF: {product.reference}</span>}
              {product.model && <span className="bg-blue-50 text-blue-700 text-[8px] md:text-[9px] font-bold px-2.5 py-1 rounded uppercase flex items-center gap-1"><Car size={10} /> {product.model}</span>}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
               {/* 🟢 3. AFFICHAGE DYNAMIQUE DU PRIX AVEC BARRAGE SI BESOIN */}
               <div className="flex flex-col mb-1">
                 {basePrice !== finalPrice && (
                   <span className="text-xs text-slate-400 line-through font-bold mb-0.5">
                     {basePrice.toLocaleString('fr-FR')} CFA
                   </span>
                 )}
                 <div className="flex items-baseline gap-1.5">
                   <span className="text-2xl md:text-3xl font-black text-blue-600 tracking-tighter">{finalPrice.toLocaleString('fr-FR')}</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">FCFA</span>
                 </div>
               </div>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">TVA incluse + Frais de service sécurisés</p>
            </div>

            <div className="flex flex-col gap-2.5 mb-6">
              <button onClick={() => { addToCart(productWithFinalPrice); navigate('/checkout'); }} className="w-full bg-blue-600 hover:bg-slate-900 text-white py-3 md:py-4 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5">
                <ShoppingCart size={16} /> Acheter maintenant
              </button>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-white border-2 border-emerald-100 text-emerald-600 py-3 md:py-4 rounded-xl font-black text-[10px] md:text-[11px] uppercase flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-all">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl text-white flex items-center gap-3 shadow-lg">
              <div className="bg-white/10 p-2.5 rounded-lg"><ShieldCheck className="text-emerald-400" size={20} /></div>
              <div>
                <h4 className="font-black text-[9px] md:text-[10px] uppercase tracking-wider">Garantie SpaceAuto24</h4>
                <p className="text-[9px] md:text-[10px] text-slate-400">Pièce certifiée conforme par nos experts.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="block lg:hidden mt-5 flex flex-col gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase">Avis ({realTotal})</h3>
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all"
              >
                <PenLine size={12} /> Rédiger
              </button>
            </div>
            <div className="space-y-3">
              {(realTotal > 0 ? reviewsArray : [{}, {}]).map((review: any, index: number) => (
                <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <UserCircle2 className="text-slate-300" size={20} />
                      <p className="text-[9px] font-black uppercase text-slate-900">
                        {review.profiles?.store_name || "Client Vérifié"}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={9} fill={s <= (review.rating || 4) ? "#FACC15" : "none"} className={s <= (review.rating || 4) ? "text-amber-400" : "text-slate-200"} />)}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{review.comment || "Produit conforme à la description, je recommande vivement."}</p>
                </div>
              ))}
            </div>
          </div>

          {!isOfficial && (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full bg-white border border-red-200 border-dashed text-red-500 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-all active:scale-95"
            >
              <AlertTriangle size={14} /> Signaler un litige avec ce vendeur
            </button>
          )}
        </div>

        <RelatedVendorProducts
          vendorId={product?.vendor_id}
          currentProductId={product?.id}
          category={displayCategory}
        />

      </div>

      {/* --- MODAL AVIS --- */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-xl p-4 max-w-xs w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase">Rédiger un avis</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-slate-100 rounded-md">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setReviewRating(s)} className="p-0">
                      <Star size={20} fill={s <= reviewRating ? "#FACC15" : "none"} className={s <= reviewRating ? "text-amber-400" : "text-slate-200"} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Commentaire</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Partagez votre expérience..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-md p-2 text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewComment.trim()}
                className="w-full bg-blue-600 hover:bg-slate-900 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1"
              >
                {isSubmittingReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenLine size={12} />}
                Publier l'avis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL LITIGE --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-1.5 rounded-lg">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase">Signaler un litige</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-slate-100 rounded-md">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">Motif du signalement</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-[11px] focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Sélectionner un motif</option>
                  <option value="produit_non_conforme">Produit non conforme / Contrefaçon</option>
                  <option value="produit_defectueux">Produit défectueux</option>
                  <option value="mauvaise_communication">Mauvaise communication</option>
                  <option value="arnaque">Tentative d'arnaque / Fraude</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">Détails de l'incident</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Décrivez précisément le problème rencontré avec ce vendeur..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-[11px] focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[9px] text-amber-800 leading-relaxed">
                  <strong>Important :</strong> Notre équipe technique examine chaque signalement sous 24h. Tout signalement abusif pourra entraîner la suspension de votre compte.
                </p>
              </div>

              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || !reportReason.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20"
              >
                {isSubmittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag size={14} />}
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}