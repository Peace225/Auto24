import { useState, useEffect, useCallback } from 'react';
import { 
  Pencil, Trash2, Eye, Save, X, Loader2, 
  Package, ShoppingBag, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function MyStoreInventory() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const fetchMyStock = useCallback(async () => {
    if (!user) return;
    
    try {
      // 🟢 ÉTAPE 1 : On cherche tes produits personnels
      const [pRes, bRes] = await Promise.all([
        supabase.from('products').select('*').eq('vendor_id', user.id),
        supabase.from('batteries').select('*').eq('vendor_id', user.id)
      ]);

      const myItems = [
        ...(pRes.data || []).map(p => ({ ...p, isBattery: false })),
        ...(bRes.data || []).map(b => ({ ...b, isBattery: true }))
      ];

      // 🟢 ÉTAPE 2 : DIAGNOSTIC (Si la liste est vide alors qu'elle ne devrait pas l'être)
      if (myItems.length === 0) {
        // On va chercher le premier produit de "SpaceAuto24" pour voir son vrai vendor_id
        const { data: check } = await supabase
          .from('products')
          .select('vendor_id, name')
          .limit(1);
        
        if (check && check.length > 0) {
          setDebugInfo(`Ton ID : ${user.id.substring(0,8)}... | ID du produit : ${check[0].vendor_id?.substring(0,8)}...`);
        }
      }

      setProducts(myItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyStock();
    if (!user) return;

    const channel = supabase
      .channel(`inventory-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `vendor_id=eq.${user.id}` }, () => fetchMyStock())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batteries', filter: `vendor_id=eq.${user.id}` }, () => fetchMyStock())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMyStock]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !user) return;
    setIsSaving(true);
    try {
      const table = editingProduct.isBattery ? 'batteries' : 'products';
      await supabase.from(table).update({
        name: editingProduct.name,
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock)
      }).eq('id', editingProduct.id).eq('vendor_id', user.id);
      toast.success("Mis à jour");
      setEditingProduct(null);
      fetchMyStock();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, isBattery: boolean) => {
    if (!window.confirm("Supprimer ?")) return;
    setIsDeleting(id);
    try {
      const table = isBattery ? 'batteries' : 'products';
      await supabase.from(table).delete().eq('id', id).eq('vendor_id', user?.id);
      toast.success("Supprimé");
      fetchMyStock();
    } finally { setIsDeleting(null); }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline text-amber-500" /></div>;

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      
      {/* HEADER AVEC INFOS DEBUG SI VIDE */}
      <div className="bg-[#111625] border border-white/5 p-4 rounded-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShoppingBag className="text-blue-500 w-5 h-5" />
          <div>
            <h2 className="text-[10px] font-black text-white uppercase italic">Mon Inventaire Personnel</h2>
            {products.length === 0 && debugInfo && (
              <p className="text-[7px] text-orange-500 font-bold uppercase mt-1 flex items-center gap-1">
                <AlertTriangle size={8} /> Problème d'ID détecté : {debugInfo}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => fetchMyStock()} className="p-2 hover:bg-white/5 rounded-lg transition-all">
          <RefreshCw size={14} className={`text-slate-500 ${isSaving ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* MODALE ÉDITION */}
      {editingProduct && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <form onSubmit={handleUpdate} className="bg-[#111625] border border-blue-500/30 p-4 rounded-xl w-full max-w-[280px] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-white uppercase">Modifier l'article</h3>
              <button type="button" onClick={() => setEditingProduct(null)}><X size={16} className="text-slate-500" /></button>
            </div>
            <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} />
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} />
            </div>
            <button type="submit" disabled={isSaving} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-black text-[9px] uppercase">
              {isSaving ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </form>
        </div>
      )}

      {/* GRILLE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {products.map((p) => (
          <div key={p.id} className="bg-[#111625] border border-white/5 rounded-lg overflow-hidden flex flex-col group">
            <div className="aspect-square bg-slate-900 flex items-center justify-center p-2 relative">
              <img src={p.image_url} alt="" className="max-w-full max-h-full object-contain" />
              <span className="absolute top-1 left-1 px-1 py-0.5 rounded-[2px] text-[5px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/20 uppercase">
                {p.isBattery ? "BAT" : "PIÈCE"}
              </span>
            </div>
            <div className="p-2 flex flex-col flex-1 gap-1">
              <h3 className="text-[8px] font-bold text-white truncate uppercase italic">{p.name}</h3>
              <div className="flex justify-between items-center mt-auto pt-1 border-t border-white/5">
                <span className="text-[9px] font-black text-amber-500">{p.price} F</span>
                <div className="flex gap-1">
                  <button onClick={() => setEditingProduct(p)} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded"><Pencil size={10} /></button>
                  <button onClick={() => handleDelete(p.id, p.isBattery)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={10} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="w-full py-20 text-center border border-dashed border-white/10 rounded-xl">
           <Package className="mx-auto text-slate-800 mb-2" size={30} />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Aucun produit trouvé pour ton compte</p>
           <p className="text-[7px] text-slate-600 mt-2 px-10">Vérifie que les produits dans "Stock Global" ont bien été créés avec le compte administrateur actuel.</p>
        </div>
      )}
    </div>
  );
}