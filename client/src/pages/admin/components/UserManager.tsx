import { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserX, Trash2, Search, Loader2, 
  Ban, Mail, UserCheck
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'vendor'>('all');

  // 🟢 Fonctions de récupération (useCallback pour éviter les boucles infinies dans useEffect)
  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Erreur de synchronisation");
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  // 🟢 Système Temps Réel
  useEffect(() => {
    fetchUsers();

    // Écoute TOUS les changements sur la table profiles (INSERT, UPDATE, DELETE)
    const profileChannel = supabase
      .channel('admin-user-management')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        (payload) => {
          console.log("Changement détecté:", payload);
          fetchUsers(true); // Mise à jour silencieuse en arrière-plan
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [fetchUsers]);

  const handleUpdateStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) toast.error("Action impossible");
    else toast.success(newStatus === 'blocked' ? "Compte restreint" : "Accès rétabli");
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Supprimer définitivement ce compte ?")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) toast.error("Erreur système");
    else toast.success("Utilisateur effacé");
  };

  const filteredUsers = users.filter(u => 
    (u.store_name?.toLowerCase() || u.full_name?.toLowerCase() || u.email?.toLowerCase())
    .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER COMPACT */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-[9px] text-white outline-none focus:border-amber-500/50 uppercase"
          />
        </div>
        <select 
          value={filterRole}
          onChange={(e: any) => setFilterRole(e.target.value)}
          className="bg-[#0B0F19] border border-white/10 rounded-xl px-2 text-[8px] font-black text-amber-500 uppercase outline-none"
        >
          <option value="all">Tous</option>
          <option value="vendor">Pros</option>
          <option value="client">Clients</option>
        </select>
      </div>

      {/* LISTE FLUIDE */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500 w-6 h-6" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-[#0B0F19] border border-white/5 rounded-xl p-3 flex items-center justify-between group transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${u.role === 'vendor' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {u.store_name?.[0] || u.full_name?.[0] || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[9px] font-[1000] text-white uppercase truncate max-w-[110px]">
                      {u.store_name || u.full_name || 'Utilisateur'}
                    </h4>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'blocked' ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-emerald-500 shadow-[0_0_5px_emerald]'}`} />
                  </div>
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[120px]">
                    {u.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleUpdateStatus(u.id, u.status)}
                  className={`p-2 rounded-lg transition-all ${u.status === 'blocked' ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-slate-400 active:bg-orange-500 active:text-white'}`}
                >
                  {u.status === 'blocked' ? <Ban size={12} /> : <UserX size={12} />}
                </button>

                <button 
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-2 bg-white/5 text-slate-400 active:bg-red-600 active:text-white rounded-lg transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="py-10 text-center text-slate-600 text-[8px] font-black uppercase tracking-[0.2em]">
              Aucun compte trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}