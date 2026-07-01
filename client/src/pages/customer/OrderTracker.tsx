import { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, ChevronRight, Filter } from 'lucide-react';

const STEPS = [
  { status: 'Payé', icon: Clock, label: 'Validation' },
  { status: 'En préparation', icon: Package, label: 'Préparation' },
  { status: 'Expédié', icon: Truck, label: 'Livraison' },
  { status: 'Livré', icon: CheckCircle2, label: 'Terminé' }
];

export default function OrderTracker({ orders = [] }: { orders?: any[] }) {
  const [filterStatus, setFilterStatus] = useState('All');

  const getActiveStep = (status: string) => {
    const index = STEPS.findIndex(s => s.status === status);
    return index !== -1 ? index : 0;
  };

  const filteredOrders = filterStatus === 'All'
    ? orders || []
    : (orders || []).filter(order => order?.status === filterStatus);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Filtre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <h2 className="text-lg md:text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Suivi Logistique</h2>
        
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-fit">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="text-xs font-black uppercase tracking-widest text-slate-600 outline-none bg-transparent cursor-pointer w-full"
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

      {filteredOrders?.length > 0 ? filteredOrders.map((order) => {
        const activeStep = getActiveStep(order?.status);

        return (
          <div key={order?.id} className="bg-white border border-slate-100 rounded-2xl p-4 md:p-8 shadow-sm overflow-hidden">
            
            {/* Info Commande */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
                  Cmd #{order?.id?.slice(0, 8)?.toUpperCase()}
                </p>
                <h3 className="text-sm md:text-xl font-[1000] text-slate-900 uppercase tracking-tighter italic">
                  Arrivée prévue : <span className="text-orange-500">24h - 48h</span>
                </h3>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-[1000] text-slate-900">
                  {(order?.amount || 0).toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span>
                </p>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="relative flex justify-between mt-8 mb-4">
              <div className="absolute top-3 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
              <div 
                className="absolute top-3 left-0 h-1 bg-blue-600 transition-all duration-1000 rounded-full"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
              ></div>

              {STEPS.map((step, index) => {
                const isCompleted = index <= activeStep;
                return (
                  <div key={index} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 md:border-4 transition-all duration-500
                      ${isCompleted ? 'bg-blue-600 border-blue-100 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                      <step.icon className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 w-full">
                <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight truncate">
                  Livraison : <span className="text-slate-900">{order?.delivery_address || 'Abidjan, Cocody'}</span>
                </p>
              </div>
              <button className="flex items-center gap-1 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform w-full sm:w-auto justify-end">
                Détails facture <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      }) : (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
           <Package className="w-10 h-10 text-slate-200 mx-auto mb-4" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
             {filterStatus === 'All' ? 'Aucun colis en route' : `Aucune commande : ${filterStatus}`}
           </p>
        </div>
      )}
    </div>
  );
}