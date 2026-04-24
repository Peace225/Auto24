// src/components/features/CartDrawer.tsx
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return 'https://placehold.co/150x150/f8fafc/94a3b8?text=Image+Indisponible';
    if (imagePath.startsWith('http')) return imagePath;
    return imagePath; 
  };

  if (!isOpen) return null;

  return (
    <>
      {/* OVERLAY : Fond transparent cliquable pour fermer le menu */}
      <div 
        className="fixed inset-0 z-[99998]"
        onClick={closeCart}
      />

      {/* PANIER WIDGET : Positionné exactement sous l'icône, taille très compacte */}
      <div className="fixed top-[72px] sm:top-[80px] right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[340px] max-h-[80vh] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-3xl z-[99999] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 overflow-hidden">
        
        {/* Header Ultra-Compact */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg shadow-sm">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                Mon Panier
              </h2>
              <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5">
                {items.length} Article{items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={closeCart}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Liste des articles avec Scroll */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
                <ShoppingBag className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-tighter">Votre panier est vide</p>
              </div>
              <button 
                onClick={closeCart} 
                className="mt-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95"
              >
                Catalogue
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 group items-center">
                {/* IMAGE (Micro taille) */}
                <div className="w-14 h-14 flex-shrink-0 bg-[#f8fafc] rounded-xl overflow-hidden border border-slate-100 p-1.5 relative transition-all duration-300">
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.name} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>

                {/* Infos produit */}
                <div className="flex-grow flex flex-col min-w-0">
                  <div className="mb-1.5">
                    <h3 className="text-[10px] font-black text-slate-900 leading-tight mb-1 uppercase line-clamp-1 group-hover:text-blue-600 transition-colors tracking-tight">
                      {item.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-600 text-[11px] tracking-tighter">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} <small className="text-[7px] text-slate-400">CFA</small>
                    </span>

                    <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all disabled:opacity-20 active:bg-blue-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      
                      <span className="text-[9px] font-black w-5 text-center text-slate-900 border-x border-slate-100 bg-white">
                        {item.quantity}
                      </span>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all active:bg-blue-50"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Supprimer */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 p-4 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-900 font-black uppercase text-[9px] tracking-widest">Total TTC</span>
              <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">
                {getTotalPrice().toLocaleString('fr-FR')} <span className="text-[8px] text-blue-600 uppercase tracking-widest">CFA</span>
              </p>
            </div>
            
            <Link 
              to="/checkout"
              onClick={closeCart}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 group"
            >
              Commander 
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}