import { Package, Check, Ban, Eye, ShieldAlert, Store, Tag } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function ProductsManager({ products, onApprove, onReject }: any) {

  // --- LOGIQUE SUPER ADMIN : BANNIR / SUPPRIMER LE PRODUIT ---
  const handleBanProduct = async (productId: string) => {
    if (!window.confirm("SUPPRESSION CRITIQUE : Voulez-vous bannir ce produit définitivement du marketplace ?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'banned',
          is_active: false 
        })
        .eq('id', productId);

      if (error) throw error;
      
      toast.success("Produit banni et retiré du catalogue.");
      onReject(); // Rafraîchit la liste
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#111625]/50 rounded-[3rem] border border-white/5 border-dashed">
        <Package className="w-16 h-16 text-slate-800 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aucun article en attente de vérification</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header de section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-[1000] uppercase tracking-tighter text-white">Modération Catalogue</h2>
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-2">Certification des nouveaux articles entrant</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Contrôle de sécurité actif</span>
        </div>
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p: any) => (
          <div key={p.id} className="bg-[#111625] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
            
            {/* Image avec Overlay */}
            <div className="relative h-56 overflow-hidden">
              <img 
                src={p.images?.[0] || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop'} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                alt={p.name}
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Tag className="w-3 h-3 text-blue-500" /> {p.category || 'Véhicule'}
                </span>
              </div>
            </div>

            {/* Contenu de la carte */}
            <div className="p-8">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-3 h-3 text-slate-500" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.profiles?.store_name || 'Vendeur Inconnu'}</p>
              </div>
              
              <h3 className="text-lg font-black text-white uppercase tracking-tighter line-clamp-1 group-hover:text-blue-400 transition-colors">
                {p.name}
              </h3>
              
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">{new Intl.NumberFormat().format(p.price)}</span>
                <span className="text-[10px] font-black text-emerald-500/50 uppercase">CFA</span>
              </div>

              {/* Actions de modération */}
              <div className="grid grid-cols-3 gap-3 mt-8">
                {/* Rejeter / Bannir */}
                <button 
                  onClick={() => handleBanProduct(p.id)} 
                  className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                  title="Bannir le produit"
                >
                  <Ban className="w-5 h-5" />
                </button>

                {/* Voir (Preview) */}
                <button 
                  className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-all"
                  title="Voir l'annonce"
                >
                  <Eye className="w-5 h-5" />
                </button>

                {/* Approuver */}
                <button 
                  onClick={() => onApprove(p.id)} 
                  className="flex items-center justify-center py-4 bg-blue-600 rounded-2xl text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all group/btn"
                >
                  <Check className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}