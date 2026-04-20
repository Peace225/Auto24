import { useState } from 'react';
import { ShieldCheck, MapPin, CreditCard, ChevronLeft, Lock } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

const PAYMENT_METHODS = [
  { id: 'wave', name: 'Wave', color: 'bg-blue-400' },
  { id: 'orange', name: 'Orange Money', color: 'bg-orange-500' },
  { id: 'mtn', name: 'MTN MoMo', color: 'bg-yellow-400' }
];

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const [method, setMethod] = useState('wave');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-10 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* COLONNE DE GAUCHE : FORMULAIRE */}
        <div className="lg:col-span-2 space-y-8">
          <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Retour au shopping
          </button>
          
          <h1 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Finaliser la <span className="text-blue-600">Commande</span></h1>

          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" /> Adresse de livraison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="COMMUNE (EX: COCODY, MARCORY...)" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase outline-none focus:border-blue-600 transition-all" />
                <input type="text" placeholder="QUARTIER / RUE" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase outline-none focus:border-blue-600 transition-all" />
              </div>
              <input type="text" placeholder="TÉLÉPHONE POUR LA LIVRAISON" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase outline-none focus:border-blue-600 transition-all" />
            </div>

            <div className="pt-8 border-t border-slate-50 space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" /> Moyen de paiement
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === m.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:border-blue-100'}`}
                  >
                    <div className={`h-1.5 w-8 rounded-full ${m.color}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DE DROITE : RÉSUMÉ & PAIEMENT */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl sticky top-24">
            <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 border-b border-white/10 pb-4">Résumé</h3>
            
            <div className="space-y-4 mb-8">
               <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Articles ({items.length})</span>
                  <span>{getTotalPrice().toLocaleString()} CFA</span>
               </div>
               <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Livraison</span>
                  <span className="text-emerald-400">Gratuite</span>
               </div>
               <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <span className="text-xs font-black uppercase">Total TTC</span>
                  <span className="text-2xl font-[1000] text-blue-400 tracking-tighter">{getTotalPrice().toLocaleString()} CFA</span>
               </div>
            </div>

            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white hover:text-blue-600 transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95">
              Payer maintenant <Lock className="w-4 h-4" />
            </button>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
               <ShieldCheck className="w-4 h-4 text-emerald-400" />
               <span className="text-[8px] font-bold uppercase tracking-widest">Paiement 100% sécurisé via SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}