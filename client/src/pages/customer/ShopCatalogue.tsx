import { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, ChevronRight, Filter } from 'lucide-react';

const STEPS = [
  { status: 'Payé', icon: Clock, label: 'Validation' },
  { status: 'En préparation', icon: Package, label: 'Préparation' },
  { status: 'Expédié', icon: Truck, label: 'Livraison' },
  { status: 'Livré', icon: CheckCircle2, label: 'Terminé' }
];

export default function OrderTracker({ orders }: { orders: any[] }) {
  const [filterStatus, setFilterStatus] = useState('All');
  
  const getActiveStep = (status: string) => {
    const index = STEPS.findIndex(s => s.status === status);
    return index !== -1 ? index : 0;
  };

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  return (
    <div className="space-y-3 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🟢 HEADER MINIATURISÉ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4 px-1 md:px-2">
        <h2 className="text-base md:text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Suivi Logistique</h2>
        
        {/* Filtre des commandes Nano */}
        <div className="flex items-center gap-1 md:gap-2 bg-white px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-2xl border border-slate-100 shadow-sm w-fit">
          <Filter className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
          <select 
            className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none bg-transparent cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Toutes les commandes</option>
            {STEPS.map(step => (
              <option key={step.status} value={step.status}>{step.status}</option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredOrders.length > 0 ? filteredOrders.map((order) => {
        const activeStep = getActiveStep(order.status);
        
        return (
          <div key={order.id} className="bg-white border border-slate-100 rounded-xl md:rounded-[3rem] p-3 md:p-10 shadow-sm overflow-hidden relative">
            
            {/* 🟢 EN-TÊTE DE LA CARTE COMPACT */}
            <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-8 mb-5 md:mb-12">
              <div>
                <p className="text-[7px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-0.5 md:mb-2">
                  Cmd #{order.id.slice(0,8).toUpperCase()}
                </p>
                <h3 className="text-xs md:text-xl font-[1000] text-slate-900 uppercase tracking-tighter italic">
                  Arrivée prévue : <span className="text-orange-500">24h - 48h</span>
                </h3>
              </div>
              <div className="text-left md:text-right">
                 <p className="text-sm md:text-2xl font-[1000] text-slate-900">
                   {(order.amount || 0).toLocaleString()} <span className="text-[7px] md:text-xs text-slate-400">CFA</span>
                 </p>
                 <p className="text-[6px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">
                   {order.payment_method || 'Mobile Money'}
                 </p>
              </div>
            </div>

            {/* 🟢 PROGRESS BAR NANO */}
            <div className="relative flex justify-between mt-4 md:mt-8 px-1 md:px-0">
              {/* Ligne de fond (Grise) plus fine */}
              <div className="absolute top-3 md:top-5 left-0 w-full h-0.5 md:h-1 bg-slate-100 rounded-full z-0"></div>
              
              {/* Ligne active (Bleue) */}
              <div 
                className="absolute top-3 md:top-5 left-0 h-0.5 md:h-1 bg-blue-600 transition-all duration-1000 rounded-full z-0"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
              ></div>

              {STEPS.map((step, index) => {
                const isCompleted = index <= activeStep;
                const isCurrent = index === activeStep;

                return (
                  <div key={index} className="relative z-10 flex flex-col items-center gap-1.5 md:gap-3 bg-white px-1 md:px-2">
                    <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center border-[2px] md:border-4 transition-all duration-500
                      ${isCompleted ? 'bg-blue-600 border-blue-100 text-white shadow-md' : 'bg-white border-slate-50 text-slate-300'}
                      ${isCurrent ? 'ring-2 md:ring-4 ring-blue-50 scale-110' : ''}`}
                    >
                      <step.icon className="w-2.5 h-2.5 md:w-4 md:h-4" />
                    </div>
                    {/* Texte ultra-petit (5px) pour éviter les chevauchements */}
                    <p className={`text-[5px] md:text-[9px] font-black uppercase tracking-widest text-center ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 🟢 PIED DE CARTE & BOUTON RÉDUIT */}
            <div className="mt-5 md:mt-12 pt-3 md:pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
               <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                  <div className="h-6 w-6 md:h-10 md:w-10 bg-orange-50 rounded-md md:rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                     <MapPin className="w-3 h-3 md:w-5 md:h-5" />
                  </div>
                  <p className="text-[7px] md:text-[10px] font-black text-slate-600 uppercase tracking-tight truncate">
                    Livraison : <span className="text-slate-900 block sm:inline mt-0.5 sm:mt-0">{order.delivery_address || 'Abidjan, Cocody'}</span>
                  </p>
               </div>
               <button className="flex items-center justify-center w-full md:w-auto gap-1 md:gap-2 text-blue-600 font-black text-[7px] md:text-[10px] uppercase tracking-widest hover:translate-x-1 md:hover:translate-x-2 transition-transform bg-slate-50 md:bg-transparent py-2 md:py-0 rounded-md md:rounded-none">
                 Détails facture <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
               </button>
            </div>
          </div>
        );
      }) : (
        <div className="bg-white rounded-xl md:rounded-[3rem] p-6 md:p-20 text-center border-2 border-dashed border-slate-100">
           <Package className="w-6 h-6 md:w-12 md:h-12 text-slate-200 mx-auto mb-2 md:mb-4" />
           <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
             {filterStatus === 'All' ? 'Aucun colis en route' : `Aucune commande : ${filterStatus}`}
           </p>
        </div>
      )}
    </div>
  );
}