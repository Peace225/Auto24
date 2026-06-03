import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, LayoutDashboard } from 'lucide-react';
import CustomerSidebar from './CustomerSidebar';
import CustomerSettings from './CustomerSettings';
import GarageManager from './GarageManager';
import OrderTracker from './OrderTracker';
import ShopCatalogue from './ShopCatalogue';
import DashboardFavorites from './DashboardFavorites';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'garage' | 'appointments' | 'wishlist' | 'settings' | 'shop'>('orders');
  const [shopVehicleFilter, setShopVehicleFilter] = useState<{id: string, name: string} | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchUserData = useCallback(async () => {
    // 🟢 CORRECTION DU BUG DE CHARGEMENT INFINI ICI
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const { data: ords } = await supabase.from('orders').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
      setOrders(ords || []);

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
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement de votre espace...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row bg-[#F8FAFC] min-h-screen font-sans">

      <CustomerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full lg:max-w-[calc(100vw-256px)] h-screen overflow-y-auto pb-24 lg:pb-0">

        <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 md:py-6 relative lg:sticky lg:top-0 z-20 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <LayoutDashboard className="w-4 h-4 text-blue-600 lg:hidden" />
                <h1 key={activeTab} className="text-xl md:text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
                  {activeTab === 'orders' && "Mes Commandes"}
                  {activeTab === 'garage' && "Mon Garage"}
                  {activeTab === 'appointments' && "Rendez-vous"}
                  {activeTab === 'wishlist' && "Mes Favoris"}
                  {activeTab === 'settings' && "Paramètres"}
                  {activeTab === 'shop' && "Catalogue"}
                </h1>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                 {activeTab === 'settings' ? 'Gérez votre profil' :
                  activeTab === 'shop' ? 'Pièces compatibles' :
                  activeTab === 'wishlist' ? 'Vos pièces sauvegardées' :
                  'Gestion de votre flotte'}
              </p>
            </div>
        </header>

        <div className="p-4 md:p-8 lg:p-10">

          <div className="space-y-4 md:space-y-6">

            {activeTab === 'orders' && (
              <div key="orders-tab">
                <OrderTracker orders={orders || []} />
              </div>
            )}

            {activeTab === 'garage' && (
              <div key="garage-tab">
                <GarageManager
                  vehicles={vehicles || []}
                  refresh={fetchUserData}
                  setActiveTab={setActiveTab}
                  setShopVehicleFilter={setShopVehicleFilter}
                />
              </div>
            )}

            {activeTab === 'shop' && (
              <div key="shop-tab">
                <ShopCatalogue
                  vehicleFilter={shopVehicleFilter}
                  clearVehicleFilter={() => setShopVehicleFilter(null)}
                />
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div key="wishlist-tab">
                <DashboardFavorites />
              </div>
            )}

            {activeTab === 'appointments' && (
              <div key="appointments-tab" className="bg-white rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-100 p-8 md:p-20 text-center">
                 <p className="text-sm md:text-base font-black text-slate-400 uppercase tracking-widest">Service en cours de déploiement</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div key="settings-tab">
                <CustomerSettings />
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}