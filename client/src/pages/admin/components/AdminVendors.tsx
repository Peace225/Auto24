import { useState, useEffect } from 'react';
import { 
  Store, CheckCircle2, XCircle, Search, 
  MapPin, Phone, Loader2, ShieldAlert,
  Building2, Calendar, User
} from 'lucide-react';
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
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    const channel = supabase.channel('admin-vendors-realtime').subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdateStatus = async (vendorId: string, newStatus: string, storeName: string) => {
    const actionLabel = newStatus === 'approved' ? 'APPROUVER' : 'REJETER';
    if (!window.confirm(`${actionLabel} "${storeName}" ?`)) return;

    setIsUpdating(vendorId);
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', vendorId);
      if (error) throw error;
      toast.success("Mis à jour");
      fetchVendors(); 
    } catch (error: any) {
      toast.error("Erreur");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (v.store_name?.toLowerCase().includes(searchLower)) || (v.phone?.includes(searchTerm)) || (v.commune?.toLowerCase().includes(searchLower));
    const matchesFilter = filter === 'all' || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = vendors.filter(v => v.status === 'pending').length;

  return (
    <div className="space-y-4 md:space-y-8 w-full animate-in fade-in duration-500 pb-20">
      
      {/* 🟢 HEADER MINIATURISÉ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Store className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-[1000] uppercase text-[#111625] tracking-tight italic">
              Boutiques
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200">
                {vendors.length} Dossiers
              </span>
              {pendingCount > 0 && (
                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border bg-orange-50 text-orange-600 border-orange-200 flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5" /> {pendingCount} New
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg text-[9px] md:text-[10px] font-black border border-slate-200 outline-none focus:border-blue-500 uppercase"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg font-black text-[9px] md:text-[10px] uppercase outline-none"
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>

      {/* 🟢 CONTENU : CARTES (MOBILE) OU TABLEAU (DESKTOP) */}
      <div className="bg-white rounded-xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* VUE MOBILE : Cartes Nano */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></div>
          ) : filteredVendors.map((vendor) => (
            <div key={vendor.id} className="p-4 space-y-3 relative">
              {isUpdating === vendor.id && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <img 
                  src={vendor.avatar_url || `https://ui-avatars.com/api/?name=${vendor.store_name}`} 
                  className="w-10 h-10 rounded-lg object-cover border border-slate-100" 
                  alt=""
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[10px] font-[1000] text-slate-900 uppercase truncate max-w-[150px]">{vendor.store_name}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border ${
                      vendor.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      vendor.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                    <Calendar size={10}/> {new Date(vendor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-700">
                  <Phone size={10} className="text-emerald-500" /> {vendor.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                  <MapPin size={10} className="text-blue-500" /> {vendor.commune || 'Abidjan'}
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-[9px] font-black text-slate-600 italic">
                  <Building2 size={11} /> {vendor.activity || 'Pièces Détachées'}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdateStatus(vendor.id, 'approved', vendor.store_name)}
                  disabled={vendor.status === 'approved'}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 active:bg-emerald-500 active:text-white transition-all disabled:opacity-30"
                >
                  Approuver
                </button>
                <button 
                  onClick={() => handleUpdateStatus(vendor.id, 'rejected', vendor.store_name)}
                  disabled={vendor.status === 'rejected'}
                  className="flex-1 py-2 bg-red-50 text-red-600 text-[8px] font-black uppercase rounded-lg border border-red-100 active:bg-red-500 active:text-white transition-all disabled:opacity-30"
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* VUE DESKTOP : Tableau classique */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-5">Identité</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Activité</th>
                <th className="px-6 py-5 text-center">Statut</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <img src={vendor.avatar_url || `https://ui-avatars.com/api/?name=${vendor.store_name}`} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{vendor.store_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">Inscrit le {new Date(vendor.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-700"><Phone className="w-3 h-3 text-emerald-500" /> {vendor.phone}</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><MapPin className="w-3 h-3 text-blue-500" /> {vendor.commune}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[10px] font-black text-slate-600 italic"><Building2 className="inline w-3.5 h-3.5 mr-2" /> {vendor.activity}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                      vendor.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      vendor.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleUpdateStatus(vendor.id, 'approved', vendor.store_name)} disabled={isUpdating === vendor.id || vendor.status === 'approved'} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => handleUpdateStatus(vendor.id, 'rejected', vendor.store_name)} disabled={isUpdating === vendor.id || vendor.status === 'rejected'} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"><XCircle className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredVendors.length === 0 && (
          <div className="py-20 text-center text-slate-400 uppercase text-[9px] font-black">Aucun dossier trouvé</div>
        )}
      </div>
    </div>
  );
}