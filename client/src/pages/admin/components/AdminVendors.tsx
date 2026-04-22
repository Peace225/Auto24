import { useState, useEffect } from 'react';
import { 
  Store, CheckCircle2, XCircle, Search, 
  MapPin, Phone, Loader2, ShieldAlert,
  Clock, Building2
} from 'lucide-react';
// 🟢 CORRECTION DU CHEMIN : On remonte de 3 niveaux pour atteindre src/lib
import { supabase } from '../../../lib/supabase'; 
import { toast } from 'react-hot-toast';

interface VendorProfile {
  id: string;
  store_name: string;
  activity: string;
  commune: string;
  phone: string;
  status: string;
  avatar_url: string;
  created_at: string;
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error("Erreur chargement vendeurs:", error);
      toast.error("Impossible de charger les dossiers vendeurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();

    const channel = supabase
      .channel('admin-vendors-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: "role=eq.vendor" 
      }, () => fetchVendors())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (vendorId: string, newStatus: string, storeName: string) => {
    const actionLabel = newStatus === 'approved' ? 'APPROUVER' : 'REJETER';
    if (!window.confirm(`Voulez-vous vraiment ${actionLabel} la boutique "${storeName}" ?`)) return;

    setIsUpdating(vendorId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', vendorId);

      if (error) throw error;
      
      toast.success(`Statut mis à jour : ${newStatus.toUpperCase()}`);
      // fetchVendors() sera appelé automatiquement par le canal Realtime, 
      // mais on le force ici pour une réactivité immédiate de l'UI
      fetchVendors(); 
    } catch (error: any) {
      console.error("Erreur mise à jour:", error);
      toast.error(error.message || "Erreur lors de la validation");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (v.store_name?.toLowerCase().includes(searchLower)) || 
      (v.phone?.includes(searchTerm)) ||
      (v.commune?.toLowerCase().includes(searchLower));
    
    const matchesFilter = filter === 'all' || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = vendors.filter(v => v.status === 'pending').length;

  return (
    <div className="space-y-6 md:space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER ADMIN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-[1000] uppercase text-[#111625] tracking-tighter italic">
                Gestion des Boutiques
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200">
                  {vendors.length} Dossiers
                </span>
                {pendingCount > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-orange-50 text-orange-600 border-orange-200 animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> {pendingCount} En attente
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher boutique..." 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase placeholder:text-slate-400"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-3.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">TOUS LES STATUTS</option>
            <option value="pending">EN ATTENTE ({pendingCount})</option>
            <option value="approved">APPROUVÉS</option>
            <option value="rejected">REJETÉS</option>
          </select>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto p-0">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-6 py-5">Identité & Date</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Activité</th>
                <th className="px-6 py-5 text-center">Statut</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 uppercase text-[10px] font-black">Aucun résultat</td>
                </tr>
              ) : filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img 
                          src={vendor.avatar_url || `https://ui-avatars.com/api/?name=${vendor.store_name}`} 
                          className="w-full h-full object-cover" 
                          alt=""
                        />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{vendor.store_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">Inscrit le {new Date(vendor.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-700">
                        <Phone className="w-3 h-3 text-emerald-500" /> {vendor.phone}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <MapPin className="w-3 h-3 text-blue-500" /> {vendor.commune}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase italic">
                      <Building2 className="w-3.5 h-3.5" /> {vendor.activity}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      vendor.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      vendor.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {vendor.status === 'pending' ? 'En attente' : vendor.status === 'approved' ? 'Validé' : 'Rejeté'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(vendor.id, 'approved', vendor.store_name)}
                        disabled={isUpdating === vendor.id || vendor.status === 'approved'}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-100 disabled:opacity-30"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(vendor.id, 'rejected', vendor.store_name)}
                        disabled={isUpdating === vendor.id || vendor.status === 'rejected'}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-100 disabled:opacity-30"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
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