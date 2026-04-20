import { Package, Truck, CheckCircle2, Clock, MapPin, ChevronRight } from 'lucide-react';

const STEPS = [
  { status: 'Payé', icon: Clock, label: 'Validation' },
  { status: 'En préparation', icon: Package, label: 'Préparation' },
  { status: 'Expédié', icon: Truck, label: 'Livraison' },
  { status: 'Livré', icon: CheckCircle2, label: 'Terminé' }
];

export default function OrderTracker({ orders }: { orders: any[] }) {
  
  const getActiveStep = (status: string) => {
    const index = STEPS.findIndex(s => s.status === status);
    return index !== -1 ? index : 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter px-2">Suivi Logistique</h2>
      
      {orders.length > 0 ? orders.map((order) => {
        const activeStep = getActiveStep(order.status);
        
        return (
          <div key={order.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-10 shadow-sm overflow-hidden relative">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Commande #{order.id.slice(0,8).toUpperCase()}</p>
                <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter italic">Arrivée prévue : <span className="text-orange-500">24h - 48h</span></h3>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-[1000] text-slate-900">{order.amount.toLocaleString()} <span className="text-xs text-slate-400">CFA</span></p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Réglé via Mobile Money</p>
              </div>
            </div>

            {/* --- PROGRESS BAR PREMIUM --- */}
            <div className="relative flex justify-between">
              {/* Ligne de fond */}
              <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full z-0"></div>
              {/* Ligne active */}
              <div 
                className="absolute top-5 left-0 h-1 bg-blue-600 transition-all duration-1000 rounded-full z-0"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
              ></div>

              {STEPS.map((step, index) => (
                <div key={index} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500
                    ${index <= activeStep ? 'bg-blue-600 border-blue-100 text-white shadow-lg' : 'bg-white border-slate-50 text-slate-300'}`}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${index <= activeStep ? 'text-slate-900' : 'text-slate-300'}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                     <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Point de livraison : <span className="text-slate-900">{order.delivery_address || 'Abidjan, Cocody'}</span></p>
               </div>
               <button className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-2 transition-transform">
                  Détails de la facture <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        );
      }) : (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
           <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun colis en route</p>
        </div>
      )}
    </div>
  );
}