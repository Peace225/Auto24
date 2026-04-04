// src/components/features/CartDrawer.tsx
import { Link } from 'react-router-dom'; // Import pour la navigation
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

// 🟢 SUPER DÉTECTEUR D'IMAGES (pour afficher les vraies images dans le panier)
const allImages = import.meta.glob('../../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  query: '?url',
  import: 'default'
}) as Record<string, string>;

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();

  // Fonction utilitaire pour retrouver l'image locale
  const getImageUrl = (filename: string | undefined) => {
    if (!filename) return 'https://via.placeholder.com/100?text=Piece';
    const name = filename.split('/').pop();
    const imagePath = Object.keys(allImages).find(path => path.endsWith(`/${name}`));
    return imagePath ? allImages[imagePath] : 'https://via.placeholder.com/100?text=Piece';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay sombre */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={closeCart}
      />

      {/* Tiroir Latéral */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Mon Panier <span className="text-blue-600 ml-1">({items.length})</span>
            </h2>
          </div>
          <button 
            onClick={closeCart}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Liste des articles */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-slate-200" />
              </div>
              <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Votre panier est vide</p>
              <button 
                onClick={closeCart} 
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                {/* 🟢 IMAGE DU PRODUIT CORRIGÉE */}
                <div className="w-24 h-24 flex-shrink-0 bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100 p-2">
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.name} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>

                {/* Infos produit */}
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-[13px] font-black text-slate-900 leading-tight mb-1 uppercase line-clamp-2">
                      {item.name}
                    </h3>
                    {item.brand && (
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                        {item.brand}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-slate-900 text-sm">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} <small className="text-[9px]">FCFA</small>
                    </span>

                    {/* Contrôles Quantité */}
                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                        className="p-0.5 text-slate-500 hover:text-blue-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black w-4 text-center text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="p-0.5 text-slate-500 hover:text-blue-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Supprimer */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-300 hover:text-red-500 self-start transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer (Total & Bouton Valider) */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 p-8 bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sous-total</span>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">
                {getTotalPrice().toLocaleString('fr-FR')} <small className="text-xs">FCFA</small>
              </span>
            </div>
            
            {/* 🟢 BOUTON VALIDER CORRIGÉ (Utilisation de Link) */}
            <Link 
              to="/checkout"
              onClick={closeCart}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 active:scale-[0.98]"
            >
              Valider la commande <ArrowRight className="w-5 h-5" />
            </Link>
            
            <p className="text-center text-[9px] text-slate-400 font-bold uppercase mt-4 tracking-widest">
              Livraison & Taxes calculées à l'étape suivante
            </p>
          </div>
        )}

      </div>
    </>
  );
}