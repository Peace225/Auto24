import { useState, useEffect } from 'react';
import { Check, X, Loader2, Search, Package, Trash2, AlertTriangle, Crown, Store } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../../../utils/pricing'; // 🟢 Logique des paliers centralisée

const ADMIN_ID = '381661f7-7566-4b79-b94a-6fa274dba084';

export default function GlobalStockManager() {
  const [pending, setPending] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<'pending' | 'active'>('pending');

  const load = async () => {
    setLoading(true);
    const { data: products } = await supabase
      .from('products')
      .select('id,name,price,image_url,images,brand,model,reference,condition,status,created_at,stock,vendor_id')
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false });

    const vendorIds = [...new Set((products || []).map(p => p.vendor_id).filter(Boolean))];
    const { data: vendors } = vendorIds.length
      ? await supabase.from('profiles').select('id, store_name, avatar_url, subscription_plan, role, abonnement').in('id', vendorIds)
      : { data: [] };

    const merged = (products || []).map(p => {
      const v = vendors?.find(v => v.id === p.vendor_id);
      return {
        ...p,
        allImages: [...(p.images || []), ...(p.image_url ? [p.image_url] : [])].filter(Boolean),
        vendor: v ? { ...v, store_name: v.store_name || 'Boutique', logo_url: v.avatar_url, subscription_plan: (v.subscription_plan || v.abonnement || 'standard').toLowerCase() } : null
      };
    });

    setPending(merged.filter(p => p.status === 'pending'));
    setActive(merged.filter(p => p.status === 'approved'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // 🟢 VALIDATION SÉCURISÉE (Maintenant que la colonne existe dans ta BDD)
  const validate = async (id: string, ok: boolean) => {
    try {
      const targetStatus = ok ? 'approved' : 'rejected';
      
      const { error } = await supabase.from('products').update({
        status: targetStatus,
        admin_validated: ok,
        validated_at: new Date().toISOString() // 🟢 Fonctionne maintenant car la colonne est créée
      }).eq('id', id);

      if (error) throw error;

      toast.success(ok ? 'Produit validé et publié' : 'Produit rejeté');
      
      // Recharge la liste pour garantir la cohérence totale après modification
      load();
    } catch (err: any) {
      toast.error('Erreur de validation : ' + err.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer définitivement?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      toast.success('Supprimé');
      load();
    } catch (err: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const list = tab === 'pending' ? pending : active;
  const filtered = list.filter(p => `${p.name} ${p.brand} ${p.model} ${p.vendor?.store_name || ''}`.toLowerCase().includes(search.toLowerCase()));

  const ProductCard = ({ p }: { p: any }) => {
    const imgs = p.allImages.length ? p.allImages : ['https://placehold.co/400'];
    const stock = p.stock ?? 0;
    const isOfficial = !p.vendor_id || p.vendor_id === ADMIN_ID || p.vendor?.role === 'admin';
    const plan = p.vendor?.subscription_plan || 'standard';

    // 🟢 CALCUL DU PRIX FINAL (Paliers 5% - 12%)
    const basePrice = p.price || 0;
    const finalPrice = getPublicPrice(basePrice);

    return (
      <div className="group flex flex-col bg-[#0B1220] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all">
        <div className="relative h-36">
          <img src={imgs[0]} className="w-full h-full object-cover group-hover:scale-110 transition" alt={p.name} />
          <div className="absolute top-2 left-2 flex gap-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${p.condition === 'Neuf' ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-zinc-300'}`}>{p.condition || 'NEUF'}</span>
          </div>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2">
            {isOfficial ? <><Crown size={12} className="text-amber-400" /><span className="text-[9px] text-amber-400 font-bold">OFFICIEL</span></> : <><img src={p.vendor?.logo_url} className="w-4 h-4 rounded-full"/><span className="text-[9px] text-sky-400 truncate max-w-[80px]">{p.vendor?.store_name}</span></>}
          </div>
          <h3 className="text-[11px] text-slate-200 line-clamp-2 leading-tight">{p.name}</h3>
          
          <div className="flex justify-between items-end mt-3">
             <div className="flex flex-col">
                {basePrice !== finalPrice && <span className="text-[8px] text-slate-600 line-through">{basePrice.toLocaleString()}</span>}
                <span className="font-black text-white text-sm">{finalPrice.toLocaleString()} <span className="text-[8px] text-blue-500 font-normal">CFA</span></span>
             </div>
             <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] ${stock===0?'bg-red-500/15 text-red-400':stock<=5?'bg-amber-500/10 text-amber-500':'bg-white/5 text-slate-400'}`}><Package size={10}/>{stock}</span>
          </div>
        </div>
        
        <div className="p-2 border-t border-white/5 flex gap-1 bg-[#0F172A]/50">
          {tab === 'pending' ? <>
            <button onClick={() => validate(p.id, true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Check size={12} />Valider</button>
            <button onClick={() => validate(p.id, false)} className="w-8 h-8 bg-white/5 hover:bg-red-500 flex items-center justify-center rounded-lg text-white"><X size={13} /></button>
          </> : <>
            <button className="flex-1 bg-white/5 py-1.5 rounded-lg text-[10px] text-white">Modifier</button>
            <button onClick={() => remove(p.id)} className="w-8 h-8 bg-white/5 hover:bg-red-900/50 flex items-center justify-center rounded-lg text-red-400"><Trash2 size={12} /></button>
          </>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center"><Crown size={16} className="text-black" /></div>
            <div>
              <h1 className="text-base font-bold text-white uppercase tracking-tight">Validation Produits</h1>
              <div className="flex bg-[#0F172A] rounded-xl p-1 mt-1 border border-white/5">
                <button onClick={() => setTab('pending')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold ${tab === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'}`}>À valider ({pending.length})</button>
                <button onClick={() => setTab('active')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold ${tab === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>En ligne ({active.length})</button>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-[#0F172A] pl-9 pr-4 py-2 w-48 sm:w-72 rounded-xl text-[10px] text-white border border-white/10 outline-none"/>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={32}/></div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}