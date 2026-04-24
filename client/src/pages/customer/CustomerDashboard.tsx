import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';
import CustomerSidebar from './CustomerSidebar';
import CustomerSettings from './CustomerSettings'; 
import GarageManager from './GarageManager';
import OrderTracker from './OrderTracker'; 
// 🟢 Importation du nouveau composant Catalogue
import ShopCatalogue from './ShopCatalogue'; 

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  // 🟢 Ajout de 'shop' dans les types d'onglets
  const [activeTab, setActiveTab] = useState<'orders' | 'garage' | 'appointments' | 'wishlist' | 'settings' | 'shop'>('orders');
  
  // 🟢 Nouvel état pour mémoriser le véhicule choisi dans le garage
  const [shopVehicleFilter, setShopVehicleFilter] = useState<{id: string, name: string} | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;
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

  useEffect(() => { 
    fetchUserData(); 

    if (!user?.id) return;

    const channel = supabase
      .channel('customer-dashboard-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `customer_id=eq.${user.id}` 
      }, () => {
        fetchUserData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_vehicles',
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchUserData();
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [fetchUserData, user?.id]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 lg:ml-64">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialisation de votre espace...</p>
    </div>
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
      
      <CustomerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 🟢 Ajout du padding-bottom (pb-28) pour mobile pour ne pas cacher le contenu avec la Bottom Bar */}
      <main className="flex-1 lg:max-w-[calc(100vw-256px)] h-screen overflow-y-auto pb-28 lg:pb-0">
        
        {/* 🟢 Remplacement de "sticky top-0" par "lg:sticky lg:top-0 relative" pour que ça scrolle sur mobile */}
        <header className="bg-white border-b border-slate-100 px-6 lg:px-8 py-6 relative lg:sticky lg:top-0 z-20 flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
               {activeTab === 'orders' && "Mes Commandes"}
               {activeTab === 'garage' && "Mon Garage"}
               {activeTab === 'appointments' && "Mes Rendez-vous"}
               {activeTab === 'wishlist' && "Mes Favoris"}
               {activeTab === 'settings' && "Paramètres"}
               {activeTab === 'shop' && "Boutique & Catalogue"}
             </h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {activeTab === 'settings' ? 'Gérez vos informations personnelles' : 
                 activeTab === 'shop' ? 'Trouvez les pièces compatibles avec vos véhicules' : 
                 'Gérez votre flotte et vos commandes'}
             </p>
           </div>
        </header>

        <div className="p-4 sm:p-8 lg:p-10">
          
          <div className="flex gap-4 mb-8 lg:hidden overflow-x-auto pb-2 scrollbar-hide">
            {/* ... Boutons mobiles existants si vous en aviez d'autres ... */}
          </div>

          <div className="space-y-6">
            
            {activeTab === 'orders' && (
              <OrderTracker orders={orders} />
            )}

            {activeTab === 'garage' && (
              <GarageManager 
                vehicles={vehicles} 
                refresh={fetchUserData} 
                setActiveTab={setActiveTab} 
                setShopVehicleFilter={setShopVehicleFilter}
              />
            )}

            {activeTab === 'shop' && (
              <ShopCatalogue 
                vehicleFilter={shopVehicleFilter} 
                clearVehicleFilter={() => setShopVehicleFilter(null)} 
              />
            )}

            {activeTab === 'appointments' && (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Rendez-vous en construction</p>
              </div>
            )}

            {activeTab === 'settings' && <CustomerSettings />}

          </div>
        </div>
      </main>
    </div>
  );
}