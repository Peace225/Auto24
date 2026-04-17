import { useState } from 'react';
import { 
  Package, Check, Ban, Eye, ShieldAlert, 
  Store, Tag, Loader2, XCircle, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ProductsManagerProps {
  products: any[];
  onApprove: () => void;
  onReject: () => void;
}

export default function ProductsManager({ products, onApprove, onReject }: ProductsManagerProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- LOGIQUE D'APPROBATION ---
  const handleApproveProduct = async (productId: string) => {
    setProcessingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'approved' })
        .eq('id', productId);

      if (error) throw error;
      
      toast.success("Produit validé et publié !");
      onApprove(); // Rafraîchit les données du Dashboard
    } catch (error: any) {
      toast.error("Erreur lors de la validation.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- LOGIQUE DE REJET/BANNISSEMENT ---
  const handleBanProduct = async (productId: string) => {
    if (!window.confirm("SUPPRESSION CRITIQUE : Voulez-vous rejeter ce produit définitivement ?")) return;

    setProcessingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'rejected',
          is_active: false 
        })
        .eq('id', productId);

      if (error) throw error;
      
      toast.success("Produit banni et retiré du flux.");
      onReject(); // Rafraîchit la liste
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // --- ÉTAT VIDE ---
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[#111625]/50 rounded-[3rem] border border-white/5 border-dashed animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
        </div>
        <h2 className="text-2xl font-[1000] text-slate-400 uppercase italic tracking-tighter mb-2">Catalogue à jour</h2>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Aucun article en attente de vérification</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 🔴 HEADER SECTION */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-[1000] uppercase tracking-tighter text-white italic">Modération Catalogue</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] md:ml-9">
            {products.length} article(s) nécessitant votre attention
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Contrôle de sécurité actif</span>
        </div>
      </div>

      {/* 🔴 GRILLE DE PRODUITS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {products.map((p: any) => {
          const isProcessing = processingId === p.id;
          
          return (
            <div key={p.id} className="bg-[#111625] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] flex flex-col relative">
              
              {/* Overlay de chargement local */}
              {isProcessing && (
                <div className="absolute inset-0 bg-[#111625]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Traitement...</span>
                </div>
              )}

              {/* Image avec Overlay */}
              <div className="relative h-56 overflow-hidden border-b border-white/5 bg-slate-900 flex items-center justify-center">
                {p.images?.[0] || p.image_url ? (
                  <img 
                    src={p.images?.[0] || p.image_url} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
                    alt={p.name}
                  />
                ) : (
                  <Package className="w-12 h-12 text-slate-700" />
                )}
                
                {/* Badge Catégorie */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3 h-3 text-blue-500" /> {p.category || 'Non catégorisé'}
                  </span>
                </div>
              </div>

              {/* Contenu de la carte */}
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4 p-2.5 bg-white/5 border border-white/5 rounded-xl inline-flex w-fit">
                  <Store className="w-3 h-3 text-purple-400" />
                  <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest truncate max-w-[150px]">
                    {p.profiles?.store_name || 'Vendeur Inconnu'}
                  </p>
                </div>
                
                <h3 className="text-lg md:text-xl font-[1000] text-white uppercase italic tracking-tighter line-clamp-2 mb-6 group-hover:text-blue-400 transition-colors">
                  {p.name}
                </h3>
                
                <div className="mt-auto mb-8 flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-[1000] text-white italic tracking-tighter">
                    {new Intl.NumberFormat('fr-FR').format(p.price || 0)}
                  </span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">FCFA</span>
                </div>

                {/* Actions de modération */}
                <div className="grid grid-cols-[auto_1fr_1fr] gap-3 pt-6 border-t border-white/5">
                  {/* Rejeter / Bannir */}
                  <button 
                    onClick={() => handleBanProduct(p.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-50"
                    title="Bannir le produit"
                  >
                    <Ban className="w-5 h-5" />
                  </button>

                  {/* Voir (Preview) */}
                  <button 
                    className="flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:bg-white/10 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-50"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" /> Détails
                  </button>

                  {/* Approuver */}
                  <button 
                    onClick={() => handleApproveProduct(p.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 p-4 bg-emerald-600 rounded-2xl text-white font-[1000] text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    Valider <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}