// src/pages/Checkout.tsx
import { useState } from 'react';
import { MapPin, Phone, User, Wallet, CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { Link, useNavigate } from 'react-router-dom';

const COMMUNES_ABIDJAN = [
  'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 
  'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
];

// 🟢 DÉTECTEUR D'IMAGES (Local & Logos)
const allImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  query: '?url',
  import: 'default'
}) as Record<string, string>;

export default function Checkout() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [selectedPayment, setSelectedPayment] = useState('wave');
  const navigate = useNavigate();

  // Frais de livraison fixes
  const deliveryFee = 2000;
  const totalAmount = getTotalPrice() + deliveryFee;

  // Fonction pour trouver un logo/image dans les assets
  const getAssetUrl = (keyword: string) => {
    const path = Object.keys(allImages).find(p => p.toLowerCase().includes(keyword.toLowerCase()));
    return path ? allImages[path] : null;
  };

  const getImageUrl = (filename: string | undefined) => {
    if (!filename) return '/placeholder.png';
    const name = filename.split('/').pop();
    const imagePath = Object.keys(allImages).find(path => path.endsWith(`/${name}`));
    return imagePath ? allImages[imagePath] : '/placeholder.png';
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation de validation
    alert(`Félicitations ! Votre commande de ${totalAmount.toLocaleString()} FCFA a été enregistrée. Un conseiller vous contactera pour la livraison via ${selectedPayment.toUpperCase()}.`);
    clearCart();
    navigate('/'); // Retour à l'accueil
  };

  if (items.length === 0) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-200" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Votre panier est vide</h2>
        <p className="text-slate-500 mb-8 max-w-md font-medium">Ajoutez des pièces à votre panier pour finaliser votre commande.</p>
        <Link to="/catalog" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-200">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-4">
        
        <h1 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tighter uppercase">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          Finaliser ma commande
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- FORMULAIRES (8 COL) --- */}
          <div className="lg:col-span-8 space-y-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
              
              {/* 1. Livraison */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest border-b border-slate-50 pb-5">
                  <MapPin className="w-5 h-5 text-blue-600" /> 1. Informations de Livraison
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nom Complet</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <input type="text" required className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-700" placeholder="Ex: Bakayoko Moussa" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Numéro de téléphone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <input type="tel" required className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-700" placeholder="07 00 00 00 00" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Commune</label>
                    <select required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none">
                      <option value="">Choisir une commune</option>
                      {COMMUNES_ABIDJAN.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Quartier / Précisions</label>
                    <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-700" placeholder="Angré 7ème tranche, à côté de..." />
                  </div>
                </div>
              </div>

              {/* 2. Paiement avec VRAIS LOGOS */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest border-b border-slate-50 pb-5">
                  <Wallet className="w-5 h-5 text-blue-600" /> 2. Mode de paiement
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Wave */}
                  <label className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedPayment === 'wave' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-50 hover:border-blue-100'}`}>
                    <input type="radio" name="payment" value="wave" checked={selectedPayment === 'wave'} onChange={() => setSelectedPayment('wave')} className="sr-only" />
                    <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 p-2 flex items-center justify-center shadow-sm">
                      <img src={getAssetUrl('wave') || ''} alt="Wave" className="max-h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Wave</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Paiement Mobile</p>
                    </div>
                    {selectedPayment === 'wave' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-blue-600" />}
                  </label>

                  {/* Orange */}
                  <label className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedPayment === 'orange' ? 'border-orange-500 bg-orange-50/30' : 'border-slate-50 hover:border-orange-100'}`}>
                    <input type="radio" name="payment" value="orange" checked={selectedPayment === 'orange'} onChange={() => setSelectedPayment('orange')} className="sr-only" />
                    <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 p-2 flex items-center justify-center shadow-sm">
                      <img src={getAssetUrl('orange') || ''} alt="Orange Money" className="max-h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm uppercase">Orange</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Paiement Mobile</p>
                    </div>
                    {selectedPayment === 'orange' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-orange-500" />}
                  </label>

                  {/* MTN */}
                  <label className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedPayment === 'mtn' ? 'border-yellow-400 bg-yellow-50/30' : 'border-slate-50 hover:border-yellow-100'}`}>
                    <input type="radio" name="payment" value="mtn" checked={selectedPayment === 'mtn'} onChange={() => setSelectedPayment('mtn')} className="sr-only" />
                    <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 p-2 flex items-center justify-center shadow-sm">
                      <img src={getAssetUrl('mtn') || ''} alt="MTN MoMo" className="max-h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">MTN MoMo</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Paiement Mobile</p>
                    </div>
                    {selectedPayment === 'mtn' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-yellow-500" />}
                  </label>

                  {/* Cash */}
                  <label className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedPayment === 'cash' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-50 hover:border-emerald-100'}`}>
                    <input type="radio" name="payment" value="cash" checked={selectedPayment === 'cash'} onChange={() => setSelectedPayment('cash')} className="sr-only" />
                    <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                      <Truck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm uppercase">Livraison</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Paiement en espèces</p>
                    </div>
                    {selectedPayment === 'cash' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-emerald-500" />}
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* --- RÉSUMÉ (4 COL) --- */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl sticky top-24">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-5 text-blue-400">
                Résumé de commande
              </h2>

              {/* Liste articles avec VRAIES IMAGES */}
              <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden flex-shrink-0 p-1.5 border border-white/5">
                      <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-contain mix-blend-lighten" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-[11px] font-black uppercase leading-tight line-clamp-2 mb-1">{item.name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Qté: {item.quantity}</span>
                        <span className="text-xs font-black text-blue-400">{(item.price * item.quantity).toLocaleString()} <small>FCFA</small></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="space-y-4 border-t border-white/10 pt-6 mb-8">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Articles</span>
                  <span>{getTotalPrice().toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Livraison</span>
                  <span className="text-emerald-400">{deliveryFee.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest">Total à payer</span>
                  <span className="text-3xl font-black tracking-tighter text-blue-400">
                    {totalAmount.toLocaleString()} <small className="text-xs">FCFA</small>
                  </span>
                </div>
              </div>

              {/* BOUTON CONFIRMER (Connecté au form) */}
              <button 
                type="submit" 
                form="checkout-form"
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95"
              >
                Confirmer la commande <ArrowRight className="w-5 h-5" />
              </button>

              <div className="mt-6 bg-white/5 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase">
                  Paiement 100% sécurisé. Vos données sont protégées par le système SpaceAuto24.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}