import { useState } from 'react';
import { 
  LayoutDashboard, Car, Package, Users, 
  Settings, PlusCircle, Bell, Search, 
  TrendingUp, ShieldCheck, Database, LogOut,
  MoreVertical, CheckCircle2, AlertCircle
} from 'lucide-react';
import AddProduct from '../vendor/AddProduct'; 
import VehicleManager from './VehicleManager'; 

export default function AdminGlobalDashboard() {
  // 🟢 On s'assure que tous les types d'onglets sont bien définis
  const [activeTab, setActiveTab] = useState<'stats' | 'ktype' | 'catalog' | 'users' | 'add_product'>('stats');

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
      
      {/* --- SIDEBAR SUPER ADMIN (Slate-900) --- */}
      <aside className="w-72 bg-slate-900 flex flex-col fixed h-full z-50">
        <div className="p-8">
          <h2 className="text-white font-[1000] italic text-2xl tracking-tighter uppercase">
            Admin<span className="text-blue-500">Auto24</span>
          </h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Console de Contrôle</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <AdminNavLink 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            icon={<LayoutDashboard size={20}/>} 
            label="Vue d'ensemble" 
          />
          <AdminNavLink 
            active={activeTab === 'ktype'} 
            onClick={() => setActiveTab('ktype')} 
            icon={<Database size={20}/>} 
            label="Base K-Type (Véhicules)" 
          />
          <AdminNavLink 
            active={activeTab === 'catalog'} 
            onClick={() => setActiveTab('catalog')} 
            icon={<Package size={20}/>} 
            label="Modération Catalogue" 
          />
          <AdminNavLink 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<Users size={20}/>} 
            label="Gestion Utilisateurs" 
          />
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button className="flex items-center gap-4 text-slate-400 hover:text-red-400 transition-all font-black text-[10px] uppercase tracking-widest px-4 py-3 w-full group">
            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-red-500/10 transition-colors">
              <LogOut size={18} />
            </div>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* --- CONTENU PRINCIPAL --- */}
      <main className="flex-1 ml-72 p-10">
        
        {/* TOP BAR DYNAMIQUE */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
              {activeTab === 'stats' && "Performances Globales"}
              {activeTab === 'ktype' && "Référentiel Véhicules"}
              {activeTab === 'catalog' && "Contrôle du Catalogue"}
              {activeTab === 'users' && "Base Utilisateurs"}
              {activeTab === 'add_product' && "Nouvelle Pièce Maître"}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Système de gestion centralisé</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {activeTab === 'catalog' && (
              <button 
                onClick={() => setActiveTab('add_product')}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-[1000] text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-blue-600/20"
              >
                <PlusCircle size={18} /> Ajouter une pièce
              </button>
            )}
          </div>
        </header>

        {/* --- ZONE D'AFFICHAGE DYNAMIQUE --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* 1. STATISTIQUES */}
          {activeTab === 'stats' && <AdminStatsGrid />}
          
          {/* 2. GESTION K-TYPE */}
          {activeTab === 'ktype' && <VehicleManager />}
          
          {/* 3. MODÉRATION CATALOGUE */}
          {activeTab === 'catalog' && (
             <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Package size={24}/></div>
                    <div>
                      <h3 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Flux Produits</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surveillance du contenu vendeur</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">En attente (12)</button>
                    <button className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Validés</button>
                  </div>
                </div>
                
                {/* Placeholder de liste de modération */}
                <div className="border-2 border-dashed border-slate-50 rounded-[2.5rem] py-20 text-center">
                   <AlertCircle className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Chargement du catalogue maître...</p>
                </div>
             </div>
          )}

          {/* 4. GESTION UTILISATEURS (Le morceau manquant) */}
          {activeTab === 'users' && (
             <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl"><Users size={24}/></div>
                   <div>
                      <h3 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Annuaire Global</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendeurs, Garages et Clients</p>
                   </div>
                </div>
                
                {/* Table Placeholder */}
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-[2.5rem] text-center px-10">
                   <Users className="w-12 h-12 text-slate-200 mb-4" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synchronisation de la base utilisateurs Supabase Auth</p>
                </div>
             </div>
          )}

          {/* 5. AJOUT DE PRODUIT */}
          {activeTab === 'add_product' && <AddProduct />}

        </div>
      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS INTERNES ---

function AdminNavLink({ icon, label, onClick, active }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
        active 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 translate-x-2' 
          : 'text-slate-500 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className={active ? "text-white" : "text-slate-600 transition-colors"}>{icon}</span>
      {label}
    </button>
  );
}

function AdminStatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <StatCard label="Ventes Totales" value="24.8M" sub="CFA / ce mois" icon={<TrendingUp className="text-emerald-500"/>} trend="+12.5%" />
      <StatCard label="Véhicules K-Type" value="1,280" sub="Modèles référencés" icon={<Car className="text-blue-500"/>} trend="+5" />
      <StatCard label="Vendeurs Actifs" value="48" sub="Partenaires vérifiés" icon={<ShieldCheck className="text-orange-500"/>} trend="Stable" />
    </div>
  );
}

function StatCard({ label, value, sub, icon, trend }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-[1000] text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
          {trend}
        </span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <h4 className="text-4xl font-[1000] text-slate-900 italic tracking-tighter mb-1">{value}</h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
    </div>
  );
}