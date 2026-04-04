// src/components/features/CartDrawer.tsx
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

// 🟢 DÉTECTEUR D'IMAGES OPTIMISÉ
// On utilise Record<string, any> pour éviter les erreurs de type sur l'import glob
const allImages = import.meta.glob('../../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  query: '?url',
  import: 'default'
}) as Record<string, string>;

export default function CartDrawer() {
  // On récupère exactement ce qui est défini dans useCartStore.ts
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();

  // Fonction utilitaire pour retrouver l'image locale ou fallback sur l'URL directe
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return 'https://via.placeholder.com/150?text=No+Image';
    
    // Si c'est déjà une URL (http/https), on la retourne
    if (imagePath.startsWith('http')) return imagePath;

    // Sinon, on cherche dans les assets locaux via le glob
    const filename = imagePath.split('/').pop();
    const fullPath = Object.keys(allImages).find(path => path.endsWith(`/${filename}`));
    
    return fullPath ? allImages[fullPath] : imagePath; 
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay sombre avec transition fluide */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity animate-in fade-in duration-300"
        onClick={closeCart}
      />

      {/* Tiroir Latéral */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Mon Panier
              </h2>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                {items.length} {items.length > 1 ? 'articles' : 'article'} sélectionnés
              </p>
            </div>
          </div>
          <button 
            onClick={closeCart}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Liste des articles */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                <ShoppingBag className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <p className="font-black text-slate-900 uppercase text-sm tracking-tight">Votre panier est vide</p>
                <p className="text-slate-400 text-xs max-w-[200px] mx-auto font-medium">Parcourez notre catalogue pour trouver vos pièces.</p>
              </div>
              <button 
                onClick={closeCart} 
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-100"
              >
                Commencer mes achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-5 group items-start">
                {/* IMAGE DU PRODUIT */}
                <div className="w-24 h-24 flex-shrink-0 bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100 p-2 relative">
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.name} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>

                {/* Infos produit */}
                <div className="flex-grow flex flex-col min-w-0">
                  <div className="mb-2">
                    <h3 className="text-[13px] font-black text-slate-900 leading-tight mb-1 uppercase line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex gap-2">
                      {item.brand && (
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {item.brand}
                        </span>
                      )}
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        REF: {item.oem_reference?.split('-')[0] || 'PRD'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-slate-900 text-sm">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} <small className="text-[9px] text-slate-400">FCFA</small>
                    </span>

                    {/* Contrôles Quantité */}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black w-5 text-center text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Supprimer */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg self-start transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 p-8 bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Sous-total</span>
                <span className="text-slate-900 font-bold text-sm">
                  {getTotalPrice().toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Livraison</span>
                <span className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Calculée au paiement</span>
              </div>
              <div className="h-px bg-slate-50 w-full my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-900 font-black uppercase text-[10px] tracking-widest">Total TTC</span>
                <span className="text-2xl font-black text-blue-700 tracking-tighter">
                  {getTotalPrice().toLocaleString('fr-FR')} <small className="text-xs">FCFA</small>
                </span>
              </div>
            </div>
            
            <Link 
              to="/checkout"
              onClick={closeCart}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 active:scale-[0.98]"
            >
              Passer à la caisse <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}