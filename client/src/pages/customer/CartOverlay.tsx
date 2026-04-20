import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useNavigate } from 'react-router-dom';

export default function CartOverlay({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Panneau latéral */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-blue-600" /> Mon Panier
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {items.length > 0 ? items.map((item) => (
            <div key={item.id} className="flex gap-4 group">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase leading-tight mb-1">{item.name}</h3>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <p className="text-[10px] font-black text-blue-600 mb-3">{item.price.toLocaleString()} CFA</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1 bg-slate-100 rounded-lg"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 bg-slate-100 rounded-lg"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Votre panier est vide</p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 border-t border-slate-50 bg-slate-50/50 space-y-6">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-total</p>
              <p className="text-2xl font-[1000] text-slate-900 tracking-tighter">{getTotalPrice().toLocaleString()} <span className="text-xs">CFA</span></p>
            </div>
            <button 
              onClick={() => { navigate('/checkout'); onClose(); }}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              Commander maintenant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}