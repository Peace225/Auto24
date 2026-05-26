import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Search, Loader2, ShieldAlert,
  ArrowLeft, Package, ShoppingBag, Clock, Trash2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface VendorProfile {
  id: string;
  store_name: string;
  commune: string;
  phone: string;
  status: string;
  avatar_url: string;
  subscription_plan?: string;
  product_count?: number;
  pending_products?: number;
  order_count?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  status: string;
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchVendors = async () => {
    const { data: vendorsData } = await supabase
   .from('profiles')
   .select('*')
   .eq('role', 'vendor')
   .in('status', ['pending', 'approved']) // 🟢 on ne sort que en attente + validées
   .in('subscription_plan', ['standard', 'pro', 'premium', 'none']) // 🟢 plans autorisés
   .order('created_at', { ascending: false });

    if (!vendorsData) return;

    const vendorIds = vendorsData.map(v => v.id);
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('products').select('vendor_id, status').in('vendor_id', vendorIds),
      supabase.from('orders').select('vendor_id').in('vendor_id', vendorIds)
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];

    const vendorsWithStats = vendorsData.map(v => ({
   ...v,
      product_count: products.filter(p => p.vendor_id === v.id).length,
      pending_products: products.filter(p => p.vendor_id === v.id && p.status === 'pending').length,
      order_count: orders.filter(o => o.vendor_id === v.id).length
    }));

    setVendors(vendorsWithStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
    const channel = supabase
    .channel('vendors-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchVendors)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchVendors)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchVendors)
    .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openVendor = async (vendor: VendorProfile) => {
    setSelectedVendor(vendor);
    setLoadingProducts(true);
    const { data } = await supabase
   .from('products')
   .select('*')
   .eq('vendor_id', vendor.id)
   .order('created_at', { ascending: false });
    setVendorProducts(data || []);
    setLoadingProducts(false);
  };

  // VALIDER BOUTIQUE
  const validateVendor = async (vendorId: string, status: 'approved' | 'rejected') => {
    await supabase.from('profiles').update({ status }).eq('id', vendorId);
    toast.success(status === 'approved'? 'Boutique validée' : 'Boutique rejetée');
    setSelectedVendor(prev => prev? {...prev, status } : null);
    setVendors(prev => prev.map(v => v.id === vendorId? {...v, status } : v));
  };

  // VALIDER PRODUIT (corrigé: 'approved' au lieu de 'active')
  const validateProduct = async (productId: string, status: 'approved' | 'rejected') => {
    await supabase.from('products').update({ status }).eq('id', productId);
    toast.success(status === 'approved'? 'Produit validé' : 'Produit rejeté');

    // Recharge produits
    const { data: updatedProducts } = await supabase
   .from('products')
   .select('*')
   .eq('vendor_id', selectedVendor!.id)
   .order('created_at', { ascending: false });

    setVendorProducts(updatedProducts || []);

    // MAJ compteurs en temps réel
    const newPending = updatedProducts?.filter(p => p.status === 'pending').length || 0;
    const newTotal = updatedProducts?.length || 0;

    setSelectedVendor(prev => prev? {
   ...prev,
      pending_products: newPending,
      product_count: newTotal
    } : null);

    fetchVendors();
  };

  // SUPPRIMER BOUTIQUE
  const deleteVendor = async (vendorId: string, name: string) => {
    if (!confirm(`Supprimer "${name}" et tous ses produits?`)) return;
    await supabase.from('products').delete().eq('vendor_id', vendorId);
    await supabase.from('profiles').delete().eq('id', vendorId);
    toast.success('Boutique supprimée');
    setSelectedVendor(null);
    fetchVendors();
  };

  // SUPPRIMER PRODUIT
  const deleteProduct = async (productId: string) => {
    if (!confirm('Supprimer ce produit?')) return;
    await supabase.from('products').delete().eq('id', productId);
    toast.success('Produit supprimé');
    if (selectedVendor) openVendor(selectedVendor);
    fetchVendors();
  };

  const filtered = vendors.filter(v =>
    v.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pending = filtered.filter(v => v.status === 'pending');
  const approved = filtered.filter(v => v.status === 'approved');

  // VUE DÉTAIL BOUTIQUE
  if (selectedVendor) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setSelectedVendor(null)} className="flex items-center gap-2 text-sm font-bold hover:underline">
            <ArrowLeft size={16} /> Retour
          </button>
          <button onClick={() => deleteVendor(selectedVendor.id, selectedVendor.store_name)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
            <Trash2 size={14} /> Supprimer boutique
          </button>
        </div>

        {/* HEADER BOUTIQUE AVEC VALIDATION */}
        <div className={`rounded-2xl border-2 p-6 mb-6 ${selectedVendor.status === 'pending'? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img src={selectedVendor.avatar_url || `https://ui-avatars.com/api/?name=${selectedVendor.store_name}`} className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h1 className="text-2xl font-black uppercase">{selectedVendor.store_name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm"><strong className="text-orange-600">{selectedVendor.pending_products}</strong> en attente</span>
                  <span className="text-sm"><strong>{selectedVendor.product_count}</strong> total</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedVendor.status === 'pending'? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {selectedVendor.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedVendor.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => validateVendor(selectedVendor.id, 'approved')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black flex items-center gap-2 hover:bg-emerald-700">
                  <CheckCircle2 size={16} /> Valider boutique
                </button>
                <button onClick={() => validateVendor(selectedVendor.id, 'rejected')} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-black flex items-center gap-2 hover:bg-red-700">
                  <XCircle size={16} /> Rejeter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PRODUITS */}
        {loadingProducts? <Loader2 className="animate-spin mx-auto" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {vendorProducts.map(product => (
              <div key={product.id} className="bg-white rounded-2xl border overflow-hidden group relative">
                <button onClick={() => deleteProduct(product.id)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 z-10 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
                <img src={product.images?.[0] || 'https://via.placeholder.com/400'} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2 h-10">{product.name}</h3>
                  <p className="text-xl font-black mb-3">{product.price?.toLocaleString()} FCFA</p>

                  {product.status === 'pending'? (
                    <div className="flex gap-2">
                      <button onClick={() => validateProduct(product.id, 'approved')} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">
                        Valider
                      </button>
                      <button onClick={() => validateProduct(product.id, 'rejected')} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600">
                        Rejeter
                      </button>
                    </div>
                  ) : (
                    <div className={`text-center py-2 rounded-lg text-xs font-black ${product.status === 'approved'? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {product.status === 'approved'? '✓ VALIDÉ' : '✗ REJETÉ'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const VendorCard = ({ vendor }: { vendor: VendorProfile }) => (
    <div onClick={() => openVendor(vendor)} className="bg-white rounded-2xl border p-5 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative">
      <button onClick={(e) => { e.stopPropagation(); deleteVendor(vendor.id, vendor.store_name); }} className="absolute top-3 right-3 w-7 h-7 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white flex items-center justify-center">
        <Trash2 size={14} />
      </button>

      <div className="flex items-center gap-3 mb-4 pr-8">
        <img src={vendor.avatar_url || `https://ui-avatars.com/api/?name=${vendor.store_name}`} className="w-12 h-12 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm uppercase truncate">{vendor.store_name}</h3>
          <p className="text-xs text-slate-500">{vendor.commune}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 rounded-xl p-2 text-center">
          <Package size={14} className="mx-auto text-blue-600 mb-1" />
          <p className="font-black">{vendor.product_count || 0}</p>
          <p className="text- uppercase">Produits</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-2 text-center">
          <Clock size={14} className="mx-auto text-orange-600 mb-1" />
          <p className="font-black text-orange-700">{vendor.pending_products || 0}</p>
          <p className="text- uppercase">À valider</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2 text-center">
          <ShoppingBag size={14} className="mx-auto text-emerald-600 mb-1" />
          <p className="font-black text-emerald-700">{vendor.order_count || 0}</p>
          <p className="text- uppercase">Ventes</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Validation</h1>
          <p className="text-sm text-slate-500">{vendors.length} boutiques • {vendors.reduce((s, v) => s + (v.pending_products || 0), 0)} produits en attente</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-4 py-2.5 border rounded-xl w-64" />
        </div>
      </div>

      {loading? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
        <>
          <section>
            <h2 className="flex items-center gap-2 text-lg font-black uppercase mb-4 text-orange-600">
              <ShieldAlert size={18} /> Boutiques en attente ({pending.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {pending.map(v => <VendorCard key={v.id} vendor={v} />)}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-black uppercase mb-4 text-emerald-600">
              <CheckCircle2 size={18} /> Boutiques validées ({approved.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {approved.map(v => <VendorCard key={v.id} vendor={v} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}