import { useEffect, useState } from 'react';
import { supabase } from "../../../lib/supabase";
import { Loader2, Search, Check, X, Flame, Percent, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminPromoManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les sélections et actions groupées
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<string>('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // État pour les modifications individuelles
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [promoInputs, setPromoInputs] = useState<Record<string, string>>({});

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, price, promo_price,
          vendor:profiles!products_vendor_id_fkey(store_name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
      
      const initialInputs: Record<string, string> = {};
      data?.forEach(p => {
        if (p.promo_price) initialInputs[p.id] = p.promo_price.toString();
      });
      setPromoInputs(initialInputs);

    } catch (error: any) {
      toast.error("Erreur de chargement: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- GESTION DES SÉLECTIONS ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.vendor && !Array.isArray(p.vendor) && p.vendor.store_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]); // Tout décocher
    } else {
      setSelectedIds(filteredProducts.map(p => p.id)); // Tout cocher
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- ACTIONS GROUPÉES (BULK) ---
  const handleBulkApplyDiscount = async () => {
    const discount = parseFloat(bulkDiscountPercent);
    if (!discount || discount <= 0 || discount >= 100) {
      toast.error("Veuillez entrer un pourcentage valide (entre 1 et 99).");
      return;
    }

    setIsProcessingBulk(true);
    try {
      const updates = selectedIds.map(id => {
        const product = products.find(p => p.id === id);
        const normalPrice = product.price || 0;
        // Calcul du nouveau prix promo arrondi
        const newPromoPrice = Math.round(normalPrice * (1 - (discount / 100)));
        
        return supabase
          .from('products')
          .update({ promo_price: newPromoPrice })
          .eq('id', id)
          .select() // 🟢 AJOUT : Demande à Supabase de renvoyer la ligne
          .then(({ data, error }) => {
            if (error) throw error;
            // 🟢 VÉRIFICATION RLS
            if (!data || data.length === 0) throw new Error(`Modification bloquée (RLS) pour le produit ${id}`);
            return { id, newPromoPrice };
          });
      });

      const results = await Promise.all(updates);
      
      // Mettre à jour l'interface
      const updatedProducts = [...products];
      const newInputs = { ...promoInputs };
      
      results.forEach(res => {
        const pIndex = updatedProducts.findIndex(p => p.id === res.id);
        if (pIndex > -1) updatedProducts[pIndex].promo_price = res.newPromoPrice;
        newInputs[res.id] = res.newPromoPrice.toString();
      });

      setProducts(updatedProducts);
      setPromoInputs(newInputs);
      setSelectedIds([]);
      setBulkDiscountPercent('');
      toast.success(`Réduction de ${discount}% appliquée sur ${results.length} produits !`);
      
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de l'application de masse.");
    } finally {
      setIsProcessingBulk(false);
    }
  };
  const handleBulkRemovePromo = async () => {
    setIsProcessingBulk(true);
    try {
      const updates = selectedIds.map(id => 
        supabase
          .from('products')
          .update({ promo_price: null })
          .eq('id', id)
          .select() // 🟢 AJOUT ICI AUSSI
          .then(({ data, error }) => {
            if (error) throw error;
            // 🟢 VÉRIFICATION RLS
            if (!data || data.length === 0) throw new Error(`Modification bloquée (RLS) pour le produit ${id}`);
            return id;
          })
      );

      const results = await Promise.all(updates);
      
      const updatedProducts = [...products];
      const newInputs = { ...promoInputs };
      
      results.forEach(id => {
        const pIndex = updatedProducts.findIndex(p => p.id === id);
        if (pIndex > -1) updatedProducts[pIndex].promo_price = null;
        newInputs[id] = '';
      });

      setProducts(updatedProducts);
      setPromoInputs(newInputs);
      setSelectedIds([]);
      toast.success(`Promotions retirées pour ${results.length} produits.`);

    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression des promotions.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // --- SAUVEGARDE INDIVIDUELLE ---
  const handleUpdatePromo = async (productId: string, normalPrice: number) => {
    const promoValue = promoInputs[productId];
    const newPromoPrice = promoValue ? parseFloat(promoValue) : null;

    if (newPromoPrice !== null && newPromoPrice >= normalPrice) {
      toast.error("Le prix promo doit être inférieur au prix normal !");
      return;
    }

    setUpdatingId(productId);
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ promo_price: newPromoPrice })
        .eq('id', productId)
        .select(); // 🟢 IMPORTANT : Demande à Supabase de renvoyer la ligne modifiée

      if (error) throw error;
      
      // 🟢 Vérification que la base a bien accepté la modification
      if (!data || data.length === 0) {
        throw new Error("Action bloquée par la base de données (Erreur de droits RLS).");
      }

      toast.success(newPromoPrice ? "Promotion appliquée !" : "Promotion retirée !");
      
      setProducts(products.map(p => p.id === productId ? { ...p, promo_price: newPromoPrice } : p));
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* HEADER & RECHERCHE */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase text-slate-800 flex items-center gap-2">
            <Flame className="text-red-500" />
            Gestion des Promotions
          </h2>
          <p className="text-sm text-slate-500 mt-1">Sélectionnez des produits pour leur appliquer une promotion groupée.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un produit..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* BARRE D'ACTIONS GROUPÉES (Visible seulement si des produits sont sélectionnés) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold text-blue-800">
            <span className="bg-blue-200 text-blue-900 px-2.5 py-1 rounded-full mr-2">{selectedIds.length}</span>
            produit(s) sélectionné(s)
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <input 
                type="number" 
                placeholder="Ex: 20" 
                value={bulkDiscountPercent}
                onChange={(e) => setBulkDiscountPercent(e.target.value)}
                className="pl-3 pr-8 py-2 border border-blue-200 rounded-lg text-sm w-32 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            
            <button 
              onClick={handleBulkApplyDiscount}
              disabled={isProcessingBulk || !bulkDiscountPercent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessingBulk ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
              Appliquer la remise
            </button>

            <button 
              onClick={handleBulkRemovePromo}
              disabled={isProcessingBulk}
              className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={16} /> Retirer les promos
            </button>
          </div>
        </div>
      )}

      {/* TABLEAU DES PRODUITS */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
            <tr>
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-4">Produit & Vendeur</th>
              <th className="p-4">Prix Normal</th>
              <th className="p-4">Prix Promo (FCFA)</th>
              <th className="p-4 text-right">Action Individuelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin w-6 h-6 text-slate-400 mx-auto" /></td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aucun produit trouvé.</td></tr>
            ) : (
              filteredProducts.map(product => {
                const vendorName = Array.isArray(product.vendor) ? product.vendor[0]?.store_name : product.vendor?.store_name;
                const isPromoActive = !!product.promo_price;
                const normalPrice = product.price || 0;
                const isSelected = selectedIds.includes(product.id);

                return (
                  <tr key={product.id} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                      <p className="text-[11px] text-slate-500 uppercase mt-0.5">{vendorName || 'SPACEAUTO'}</p>
                    </td>
                    <td className="p-4 font-black text-slate-700">
                      {normalPrice.toLocaleString()} FCFA
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        placeholder="Ex: 8000"
                        value={promoInputs[product.id] || ''}
                        onChange={(e) => setPromoInputs(prev => ({ ...prev, [product.id]: e.target.value }))}
                        className={`w-32 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 ${isPromoActive ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-600 font-bold' : 'border-slate-300 focus:ring-blue-500'}`}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleUpdatePromo(product.id, normalPrice)}
                        disabled={updatingId === product.id || (!promoInputs[product.id] && !isPromoActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${updatingId === product.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} ${promoInputs[product.id] && promoInputs[product.id] !== product.promo_price?.toString() ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {updatingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Sauver
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}