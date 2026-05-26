import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, MessageSquare, Package, User, MapPin, CheckCircle, Truck, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VendorOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});

  // ... (votre logique fetchOrders et updateStatus reste identique) ...

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'preparing': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock };
      case 'ready': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle };
      case 'shipped': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Truck };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Package };
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">PILOTAGE COMMANDES</h1>
        <p className="text-slate-500">Suivi en temps réel des expéditions</p>
      </header>

      <div className="grid gap-6">
        {orders.map((item) => {
          const config = getStatusConfig(item.vendor_status);
          return (
            <div key={item.id} className={`bg-white rounded-3xl p-6 border-2 transition-all shadow-sm ${config.border}`}>
              {/* Header de la carte */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Commande #{item.id.slice(-4)}</span>
                  <h3 className="text-xl font-black text-slate-900">{item.product_name}</h3>
                </div>
                <div className={`px-4 py-1.5 rounded-full font-black text-xs uppercase flex items-center gap-2 ${config.bg} ${config.color}`}>
                  <config.icon size={14} /> {item.vendor_status || 'En attente'}
                </div>
              </div>

              {/* Infos Client en Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <User className="text-slate-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Client</p>
                    <p className="text-sm font-bold">{item.order?.client_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <MapPin className="text-slate-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Livraison</p>
                    <p className="text-sm font-bold">{item.order?.delivery_city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Note et Actions */}
              <div className="space-y-4">
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-slate-300" size={16} />
                  <textarea
                    className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Note interne pour l'équipe admin..."
                    value={note[item.id] || ''}
                    onChange={(e) => setNote({...note, [item.id]: e.target.value})}
                  />
                </div>

                <div className="flex gap-2">
                  {['preparing', 'ready', 'shipped'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(item.id, status)}
                      className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${
                        item.vendor_status === status 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}