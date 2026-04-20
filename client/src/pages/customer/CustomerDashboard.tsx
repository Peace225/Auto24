import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, Package, Car, ChevronRight, Plus, Trash2, ShoppingBag } from 'lucide-react';
import CustomerSidebar from './CustomerSidebar';
import CustomerSettings from './CustomerSettings'; // 🟢 Importation du nouveau composant

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'garage' | 'appointments' | 'wishlist' | 'settings'>('orders');
  
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const { data: ords } = await supabase.from('orders').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
      if (ords) setOrders(ords);

      const { data: cars } = await supabase.from('user_vehicles').select('*').eq('user_id', user.id);
      setVehicles(cars || []);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 lg:ml-64">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialisation de votre espace...</p>
    </div>
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
      
      {/* 🟢 SIDEBAR : Gère la navigation via activeTab */}
      <CustomerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 lg:max-w-[calc(100vw-256px)] h-screen overflow-y-auto">
        
        <header className="bg-white border-b border-slate-100 px-8 py-6 sticky top-0 z-20 flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
               {/* Titre dynamique */}
               {activeTab === 'orders' && "Mes Commandes"}
               {activeTab === 'garage' && "Mon Garage"}
               {activeTab === 'appointments' && "Mes Rendez-vous"}
               {activeTab === 'wishlist' && "Mes Favoris"}
               {activeTab === 'settings' && "Paramètres"}
             </h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {activeTab === 'settings' ? 'Gérez vos informations personnelles' : 'Gérez votre flotte et vos commandes'}
             </p>
           </div>
        </header>

        <div className="p-8 lg:p-10">
          
          {/* TABS OPTIONNELS (Visible uniquement sur Mobile ou si tu veux une double navigation) */}
          <div className="flex gap-4 mb-8 lg:hidden overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              Commandes ({orders.length})
            </button>
            <button 
              onClick={() => setActiveTab('garage')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'garage' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              Garage ({vehicles.length})
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              Paramètres
            </button>
          </div>

          <div className="space-y-6">
            
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                {orders.length > 0 ? orders.map((order) => (
                  <div key={order.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-blue-300 transition-all shadow-sm gap-4">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Ref: {order.id.slice(0,8).toUpperCase()}</p>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight">Pièces Détachées</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 md:text-right">
                      <div>
                        <p className="text-lg font-black text-slate-900">{order.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase">CFA</span></p>
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${order.status === 'Livré' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {order.status}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors hidden md:block" />
                    </div>
                  </div>
                )) : (
                  <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune commande pour le moment</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'garage' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {vehicles.map((car) => (
                  <div key={car.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] flex items-center justify-end p-6 -mr-4 -mt-4 transition-all group-hover:bg-blue-600 group-hover:text-white text-blue-200">
                      <Car className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{car.year} • {car.fuel_type}</p>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-6">{car.make} {car.model}</h3>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">Chercher Pièces</button>
                      <button className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                <button className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-slate-400 hover:text-blue-600 h-full min-h-[200px]">
                   <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white"><Plus className="w-6 h-6" /></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ajouter un véhicule</span>
                </button>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Rendez-vous en construction</p>
              </div>
            )}

            {/* 🟢 INTÉGRATION DU COMPOSANT PARAMÈTRES */}
            {activeTab === 'settings' && <CustomerSettings />}

          </div>
        </div>
      </main>
    </div>
  );
}