import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Crown, Loader2, Package, Star, Zap, Ban, Trash2, Calendar, Clock } from 'lucide-react';
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
    features: ['Jusqu\'à 100 produits', 'Vues uniques & Taux de conv.', 'Badge Pro vérifié', 'Support prioritaire', 'Boost visibilité'],
    limit: '100 produits', // 🟢 Corrigé ici
    maxProducts: 100       // 🟢 Corrigé ici
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
  // 🟢 NOUVEAU : Ajout de l'état 'boosts' pour les onglets
  const [activeTab, setActiveTab] = useState<'requests' | 'manage' | 'boosts'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]); // 🟢 État pour les produits boostés
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, vendorsRes, boostsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('subscription_status', 'pending').eq('role', 'vendor'),
        supabase.from('profiles')
          .select('*, subscriptions(package_name, status)')
          .eq('role', 'vendor')
          .order('created_at', { ascending: false }),
        // 🟢 NOUVEAU : Récupération des produits qui ont été boostés
        supabase.from('products')
          .select('*, vendor:profiles!products_vendor_id_fkey(store_name, full_name)')
          .not('boosted_until', 'is', null) // On prend ceux qui ont une date de boost
          .order('boosted_at', { ascending: false })
      ]);

      setRequests(reqRes.data || []);
      setBoosts(boostsRes.data || []);

    const vendorsWithCount = await Promise.all(
  (vendorsRes.data || []).map(async (v) => {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', v.id);

    // 🟢 SÉCURISATION : force v.subscriptions en tableau
    const subs = Array.isArray(v.subscriptions) 
      ? v.subscriptions 
      : (v.subscriptions ? [v.subscriptions] : []);
    
    const activeSub = subs.find((s: any) => s.status === 'active');
    const realPlan = activeSub?.package_name || v.subscription_plan || 'standard';
    
    return { ...v, productCount: count || 0, subscription_plan: realPlan };
  })
);
setVendors(vendorsWithCount);
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
    const channel = supabase
      .channel('admin-subs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.vendor' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData) // 🟢 Écoute des produits
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateVendorPlan = async (userId: string, planTier: string, isPaid: boolean = false) => {
    const plan = PLANS.find(p => p.tier === planTier)!;
    const expiresAt = planTier === 'standard' ? null : new Date(Date.now() + 365*24*60*60*1000).toISOString();

    const { error: profileError } = await supabase.from('profiles').update({
      subscription_status: planTier === 'standard' ? 'none' : 'active',
      subscription_plan: planTier,
      is_verified: planTier !== 'standard',
      updated_at: new Date().toISOString()
    }).eq('id', userId);

    if (profileError) throw profileError;

    await supabase.from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId)
      .eq('status', 'active');

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
    setVendors(prev => prev.map(v => v.id === userId ? { ...v, subscription_plan: newPlan } : v));
    try {
      await updateVendorPlan(userId, newPlan, false);
      toast.success(`Plan changé par admin → ${newPlan.toUpperCase()}`);
      await fetchData();
    } catch (e:any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors du changement de plan');
      await fetchData(); 
    } finally {
      setProcessingId(null);
    }
  };

  // 🟢 NOUVEAU : Fonction pour gérer les actions sur les produits boostés
  const handleBoostAction = async (productId: string, action: 'activate' | 'block' | 'remove') => {
    setProcessingId(productId);
    try {
      let updates = {};
      if (action === 'activate') updates = { is_boosted: true };
      if (action === 'block') updates = { is_boosted: false };
      if (action === 'remove') updates = { is_boosted: false, boosted_at: null, boosted_until: null };

      const { error } = await supabase.from('products').update(updates).eq('id', productId);
      
      if (error) throw error;
      
      toast.success(
        action === 'activate' ? 'Sponsoring activé !' : 
        action === 'block' ? 'Sponsoring bloqué !' : 'Sponsoring supprimé !'
      );
      await fetchData();
    } catch (e:any) {
      console.error(e);
      toast.error('Erreur lors de la mise à jour du boost');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black uppercase text-white">Gestion Commerciale</h2>
        </div>
        
        {/* 🟢 NOUVEAU : Menu des onglets étendu */}
        <div className="flex bg-[#0A0E14] rounded-xl p-1 border border-white/10 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('requests')} className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'requests' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}>
            Abonnements ({requests.length})
          </button>
          <button onClick={() => setActiveTab('manage')} className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'manage' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}>
            Plans Vendeurs
          </button>
          <button onClick={() => setActiveTab('boosts')} className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'boosts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Zap size={14} /> Sponsoring ({boosts.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : activeTab === 'requests' ? (
        /* ONGLET DEMANDES (Identique) */
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
                    <button onClick={() => handleAction(req.id, req.subscription_plan, 'reject')} disabled={!!processingId} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><XCircle size={18} /></button>
                    <button onClick={() => handleAction(req.id, req.subscription_plan, 'approve')} disabled={processingId === req.id} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black text-xs uppercase transition-colors">
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle size={14} /> Activer</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'manage' ? (
        /* ONGLET GESTION PLANS (Identique) */
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
                    className="bg-[#05070B] border border-white/20 hover:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none transition-colors"
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
      ) : (
        /* 🟢 NOUVEL ONGLET : GESTION DES SPONSORINGS */
        <div className="space-y-3">
          {boosts.length === 0 ? (
            <div className="p-12 text-center bg-[#0A0E14] rounded-3xl border border-dashed border-white/10">
              <p className="text-slate-500 text-sm uppercase font-bold">Aucun produit sponsorisé</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {boosts.map((product) => {
                const now = new Date();
                const boostedUntil = new Date(product.boosted_until);
                const isExpired = boostedUntil < now;
                const isActive = product.is_boosted && !isExpired;

                // Extraction d'image robuste
                let imgDisplay = 'https://placehold.co/100x100/1a1a2e/ffffff?text=Image';
                if (product.images && product.images.length > 0) {
                  try {
                    const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                    imgDisplay = Array.isArray(parsed) ? parsed[0] : parsed;
                  } catch (e) { imgDisplay = product.images; }
                } else if (product.image_url) { imgDisplay = product.image_url; }
                imgDisplay = imgDisplay.replace(/^["']|["']$/g, '');

                return (
                  <div key={product.id} className={`bg-[#0A0E14] border p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${isActive ? 'border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.1)]' : isExpired ? 'border-red-500/20' : 'border-white/10'}`}>
                    
                    {/* Bloc Produit & Vendeur */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden shrink-0">
                        <img src={imgDisplay} alt={product.name} className="w-full h-full object-contain mix-blend-screen p-1" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{product.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Boutique: <span className="text-white font-medium">{product.vendor?.store_name || product.vendor?.full_name || 'Inconnu'}</span></p>
                        
                        <div className="flex gap-2 mt-2">
                          {isActive ? (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1"><Zap size={10}/> Actif</span>
                          ) : isExpired ? (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> Expiré</span>
                          ) : (
                            <span className="text-[10px] bg-zinc-500/20 text-zinc-400 px-2 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1"><Ban size={10}/> Bloqué</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bloc Dates */}
                    <div className="flex lg:flex-col gap-4 lg:gap-1 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500"/> 
                        <span>Début: <b className="text-white">{new Date(product.boosted_at).toLocaleDateString('fr-FR')}</b></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className={isExpired ? 'text-red-400' : 'text-emerald-400'}/> 
                        <span>Fin: <b className={isExpired ? 'text-red-400' : 'text-white'}>{boostedUntil.toLocaleDateString('fr-FR')}</b></span>
                      </div>
                    </div>

                    {/* Bloc Actions Admin */}
                    <div className="flex items-center gap-2 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                      {isActive ? (
                        <button 
                          onClick={() => handleBoostAction(product.id, 'block')} 
                          disabled={processingId === product.id} 
                          className="flex items-center justify-center w-10 h-10 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-xl transition-all"
                          title="Bloquer le Sponsoring"
                        >
                          {processingId === product.id ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleBoostAction(product.id, 'activate')} 
                          disabled={processingId === product.id} 
                          className="flex items-center justify-center w-10 h-10 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-xl transition-all"
                          title="Réactiver le Sponsoring"
                        >
                          {processingId === product.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        </button>
                      )}

                      <button 
                        onClick={() => handleBoostAction(product.id, 'remove')} 
                        disabled={processingId === product.id} 
                        className="flex items-center gap-2 px-4 h-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase transition-all"
                        title="Supprimer totalement le Boost"
                      >
                        {processingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Supprimer</>}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}