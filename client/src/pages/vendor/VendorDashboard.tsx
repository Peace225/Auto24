import { useState, useEffect } from 'react';
import { Package, ShoppingCart, TrendingUp, ShieldAlert, CheckCircle2, ArrowRight, Star, Zap, Crown, BarChart3, Users, Rocket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

// Fausses données pour l'exemple
const RECENT_ORDERS = [
  { id: 'SA24-0012', client: 'Kouassi Jean', status: 'En attente', amount: 45000, date: 'Aujourd\'hui' },
  { id: 'SA24-0011', client: 'Touré Marc', status: 'Livré', amount: 120000, date: 'Hier' },
];

const PACKAGES = [
  {
    id: 'free',
    name: 'Essentiel',
    price: '0 CFA',
    icon: <Star className="w-5 h-5 text-slate-400" />,
    features: ['10 produits max', 'Visibilité basique'],
    color: 'slate'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '5 000',
    icon: <Zap className="w-5 h-5 text-white" />,
    badge: 'CHOIX N°1',
    features: ['Stock illimité', 'Vendeur Fiable'],
    color: 'blue'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '15 000',
    icon: <Crown className="w-5 h-5 text-orange-500" />,
    features: ['Bannière Accueil', 'Commission 1%'],
    color: 'orange'
  }
];

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState({ status: 'unverified', plan: 'free' });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('vendor_status, subscription_plan')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setVendorData({ 
          status: data.vendor_status || 'unverified', 
          plan: data.subscription_plan || 'free' 
        });
      }
      setTimeout(() => setIsLoaded(true), 100);
    };
    fetchData();
  }, [user]);

  return (
    <div className={`space-y-5 md:space-y-8 w-full transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      
      {/* 🔴 SECTION UPSELL */}
      {vendorData.plan === 'free' && (
        <div className="bg-slate-900 rounded-3xl md:rounded-[2rem] shadow-2xl relative overflow-hidden border border-slate-800 group mt-2 w-full">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-emerald-400 to-orange-500"></div>
          
          {/* Effet lumineux de fond */}
          <div className="absolute top-1/2 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none transition-all duration-1000"></div>
          
          <div className="p-5 md:p-8 lg:p-12 flex flex-col xl:flex-row gap-8 lg:gap-12 items-center relative z-10 w-full">
            
            {/* Partie Gauche : Éducation & Preuve Sociale */}
            <div className="w-full xl:w-5/12 text-center xl:text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/5 text-blue-400 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10 backdrop-blur-sm">
                <Rocket className="w-3.5 h-3.5" /> Propulsez vos ventes
              </div>
              <h2 className="text-[1.35rem] sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight mb-5 leading-tight">
                Vendez <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">4x plus</span> en Pro.
              </h2>
              
              <div className="space-y-4 text-left max-w-sm mx-auto xl:mx-0">
                <div className="flex gap-3 md:gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xs md:text-sm uppercase tracking-tight mb-0.5">Faites sauter la limite</h4>
                    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed font-medium">Ne laissez pas votre potentiel bloqué à 10 pièces.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 md:gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-lg">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xs md:text-sm uppercase tracking-tight mb-0.5">Badge de Confiance</h4>
                    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed font-medium">Les vendeurs vérifiés convertissent 80% en plus.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Partie Droite : Les Grilles de Prix */}
            <div className="w-full xl:w-7/12 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-4">
              {PACKAGES.map((pkg) => (
                <div 
                  key={pkg.id} 
                  onClick={() => navigate('/vendor/settings')}
                  className={`rounded-2xl p-4 sm:p-5 relative transition-all duration-300 cursor-pointer flex flex-col h-full group/card
                    ${pkg.id === 'pro' 
                      ? 'bg-blue-600 border-none shadow-xl shadow-blue-600/40 md:-translate-y-3 md:scale-105 z-10' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md z-0'}
                  `}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-900 px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
                      {pkg.badge}
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center text-center mb-4 sm:mb-6 pt-2">
                    <div className={`p-2.5 rounded-xl mb-2 sm:mb-3 transition-transform group-hover/card:scale-110 duration-300 ${pkg.id === 'pro' ? 'bg-white/20' : 'bg-slate-800'}`}>
                      {pkg.icon}
                    </div>
                    <h3 className={`font-black uppercase tracking-tight text-xs sm:text-sm mb-1 ${pkg.id === 'pro' ? 'text-white' : 'text-slate-200'}`}>{pkg.name}</h3>
                    <div className={`text-xl sm:text-2xl font-black leading-none ${pkg.id === 'pro' ? 'text-white' : 'text-white'}`}>
                      {pkg.price} {pkg.id !== 'free' && <span className={`text-[8px] sm:text-[9px] font-bold tracking-widest uppercase ${pkg.id === 'pro' ? 'text-blue-200' : 'text-slate-500'}`}>/mois</span>}
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4 sm:mb-6 flex-grow">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className={`flex items-start gap-1.5 text-[9px] sm:text-[10px] font-bold leading-tight ${pkg.id === 'pro' ? 'text-blue-50' : 'text-slate-400'}`}>
                        <CheckCircle2 className={`w-3 h-3 shrink-0 ${pkg.id === 'pro' ? 'text-white' : 'text-slate-600'}`} /> 
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-2.5 sm:py-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all mt-auto
                    ${pkg.id === 'pro' 
                      ? 'bg-white text-blue-900 hover:bg-slate-100 shadow-md' 
                      : 'bg-white/10 text-white hover:bg-white/20'}
                  `}>
                    Choisir
                  </button>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}

      {/* ALERTE CERTIFICATION */}
      {vendorData.status !== 'approved' && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
               <ShieldAlert className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-black text-orange-900 uppercase text-[11px] sm:text-xs mb-0.5">Identité Non Vérifiée</h3>
              <p className="text-[9px] sm:text-[10px] font-bold text-orange-700/80 tracking-wide">Fournissez vos documents (RCCM & CNI).</p>
            </div>
          </div>
          <Link to="/vendor/settings" className="w-full sm:w-auto text-center whitespace-nowrap bg-orange-600 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-orange-700 transition-all shadow-md active:scale-95">
            Fournir documents
          </Link>
        </div>
      )}

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[8px] sm:text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">+12% mois</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-0.5">450k</h3>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">CA Net (CFA)</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[8px] sm:text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">3 à traiter</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-0.5">14</h3>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Commandes</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[8px] sm:text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">Bientôt plein</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-0.5">8 <span className="text-base sm:text-xl text-slate-300">/ 10</span></h3>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Capacité stock</p>
        </div>
      </div>

      {/* COMMANDES RÉCENTES */}
      <div className="bg-white rounded-2xl md:rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden w-full">
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight">Dernières Commandes</h2>
          </div>
          <Link to="/vendor/orders" className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-slate-900 transition-colors bg-white px-3 py-1.5 md:py-2 rounded-lg border border-slate-200 shadow-sm">
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        {/* Le conteneur overflow-x-auto est crucial pour éviter que le tableau ne casse le design sur mobile */}
        <div className="w-full overflow-x-auto p-0">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-slate-400">
                <th className="p-4 font-black">N° Commande</th>
                <th className="p-4 font-black">Client</th>
                <th className="p-4 font-black">Montant Net</th>
                <th className="p-4 font-black">Statut</th>
                <th className="p-4 font-black text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4 font-black text-blue-600 text-[10px] md:text-xs">{order.id}</td>
                  <td className="p-4 font-bold text-slate-900 text-[10px] md:text-xs">{order.client}</td>
                  <td className="p-4 font-black text-slate-900 text-[10px] md:text-xs">{order.amount.toLocaleString()} <small className="text-slate-400 font-bold ml-1">CFA</small></td>
                  <td className="p-4">
                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border ${
                      order.status === 'En attente' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-[8px] md:text-[9px] font-black text-slate-500 bg-white border border-slate-200 px-3 py-1.5 md:py-2 rounded-lg group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm active:scale-95">
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}