// src/components/features/ProductCard.tsx
import { ShoppingCart, Image as ImageIcon, MapPin, Settings, Star } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=Photo+Indisponible";
  const initialImageUrl = product?.image_url || product?.image || fallbackImage;

  // 🟢 LOGIQUE DE SÉCURITÉ POUR LA NOTATION
  // On vérifie d'abord si la moyenne est déjà calculée, sinon on la calcule à partir du tableau reviews
  const totalReviews = product?.totalReviews || product?.reviews?.length || 0;
  
  const avgRating = product?.avgRating || (
    product?.reviews?.length 
      ? product.reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / product.reviews.length 
      : 0
  );

  const getWhatsAppLink = () => {
    const phoneNumber = "22500000000"; 
    const message = encodeURIComponent(`Bonjour SpaceAuto24, je suis intéressé par l'article "${product?.name}" affiché à ${product?.price?.toLocaleString('fr-FR')} FCFA.`);
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallbackImage;
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group rounded-sm overflow-hidden">
      
      {/* 1. SECTION IMAGE */}
      <Link to={`/product/${product.id}`} className="relative h-48 md:h-52 bg-[#f8fafc] flex items-center justify-center p-4 overflow-hidden">
        <img 
          src={initialImageUrl} 
          alt={product.name} 
          onError={handleImageError}
          className="w-full h-full object-contain mix-blend-darken group-hover:scale-105 transition-transform duration-500"
        />
        
        <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1.5 shadow-sm">
          <ImageIcon className="w-3 h-3" />
          <span>1</span>
        </div>

        {/* Badge "Certifié" si la note est excellente */}
        {avgRating >= 4 && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 uppercase tracking-widest rounded-sm shadow-lg">
            Certifié
          </div>
        )}
      </Link>

      {/* 2. SECTION CONTENU */}
      <div className="p-4 flex flex-col flex-grow bg-white">
        
        <Link to={`/product/${product.id}`}>
          <h3 className="font-bold text-slate-900 text-sm md:text-[15px] uppercase leading-tight line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors tracking-tight">
            {product.name}
          </h3>
        </Link>

        {/* 🟢 BLOC NOTATION (Visibilité garantie) */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={10} 
                // On arrondit la note pour colorer les étoiles correctement
                className={`${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
              />
            ))}
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            {totalReviews > 0 ? `(${totalReviews} avis)` : "(Aucun avis)"}
          </span>
        </div>
        
        <div className="mt-auto">
          <div className="mb-4">
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              Prix
            </div>
            <div className="text-[#dc2626] font-black text-lg md:text-xl tracking-tighter">
              {product.price?.toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-4 font-bold uppercase">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#dc2626]" />
              <span className="truncate max-w-[70px]">{product.location || product.vendor?.commune || "Abidjan"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[80px]">{product.brand || "Standard"}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-100">
            <button 
              onClick={() => addToCart(product)}
              className="flex-grow bg-slate-900 hover:bg-blue-600 text-white py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" /> Ajouter
            </button>
            
            <a 
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-sm aspect-square w-10 transition-all active:scale-95 border border-[#25D366]/20"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}