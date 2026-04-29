import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Crown, Loader2, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function SubscriptionManager() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('subscription_status', 'pending');
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (userId: string, plan: string, action: 'approve' | 'reject') => {
    setProcessingId(userId);
    try {
      const updates = action === 'approve' 
        ? { subscription_status: 'active' } 
        : { subscription_status: 'none', subscription_plan: 'free' };

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;

      toast.success(action === 'approve' ? "Abonnement activé !" : "Demande rejetée.");
      fetchRequests();
    } catch (error) {
      toast.error("Erreur de mise à jour");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-amber-500" />
        <h2 className="text-sm md:text-xl font-black uppercase italic text-white">Demandes Premium</h2>
      </div>

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto py-10" />
      ) : requests.length === 0 ? (
        <div className="p-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
          <p className="text-[10px] text-slate-500 uppercase font-black">Aucune demande en attente</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {requests.map((req) => (
            <div key={req.id} className="bg-[#111625] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase">{req.store_name || req.full_name}</h4>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${req.subscription_plan === 'premium' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    PLAN {req.subscription_plan}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction(req.id, req.subscription_plan, 'reject')}
                  disabled={!!processingId}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <XCircle size={14} />
                </button>
                <button 
                  onClick={() => handleAction(req.id, req.subscription_plan, 'approve')}
                  disabled={!!processingId}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase"
                >
                  {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle size={12} /> Activer</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}