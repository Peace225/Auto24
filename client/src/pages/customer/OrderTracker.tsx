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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <h2 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Suivi Logistique</h2>
        
        {/* Filtre des commandes */}
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none bg-transparent cursor-pointer"
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
          <div key={order.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-10 shadow-sm overflow-hidden relative">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">
                  Commande #{order.id.slice(0,8).toUpperCase()}
                </p>
                <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter italic">
                  Arrivée prévue : <span className="text-orange-500">24h - 48h</span>
                </h3>
              </div>
              <div className="text-left md:text-right">
                 <p className="text-2xl font-[1000] text-slate-900">
                   {(order.amount || 0).toLocaleString()} <span className="text-xs text-slate-400">CFA</span>
                 </p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                   {order.payment_method || 'Réglé via Mobile Money'}
                 </p>
              </div>
            </div>

            {/* --- PROGRESS BAR --- */}
            <div className="relative flex justify-between mt-4 md:mt-8">
              {/* Ligne de fond (Grise) */}
              <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full z-0"></div>
              
              {/* Ligne active (Bleue) */}
              <div 
                className="absolute top-5 left-0 h-1 bg-blue-600 transition-all duration-1000 rounded-full z-0"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
              ></div>

              {STEPS.map((step, index) => {
                const isCompleted = index <= activeStep;
                const isCurrent = index === activeStep;

                return (
                  <div key={index} className="relative z-10 flex flex-col items-center gap-3 bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500
                      ${isCompleted ? 'bg-blue-600 border-blue-100 text-white shadow-lg' : 'bg-white border-slate-50 text-slate-300'}
                      ${isCurrent ? 'ring-4 ring-blue-50 scale-110' : ''}`}
                    >
                      <step.icon className="w-4 h-4" />
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest text-center ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                     <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                    Point de livraison : <span className="text-slate-900 block sm:inline mt-0.5 sm:mt-0">{order.delivery_address || 'Abidjan, Cocody'}</span>
                  </p>
               </div>
               <button className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-2 transition-transform">
                 Détails de la facture <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        );
      }) : (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
           <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             {filterStatus === 'All' ? 'Aucun colis en route' : `Aucune commande au statut : ${filterStatus}`}
           </p>
        </div>
      )}
    </div>
  );
}