import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, LayoutDashboard } from 'lucide-react';
import CustomerSidebar from './CustomerSidebar';
import CustomerSettings from './CustomerSettings'; 
import GarageManager from './GarageManager';
import OrderTracker from './OrderTracker'; 
import ShopCatalogue from './ShopCatalogue'; 

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'garage' | 'appointments' | 'wishlist' | 'settings' | 'shop'>('orders');
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` }, () => fetchUserData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_vehicles', filter: `user_id=eq.${user.id}` }, () => fetchUserData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUserData, user?.id]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-3 lg:ml-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chargement de votre espace...</p>
    </div>
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
      
      <CustomerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 lg:max-w-[calc(100vw-256px)] h-screen overflow-y-auto pb-24 lg:pb-0">
        
        {/* 🟢 HEADER COMPACT (Réduit sur mobile) */}
        <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 md:py-6 relative lg:sticky lg:top-0 z-20 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 lg:hidden" />
                <h1 className="text-lg md:text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
                  {activeTab === 'orders' && "Mes Commandes"}
                  {activeTab === 'garage' && "Mon Garage"}
                  {activeTab === 'appointments' && "Rendez-vous"}
                  {activeTab === 'wishlist' && "Mes Favoris"}
                  {activeTab === 'settings' && "Paramètres"}
                  {activeTab === 'shop' && "Catalogue"}
                </h1>
              </div>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {activeTab === 'settings' ? 'Gérez votre profil' : 
                  activeTab === 'shop' ? 'Pièces compatibles' : 
                  'Gestion de votre flotte'}
              </p>
            </div>
        </header>

        {/* 🟢 PADDING RÉDUIT POUR LE CONTENU */}
        <div className="p-3 md:p-8 lg:p-10">
          
          <div className="space-y-4 md:space-y-6">
            
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

            {/* 🟢 PLACEHOLDER RÉDUIT (Évite les blocs vides géants) */}
            {activeTab === 'appointments' && (
              <div className="bg-white rounded-2xl md:rounded-[3rem] border-2 border-dashed border-slate-100 p-10 md:p-20 text-center animate-in fade-in duration-500">
                 <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Service en cours de déploiement</p>
              </div>
            )}

            {activeTab === 'settings' && <CustomerSettings />}

          </div>
        </div>
      </main>
    </div>
  );
}