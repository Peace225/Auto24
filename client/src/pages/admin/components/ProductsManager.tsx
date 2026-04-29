import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Eye, Save, X, Loader2, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore'; // 🟢 Pour récupérer votre ID
import { toast } from 'react-hot-toast';

export default function SpaceAutoInventory() {
  const { user } = useAuthStore(); // 🟢 Votre compte Admin
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 🟢 CHARGEMENT : Uniquement VOS produits
  const fetchMyProducts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      // On récupère les produits standards de VOTRE boutique
      const { data: pData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id); // 🟢 FILTRE CRITIQUE

      // On récupère les batteries de VOTRE boutique
      const { data: bData } = await supabase
        .from('batteries')
        .select('*')
        .eq('vendor_id', user.id); // 🟢 FILTRE CRITIQUE

      const combined = [
        ...(pData || []).map(p => ({ ...p, isBattery: false })),
        ...(bData || []).map(b => ({ ...b, isBattery: true }))
      ];
      
      setProducts(combined);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchMyProducts(); }, [fetchMyProducts]);

  // 🟢 MISE À JOUR SÉCURISÉE
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !user) return;
    setIsSaving(true);

    try {
      const table = editingProduct.isBattery ? 'batteries' : 'products';
      
      const { error } = await supabase
        .from(table)
        .update({
          name: editingProduct.name,
          price: Number(editingProduct.price),
          stock: Number(editingProduct.stock)
        })
        .eq('id', editingProduct.id)
        .eq('vendor_id', user.id); // 🟢 SÉCURITÉ : On ne peut modifier que ce qui nous appartient

      if (error) throw error;
      
      toast.success("Modification enregistrée");
      setEditingProduct(null);
      fetchMyProducts();
    } catch (error) {
      toast.error("Erreur de mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ... (Modale d'édition identique au message précédent) ... */}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {products.map((p) => (
          <div key={p.id} className="bg-[#111625] border border-white/5 rounded-lg p-2 group relative">
            <img src={p.image_url} className="w-full aspect-square object-contain mb-2" />
            
            <h3 className="text-[8px] font-bold text-white truncate">{p.name}</h3>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-blue-400 font-bold text-[9px]">{p.price.toLocaleString()} F</span>
              
              <div className="flex gap-1">
                {/* 🟢 BOUTON MODIFIER UNIQUEMENT POUR VOS PRODUITS */}
                <button 
                  onClick={() => setEditingProduct(p)}
                  className="p-1.5 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-all"
                >
                  <Pencil size={10} />
                </button>
                
                <button className="p-1.5 bg-red-500/10 text-red-500 rounded">
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}