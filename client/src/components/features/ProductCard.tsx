// src/components/features/ProductCard.tsx
import { ShoppingCart, Image as ImageIcon, MapPin, Settings } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  // 1. L'image de secours élégante (si le fichier physique manque dans le dossier public)
  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=Photo+Indisponible";

  // 2. On récupère directement le lien de la base de données (ex: /assets/produits/shampooing.jpg)
  const initialImageUrl = product?.image_url || fallbackImage;

  // 🟢 GÉNÉRATION DU LIEN WHATSAPP
  const getWhatsAppLink = () => {
    const phoneNumber = "22500000000"; // ⚠️ N'oublie pas de mettre ton vrai numéro
    const message = encodeURIComponent(`Bonjour, je suis intéressé par l'article "${product?.name}" affiché à ${product?.price?.toLocaleString('fr-FR')} FCFA.`);
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  // 🟢 SÉCURITÉ : Si l'image locale n'est pas trouvée par le navigateur, on affiche le fond gris
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; // Empêche une boucle d'erreur infinie
    e.currentTarget.src = fallbackImage;
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col h-full group">
      
      {/* 1. SECTION IMAGE */}
      <Link to={`/product/${product.id}`} className="relative h-48 md:h-52 bg-[#f8fafc] flex items-center justify-center p-4 overflow-hidden">
        <img 
          src={initialImageUrl} 
          alt={product.name} 
          onError={handleImageError}
          className="w-full h-full object-contain mix-blend-darken group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badge Photo Orange */}
        <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1.5 shadow-sm">
          <ImageIcon className="w-3 h-3" />
          <span>1</span>
        </div>
      </Link>

      {/* 2. SECTION CONTENU */}
      <div className="p-4 flex flex-col flex-grow bg-white">
        
        {/* Titre Produit */}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-bold text-slate-900 text-sm md:text-base uppercase leading-tight line-clamp-2 mb-6 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto">
          {/* Prix en Rouge */}
          <div className="mb-4">
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              Prix
            </div>
            <div className="text-[#dc2626] font-bold text-lg md:text-xl">
              {product.price?.toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
            </div>
          </div>

          {/* Méta-données (Zone / Marque) */}
          <div className="flex justify-between items-center text-[11px] text-slate-500 mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#dc2626]" />
              <span>{product.location || "Abidjan"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-[#dc2626]" />
              <span className="truncate max-w-[80px] font-bold uppercase">{product.brand || "Universel"}</span>
            </div>
          </div>

          {/* 3. BOUTONS D'ACTION */}
          <div className="flex gap-2 pt-4 border-t border-slate-100">
            <button 
              onClick={() => addToCart(product)}
              className="flex-grow bg-slate-900 hover:bg-blue-600 text-white py-2.5 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" /> Acheter
            </button>
            
            <a 
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              title="Commander via WhatsApp"
              className="flex items-center justify-center bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded aspect-square w-10 transition-colors active:scale-95 border border-[#25D366]/20"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}