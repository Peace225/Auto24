// src/components/features/CartDrawer.tsx
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();

  // 🟢 LOGIQUE D'IMAGE SIMPLIFIÉE (Pointe vers public/assets/produits)
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return 'https://placehold.co/150x150/f8fafc/94a3b8?text=Image+Indisponible';
    if (imagePath.startsWith('http')) return imagePath;
    return imagePath; // Utilise le chemin stocké en BDD ex: /assets/produits/pneu.jpg
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay sombre avec flou artistique */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] transition-opacity animate-in fade-in duration-500"
        onClick={closeCart}
      />

      {/* Tiroir Latéral Premium XXL */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[70] flex flex-col transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header Élégant */}
        <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-xl shadow-slate-200">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Panier
              </h2>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">
                {items.length} Modèle{items.length > 1 ? 's' : ''} sélectionné{items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={closeCart}
            className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Liste des articles avec Scroll invisible */}
        <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
                <ShoppingBag className="w-12 h-12 text-slate-200" />
              </div>
              <div className="space-y-2">
                <p className="font-black text-slate-900 uppercase text-lg tracking-tighter">Votre panier est vide</p>
                <p className="text-slate-400 text-xs max-w-[220px] mx-auto font-bold uppercase tracking-widest leading-relaxed">Ajoutez des pièces pour commencer votre commande.</p>
              </div>
              <button 
                onClick={closeCart} 
                className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 active:scale-95"
              >
                Retour au catalogue
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-6 group items-center animate-in slide-in-from-right-10 duration-500">
                {/* IMAGE DU PRODUIT */}
                <div className="w-24 h-24 flex-shrink-0 bg-[#f8fafc] rounded-[2rem] overflow-hidden border border-slate-100 p-3 relative group-hover:shadow-lg transition-all duration-500">
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.name} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                  />
                </div>

                {/* Infos produit */}
                <div className="flex-grow flex flex-col min-w-0">
                  <div className="mb-3">
                    <h3 className="text-xs font-black text-slate-900 leading-tight mb-2 uppercase line-clamp-2 group-hover:text-blue-600 transition-colors tracking-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        {item.brand || 'Premium'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-600 text-sm tracking-tighter">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} <small className="text-[10px] text-slate-400">CFA</small>
                    </span>

                    {/* 🟢 CONTRÔLES QUANTITÉ AMÉLIORÉS */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                        className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all disabled:opacity-20 active:bg-blue-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      <span className="text-xs font-black w-8 text-center text-slate-900 border-x border-slate-100 bg-white">
                        {item.quantity}
                      </span>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all active:bg-blue-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Supprimer */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Massif & Premium */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 p-10 bg-white">
            <div className="space-y-4 mb-10">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Sous-total</span>
                <span className="text-slate-900 font-black text-base tracking-tighter">
                  {getTotalPrice().toLocaleString('fr-FR')} <small className="text-[10px]">CFA</small>
                </span>
              </div>
              
              <div className="h-px bg-slate-50 w-full"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-900 font-black uppercase text-xs tracking-widest">Total à payer</span>
                <div className="text-right">
                  <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                    {getTotalPrice().toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Francs CFA TTC</p>
                </div>
              </div>
            </div>
            
            <Link 
              to="/checkout"
              onClick={closeCart}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 active:scale-95 group"
            >
              Commander maintenant 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
            
            <p className="text-center mt-6 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Paiement sécurisé · Expédition express
            </p>
          </div>
        )}
      </div>
    </>
  );
}