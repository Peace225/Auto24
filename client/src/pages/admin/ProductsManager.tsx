import { useState } from 'react';
import { 
  CheckCircle2, XCircle, Eye, Search, Filter, 
  Package, Store, Loader2, Tag, Image as ImageIcon
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
      toast.success("Produit publié !");
      onApprove();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Rejeter et supprimer ce produit ?")) return;
    
    setProcessingId(id);
    try {
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
    <div className="w-full space-y-3 md:space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 🔴 HEADER & RECHERCHE (Ultra-Compact Mobile) */}
      <div className="bg-[#111625] border border-white/5 rounded-xl md:rounded-[2.5rem] p-3 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 w-full overflow-hidden">
        <div className="w-full flex justify-between items-center md:block">
          <div className="flex items-center gap-1.5 md:gap-3 mb-0.5 md:mb-2">
            <Package className="w-3.5 h-3.5 md:w-6 md:h-6 text-blue-500 shrink-0" />
            <h2 className="text-[11px] md:text-2xl font-[1000] text-white uppercase italic tracking-tighter">Validation Articles</h2>
          </div>
          <p className="text-[7px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest md:ml-9">
            {products.length} en attente
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 md:pl-10 md:pr-4 py-2 md:py-3.5 bg-white/5 border border-white/10 rounded-lg md:rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 transition-all text-[8px] md:text-[10px] uppercase tracking-widest placeholder:text-slate-600"
            />
          </div>
          <button className="p-2 md:p-3.5 bg-white/5 border border-white/10 rounded-lg md:rounded-2xl hover:bg-white/10 transition-all text-slate-400 shrink-0">
            <Filter className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* 🔴 ÉTAT VIDE */}
      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 md:py-20 bg-[#111625]/50 border border-white/5 border-dashed rounded-xl md:rounded-[2.5rem] w-full">
          <div className="w-10 h-10 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mb-3 md:mb-6">
            <CheckCircle2 className="w-5 h-5 md:w-10 md:h-10 text-slate-600" />
          </div>
          <h3 className="text-xs md:text-xl font-[1000] text-slate-400 uppercase italic tracking-tighter mb-1 md:mb-2">Tout est à jour</h3>
          <p className="text-[7px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">Aucun article à modérer.</p>
        </div>
      )}

      {/* 🔴 GRILLE DE PRODUITS (2 colonnes sur mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6 w-full">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-[#111625] border border-white/5 rounded-xl md:rounded-[2rem] overflow-hidden group hover:border-blue-500/30 transition-all hover:shadow-xl flex flex-col w-full">
            
            {/* Image Produit (Aspect 4/3 pour Mobile) */}
            <div className="relative w-full aspect-[4/3] md:h-48 bg-slate-900 flex items-center justify-center border-b border-white/5 shrink-0">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="flex flex-col items-center opacity-30">
                  <ImageIcon className="w-6 h-6 md:w-10 md:h-10 mb-1 md:mb-2" />
                  <span className="text-[5px] md:text-[8px] font-black uppercase tracking-widest">Image manquante</span>
                </div>
              )}
              
              {/* Badge Catégorie Nano */}
              <div className="absolute top-1.5 left-1.5 md:top-4 md:left-4 px-1.5 py-0.5 md:px-3 md:py-1.5 bg-black/60 backdrop-blur-md rounded-md md:rounded-xl border border-white/10 flex items-center gap-1 md:gap-2">
                <Tag className="w-2 h-2 md:w-3 md:h-3 text-blue-400" />
                <span className="text-[5px] md:text-[8px] font-black text-white uppercase tracking-widest truncate max-w-[45px] md:max-w-none">{product.category || 'Non classé'}</span>
              </div>
            </div>

            {/* Infos Produit */}
            <div className="p-2 md:p-6 flex-1 flex flex-col">
              <h3 className="text-[9px] md:text-lg font-[1000] text-white uppercase italic tracking-tighter mb-2 md:mb-4 line-clamp-2 leading-tight min-h-[1.5rem] md:min-h-[2.5rem]">
                {product.name}
              </h3>
              
              <div className="space-y-1.5 md:space-y-3 mb-2 md:mb-6 flex-1">
                {/* Bloc Vendeur */}
                <div className="flex items-center gap-1 md:gap-3 p-1.5 md:p-3 bg-white/5 rounded-lg md:rounded-xl border border-white/5">
                  <Store className="w-3 h-3 md:w-4 md:h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[5px] md:text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Vendeur</p>
                    <p className="text-[7px] md:text-[10px] font-bold text-white uppercase tracking-wider truncate">
                      {product.profiles?.store_name || 'Boutique'}
                    </p>
                  </div>
                </div>
                
                {/* Bloc Prix & Stock */}
                <div className="flex items-center justify-between p-1.5 md:p-3 bg-blue-500/5 rounded-lg md:rounded-xl border border-blue-500/10">
                  <div className="min-w-0">
                    <p className="text-[5px] md:text-[7px] font-black text-blue-500 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Prix</p>
                    <p className="text-[9px] md:text-lg font-[1000] text-white italic tracking-tighter truncate">{Number(product.price).toLocaleString('fr-FR')} <span className="text-[6px] md:text-[10px]">F</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[5px] md:text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Stock</p>
                    <p className="text-[7px] md:text-sm font-black text-white">{product.stock}</p>
                  </div>
                </div>
              </div>

              {/* Actions Ultra-Compactes */}
              <div className="flex items-center gap-1 md:gap-3 pt-2 md:pt-4 border-t border-white/5">
                <button 
                  onClick={() => handleReject(product.id)}
                  disabled={processingId !== null}
                  className="p-1.5 md:p-3 bg-red-500/10 text-red-500 rounded-md md:rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  title="Rejeter"
                >
                  <XCircle className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </button>
                
                <button className="p-1.5 md:p-3 bg-white/5 text-slate-400 rounded-md md:rounded-xl hover:bg-white/10 hover:text-white transition-all shrink-0">
                  <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                
                <button 
                  onClick={() => handleApprove(product.id)}
                  disabled={processingId !== null}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 py-1.5 md:p-3 bg-emerald-500 text-white font-[1000] text-[7px] md:text-[9px] uppercase tracking-widest rounded-md md:rounded-xl hover:bg-emerald-400 transition-all shadow-md disabled:opacity-50"
                >
                  {processingId === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Valider <CheckCircle2 className="w-3.5 h-3.5 hidden sm:block" /></>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}