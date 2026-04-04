import { Package, CreditCard, AlertTriangle, ChevronRight, BellRing } from 'lucide-react';

export default function VendorNotifications() {
  const notifications = [
    { 
        id: 1, 
        title: 'Nouvelle commande #4592', 
        desc: 'Une plaquette de frein Brembo a été commandée par un client.', 
        time: 'Il y a 5 min', 
        icon: Package, 
        color: 'bg-blue-50 text-blue-600 border-blue-100' 
    },
    { 
        id: 2, 
        title: 'Paiement confirmé', 
        desc: 'Le virement de 145,000 CFA est en cours vers Bridge Bank.', 
        time: 'Il y a 2h', 
        icon: CreditCard, 
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100' 
    },
    { 
        id: 3, 
        title: 'Alerte Stock Critique', 
        desc: 'Le stock de "Huile Total 5W40" est inférieur à 5 unités.', 
        time: 'Hier', 
        icon: AlertTriangle, 
        color: 'bg-amber-50 text-amber-600 border-amber-100' 
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 pt-16 pb-24 max-w-4xl mx-auto px-4">
      
      {/* HEADER PROFESSIONNEL */}
      <div className="flex items-center gap-4 mb-14">
        <div className="p-4 bg-slate-900 rounded-3xl shadow-lg shadow-slate-200">
          <BellRing className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-[1000] uppercase text-slate-900 tracking-[ -0.05em] leading-none">
            Centre de notifications
          </h1>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mt-2 ml-1">
            Activité en temps réel • Abidjan
          </p>
        </div>
      </div>
      
      {/* LISTE DES NOTIFICATIONS */}
      <div className="grid gap-5">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-slate-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 flex items-center gap-6 cursor-pointer"
          >
            {/* ICON WRAPPER AVEC DOUBLE BORDURE */}
            <div className={`w-16 h-16 rounded-[1.5rem] flex-shrink-0 flex items-center justify-center border-2 transition-transform duration-500 group-hover:scale-110 ${n.color}`}>
              <n.icon className="w-7 h-7" />
            </div>

            {/* TEXT CONTENT */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="text-[12px] font-[1000] uppercase text-slate-900 tracking-wider truncate">
                    {n.title}
                </h3>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 px-3 py-1 rounded-full group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                    {n.time}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold leading-relaxed pr-6 line-clamp-2">
                {n.desc}
              </p>
            </div>

            {/* INDICATEUR DE DIRECTION DISCRET */}
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                <ChevronRight className="w-5 h-5" />
            </div>

            {/* PETITE BARRE DÉCORATIVE SUR LE CÔTÉ */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-orange-500 rounded-r-full transition-all" />
          </div>
        ))}
      </div>

      {/* FOOTER DISCRET */}
      <div className="mt-12 text-center">
        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-500 transition-colors">
          Marquer toutes comme lues
        </button>
      </div>
    </div>
  );
}