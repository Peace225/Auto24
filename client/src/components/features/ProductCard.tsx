import { ShoppingCart, Image as ImageIcon, MapPin, Settings, Star, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=Photo+Indisponible";
  const initialImageUrl = product?.image_url || product?.image || fallbackImage;

  // 🟢 LOGIQUE NOTATION (Maintenue à 3 pour ton test visuel)
  const totalReviews = product?.totalReviews ?? (product?.reviews?.length || 0);
  const avgRating = 3;

  const getWhatsAppLink = () => {
    const phoneNumber = product?.vendor?.phone || "2250100000000"; 
    const message = encodeURIComponent(`Bonjour, je suis intéressé par l'article "${product?.name}" affiché à ${product?.price?.toLocaleString('fr-FR')} FCFA sur SpaceAuto24.`);
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallbackImage;
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group rounded-xl md:rounded-2xl overflow-hidden relative">
      
      {/* 1. SECTION IMAGE (Hauteur réduite sur mobile) */}
      <Link to={`/product/${product.id}`} className="relative h-32 md:h-52 bg-slate-50 flex items-center justify-center p-2 md:p-4 overflow-hidden">
        <img 
          src={initialImageUrl} 
          alt={product.name} 
          onError={handleImageError}
          className="w-full h-full object-contain mix-blend-darken group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Badge Photo compact */}
        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-md md:rounded-lg flex items-center gap-1 shadow-sm">
          <ImageIcon className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-slate-300" />
          <span>{product?.images?.length || 1}</span>
        </div>

        {avgRating >= 4 && (
          <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[6px] md:text-[8px] font-black px-1.5 md:px-2.5 py-0.5 md:py-1 uppercase tracking-widest rounded-md shadow-md flex items-center gap-0.5">
            <ShieldCheck className="w-2 h-2 md:w-3 md:h-3" /> Certifié
          </div>
        )}
      </Link>

      {/* 2. SECTION CONTENU (Padding réduit sur mobile) */}
      <div className="p-2.5 md:p-5 flex flex-col flex-grow bg-white">
        
        <Link to={`/product/${product.id}`}>
          <h3 className="font-[1000] text-slate-900 text-[10px] md:text-sm uppercase leading-tight line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors tracking-tight">
            {product.name}
          </h3>
        </Link>

        {/* 🟢 NOTATION (Étoiles plus petites) */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => {
              const safeRating = Math.round(Number(avgRating) || 0);
              const isFilled = star <= safeRating;
              return (
                <Star 
                  key={star} 
                  size={10} // Taille réduite
                  strokeWidth={isFilled ? 1 : 1.5}
                  color={isFilled ? "#FACC15" : "#cbd5e1"} 
                  fill={isFilled ? "#FACC15" : "#f1f5f9"} 
                  className="mr-[0.5px]" 
                />
              );
            })}
          </div>
          <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 ml-0.5">
            {totalReviews > 0 ? `${totalReviews} avis` : "3 avis (Test)"}
          </span>
        </div>
        
        <div className="mt-auto">
          {/* PRIX (Taille réduite sur mobile) */}
          <div className="mb-3">
            <div className="text-[#111625] font-black text-sm md:text-2xl tracking-tighter italic">
              {product.price?.toLocaleString('fr-FR')} <span className="text-[7px] md:text-[10px] font-bold text-slate-400 not-italic uppercase tracking-widest">CFA</span>
            </div>
          </div>

          {/* INFOS COMPLÉMENTAIRES (Plus serrées) */}
          <div className="flex justify-between items-center text-[7px] md:text-[9px] text-slate-500 mb-4 font-black uppercase tracking-widest">
            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded-md border border-slate-100">
              <MapPin className="w-2.5 h-2.5 text-red-500" />
              <span className="truncate max-w-[50px] md:max-w-[70px]">{product.location || product.vendor?.commune || "Abidjan"}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded-md border border-slate-100">
              <Settings className="w-2.5 h-2.5 text-blue-500" />
              <span className="truncate max-w-[50px] md:max-w-[80px]">{product.brand || "Standard"}</span>
            </div>
          </div>

          {/* ACTIONS (Boutons compacts) */}
          <div className="flex gap-1.5 pt-3 border-t border-slate-100">
            <button 
              onClick={() => addToCart(product)}
              className="flex-grow bg-[#111625] hover:bg-blue-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-slate-900/5"
            >
              <ShoppingCart className="w-3 h-3 md:w-4 h-4" /> Ajouter
            </button>
            
            <a 
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-lg md:rounded-xl aspect-square w-8 md:w-11 transition-all active:scale-95 border border-[#25D366]/20"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}