import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Crown, Loader2, Package, Star, Users, Zap } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

const PLANS = [
  {
    name: 'Standard',
    tier: 'standard',
    price: '0',
    icon: Package,
    color: 'from-slate-500 to-slate-800',
    features: ['Jusqu\'à 10 produits', 'Statistiques de base', 'Support par email', '1 compte admin'],
    limit: '10 produits',
    maxProducts: 10
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '10.000',
    icon: Star,
    popular: true,
    color: 'from-amber-500 to-orange-600',
    features: ['Jusqu\'à 50 produits', 'Vues uniques & Taux de conv.', 'Badge Pro vérifié', 'Support prioritaire', 'Boost visibilité'],
    limit: '50 produits',
    maxProducts: 50
  },
  {
    name: 'Premium',
    tier: 'premium',
    price: '25.000',
    icon: Crown,
    color: 'from-violet-600 to-purple-700',
    features: ['Produits illimités', 'Analytics avancés complets', 'Multi-administrateurs (5)', 'Gestion de stock avancée', 'API accès'],
    limit: 'Illimité',
    maxProducts: 9999
  }
];

export default function SubscriptionManager() {
  const [activeTab, setActiveTab] = useState<'requests' | 'manage'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, vendorsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('subscription_status', 'pending').eq('role', 'vendor'),
        supabase.from('profiles')
          .select('*, subscriptions(package_name, status)')
          .eq('role', 'vendor')
          .order('created_at', { ascending: false })
      ]);

      setRequests(reqRes.data || []);

      const vendorsWithCount = await Promise.all(
        (vendorsRes.data || []).map(async (v) => {
          const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('vendor_id', v.id);
          // On cherche le vrai plan dans la table subscriptions s'il y en a un actif
          const activeSub = v.subscriptions?.find((s: any) => s.status === 'active');
          const realPlan = activeSub?.package_name || v.subscription_plan || 'standard';
          
          return { ...v, productCount: count || 0, subscription_plan: realPlan };
        })
      );
      setVendors(vendorsWithCount);
    } catch (e) {
      console.error(e);
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // realtime pour que l'admin voie les changements instantanément
    const channel = supabase
      .channel('admin-subs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.vendor' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateVendorPlan = async (userId: string, planTier: string, isPaid: boolean = false) => {
    const plan = PLANS.find(p => p.tier === planTier)!;
    const expiresAt = planTier === 'standard' ? null : new Date(Date.now() + 365*24*60*60*1000).toISOString();

    // 1. Mise à jour du profil (UNIQUEMENT les colonnes qui existent vraiment)
    const { error: profileError } = await supabase.from('profiles').update({
      subscription_status: planTier === 'standard' ? 'none' : 'active',
      subscription_plan: planTier,
      is_verified: planTier !== 'standard',
      updated_at: new Date().toISOString()
    }).eq('id', userId);

    if (profileError) throw profileError;

    // 2. On annule l'ancien abonnement
    await supabase.from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // 3. On insère le nouvel abonnement s'il n'est pas standard (plus de 'upsert' risqué)
    if (planTier !== 'standard') {
      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: userId,
        package_name: planTier,
        status: 'active',
        expires_at: expiresAt
      });
      if (subError) throw subError;
    }
  };

  const handleAction = async (userId: string, planTier: string, action: 'approve' | 'reject') => {
    setProcessingId(userId);
    try {
      if (action === 'approve') {
        await updateVendorPlan(userId, planTier, true);
        toast.success(`${planTier.toUpperCase()} activé!`);
      } else {
        await updateVendorPlan(userId, 'standard', false);
        toast.success('Demande rejetée');
      }
      await fetchData();
    } catch (e:any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors du traitement');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdminAssign = async (userId: string, newPlan: string) => {
    setProcessingId(userId);
    // Update optimiste
    setVendors(prev => prev.map(v => v.id === userId ? { ...v, subscription_plan: newPlan } : v));
    try {
      await updateVendorPlan(userId, newPlan, false);
      toast.success(`Plan changé par admin → ${newPlan.toUpperCase()}`);
      await fetchData();
    } catch (e:any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors du changement de plan');
      await fetchData(); // rollback en cas d'erreur
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black uppercase text-white">Abonnements</h2>
        </div>
        <div className="flex bg-[#0A0E14] rounded-xl p-1 border border-white/10">
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'requests' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}>
            Demandes ({requests.length})
          </button>
          <button onClick={() => setActiveTab('manage')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'manage' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}>
            Gestion manuelle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : activeTab === 'requests' ? (
        requests.length === 0 ? (
          <div className="p-12 text-center bg-[#0A0E14] rounded-3xl border border-dashed border-white/10">
            <p className="text-slate-500 text-sm uppercase font-bold">Aucune demande</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {requests.map((req) => {
              const plan = PLANS.find(p => p.tier === req.subscription_plan) || PLANS[1];
              const Icon = plan.icon;
              return (
                <div key={req.id} className="bg-[#0A0E14] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{req.store_name || req.full_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${plan.tier === 'pro' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'}`}>
                          {plan.name} - {plan.price} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(req.id, req.subscription_plan, 'reject')} disabled={!!processingId} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white"><XCircle size={18} /></button>
                    <button onClick={() => handleAction(req.id, req.subscription_plan, 'approve')} disabled={processingId === req.id} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-black rounded-xl font-black text-xs uppercase">
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle size={14} /> Activer</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2 text-xs">
            <Zap size={14} className="text-amber-500" />
            <span className="text-amber-400">Mode Admin : changement instantané sans paiement</span>
          </div>
          {vendors.map((vendor) => {
            const currentPlan = PLANS.find(p => p.tier === (vendor.subscription_plan || 'standard'))!;
            const Icon = currentPlan.icon;
            return (
              <div key={vendor.id} className="bg-[#0A0E14] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentPlan.color} flex items-center justify-center`}><Icon size={16} className="text-white" /></div>
                  <div>
                    <p className="text-white font-bold text-sm">{vendor.store_name || vendor.full_name}</p>
                    <p className="text-xs text-slate-500">{vendor.productCount} produits • {vendor.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={vendor.subscription_plan || 'standard'}
                    onChange={(e) => handleAdminAssign(vendor.id, e.target.value)}
                    disabled={processingId === vendor.id}
                    className="bg-[#05070B] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                  >
                    {PLANS.map(p => (
                      <option key={p.tier} value={p.tier}>{p.name} ({p.maxProducts === 9999 ? '∞' : p.maxProducts})</option>
                    ))}
                  </select>
                  {processingId === vendor.id && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}