import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Car, Package, Users, 
  LogOut, PlusCircle, Bell, Database, ShieldCheck, TrendingUp, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Assurez-vous que ces imports existent et sont valides
import AddProduct from '../vendor/AddProduct'; 
import VehicleManager from './VehicleManager'; 

export default function AdminGlobalDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'ktype' | 'catalog' | 'users' | 'add_product'>('stats');
  const [stats, setStats] = useState({ products: 0, users: 0, vehicles: 0 });
  const [loading, setLoading] = useState(true);

  // Charger les données réelles
  useEffect(() => {
    async function fetchData() {
      try {
        const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: vehCount } = await supabase.from('vehicles').select('*', { count: 'exact', head: true });
        
        setStats({ products: prodCount || 0, users: userCount || 0, vehicles: vehCount || 0 });
      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
      <aside className="w-72 bg-slate-900 flex flex-col fixed h-full z-50">
        <div className="p-8"><h2 className="text-white font-[1000] italic text-2xl tracking-tighter uppercase">Admin<span className="text-blue-500">Auto24</span></h2></div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <AdminNavLink active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<LayoutDashboard size={20}/>} label="Vue d'ensemble" />
          <AdminNavLink active={activeTab === 'ktype'} onClick={() => setActiveTab('ktype')} icon={<Database size={20}/>} label="Base K-Type" />
          <AdminNavLink active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<Package size={20}/>} label="Catalogue" />
          <AdminNavLink active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20}/>} label="Utilisateurs" />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Tableau de bord</h1>
          {activeTab === 'catalog' && (
            <button onClick={() => setActiveTab('add_product')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] uppercase font-black hover:bg-slate-900 transition-all flex items-center gap-3">
              <PlusCircle size={18} /> Ajouter une pièce
            </button>
          )}
        </header>

        <div className="animate-in fade-in duration-500">
          {loading ? (
            <div className="text-center p-20 text-slate-400">Chargement des données...</div>
          ) : (
            <>
              {activeTab === 'stats' && <AdminStatsGrid stats={stats} />}
              {activeTab === 'ktype' && <VehicleManager />}
              {activeTab === 'add_product' && <AddProduct />}
              {activeTab === 'catalog' && <div className="p-20 text-center border-2 border-dashed rounded-3xl">Catalogue vide</div>}
              {activeTab === 'users' && <div className="p-20 text-center border-2 border-dashed rounded-3xl">Gestion Utilisateurs</div>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function AdminNavLink({ icon, label, onClick, active }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>
      {icon} {label}
    </button>
  );
}

function AdminStatsGrid({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <StatCard label="Produits" value={stats.products} icon={<Package className="text-blue-500"/>} />
      <StatCard label="Véhicules" value={stats.vehicles} icon={<Car className="text-purple-500"/>} />
      <StatCard label="Utilisateurs" value={stats.users} icon={<Users className="text-orange-500"/>} />
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
      <div className="mb-4">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      <h4 className="text-4xl font-[1000] text-slate-900 italic tracking-tighter">{value}</h4>
    </div>
  );
}