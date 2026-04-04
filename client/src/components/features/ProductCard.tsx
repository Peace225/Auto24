// src/components/features/ProductCard.tsx
import { ShoppingCart, Eye, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { Link } from 'react-router-dom';

// 🟢 1. LE MOTEUR D'IMAGES LOCALES
// On scanne le dossier assets/products pour transformer les fichiers en URLs utilisables par le navigateur
const productImages = import.meta.glob('../../assets/products/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  as: 'url' 
});

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  // 🟢 2. RÉCUPÉRATION DE L'IMAGE LOCALE
  // On construit le chemin et on vérifie s'il existe dans notre dictionnaire d'images
  const imagePath = `../../assets/products/${product.image_filename}`;
  const imageUrl = productImages[imagePath] || "https://via.placeholder.com/400x400?text=Image+Manquante";

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group overflow-hidden flex flex-col h-full">
      
      {/* Container Image avec Zoom au survol */}
      <Link to={`/product/${product.id}`} className="relative h-56 overflow-hidden bg-slate-50/50 flex items-center justify-center">
        <img 
          src={imageUrl as string} 
          alt={product.name} 
          className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Badge "Certifié" Style Premium */}
        {product.is_certified && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-blue-50 z-10">
            <ShieldCheck className="w-3.5 h-3.5" /> CERTIFIÉ OEM
          </div>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-grow">
        {/* Badge Marque */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">
            {product.brand}
          </span>
          <span className="text-[10px] font-bold text-slate-400">REF: {product.oem_reference}</span>
        </div>

        {/* Titre Produit */}
        <Link to={`/product/${product.id}`} className="font-bold text-slate-900 text-base hover:text-blue-600 line-clamp-2 mb-4 leading-snug transition-colors">
          {product.name}
        </Link>
        
        <div className="mt-auto">
          {/* Prix Premium */}
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-2xl font-black text-slate-900 tracking-tighter">
              {product.price.toLocaleString('fr-FR')}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase">FCFA</span>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button 
              onClick={() => addToCart(product)}
              className="flex-grow bg-slate-900 hover:bg-blue-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-200 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" /> Panier
            </button>
            <Link 
              to={`/product/${product.id}`}
              className="p-3.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl border border-slate-100 hover:border-blue-100 transition-all shadow-sm"
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}