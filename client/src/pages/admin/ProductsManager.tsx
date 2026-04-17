import { useState } from 'react';
import { 
  CheckCircle2, XCircle, Eye, Search, Filter, 
  Package, Store, AlertCircle, Loader2, Tag, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ProductsManagerProps {
  products: any[];
  onApprove: () => void;
  onReject: () => void;
}

export default function ProductsManager({ products, onApprove, onReject }: ProductsManagerProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ACTIONS ---
  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('products').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      toast.success("Produit validé et publié sur la marketplace !");
      onApprove(); // Rafraîchit les données du Dashboard
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter et supprimer ce produit ?")) return;
    
    setProcessingId(id);
    try {
      // Pour rejeter, on supprime l'article ou on le passe en statut 'rejected'
      const { error } = await supabase.from('products').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      toast.success("Produit rejeté.");
      onReject();
    } catch (error: any) {
      toast.error("Erreur lors du rejet.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- FILTRAGE ---
  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.profiles?.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 🔴 HEADER & RECHERCHE */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter">Validation Articles</h2>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:ml-9">
            {products.length} produit(s) en attente de modération
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher une pièce..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-[10px] uppercase tracking-widest placeholder:text-slate-600"
            />
          </div>
          <button className="p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400 hover:text-white">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🔴 ÉTAT VIDE */}
      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111625]/50 border border-white/5 border-dashed rounded-[2.5rem]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-[1000] text-slate-400 uppercase italic tracking-tighter mb-2">Tout est à jour</h3>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Aucun article en attente de validation.</p>
        </div>
      )}

      {/* 🔴 GRILLE DE PRODUITS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-[#111625] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-blue-500/30 transition-all hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] flex flex-col">
            
            {/* Image Produit */}
            <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center justify-center border-b border-white/5">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
              ) : (
                <div className="flex flex-col items-center opacity-30">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Image manquante</span>
                </div>
              )}
              
              {/* Badge Catégorie */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                <Tag className="w-3 h-3 text-blue-400" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">{product.category || 'Non catégorisé'}</span>
              </div>
            </div>

            {/* Infos Produit */}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-[1000] text-white uppercase italic tracking-tighter mb-4 line-clamp-2 leading-tight">
                {product.name}
              </h3>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <Store className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Vendeur</p>
                    <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
                      {product.profiles?.store_name || 'Boutique Inconnue'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                  <div>
                    <p className="text-[7px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none mb-1">Prix de vente</p>
                    <p className="text-lg font-[1000] text-white italic tracking-tighter">{Number(product.price).toLocaleString('fr-FR')} F</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Stock</p>
                    <p className="text-sm font-black text-white">{product.stock} <span className="text-[8px] text-slate-500">unités</span></p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <button 
                  onClick={() => handleReject(product.id)}
                  disabled={processingId !== null}
                  className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  title="Rejeter"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                
                <button 
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                >
                  <Eye className="w-4 h-4" /> Détails
                </button>
                
                <button 
                  onClick={() => handleApprove(product.id)}
                  disabled={processingId !== null}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white font-[1000] text-[9px] uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                  {processingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Valider <CheckCircle2 className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}