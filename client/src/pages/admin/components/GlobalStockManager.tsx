import { useState, useEffect } from 'react';
import { 
  Package, Trash2, Eye, Zap, Tag, Loader2, 
  Search, Filter, ChevronRight, AlertCircle,
  Star, StarHalf // 🟢 Ajout des icônes pour la notation
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

const ALL_CATEGORIES = [
  "Pièces moteur", "Filtres et huile", "Direction / Suspension / Train", 
  "Freinage", "Distribution et Accessoires", "Embrayage et Boîte de vitesse", 
  "Démarrage électrique", "Optiques / Phares / Ampoules", "Capteurs et Sondes", 
  "Essuie-glaces et pièces", "Batteries"
];

export default function GlobalStockManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const refreshStock = async () => {
    setLoading(true);
    try {
      // 🟢 On récupère les avis (reviews) liés aux produits
      const [resProd, resBat] = await Promise.all([
        supabase.from('products').select(`
          *, 
          categories:category_id(name), 
          profiles:vendor_id(store_name),
          reviews(rating) 
        `),
        supabase.from('batteries').select(`*`)
      ]);

      const hybridStock = [
        ...(resProd.data || []).map(p => {
          // 🟢 Calcul de la moyenne de crédibilité
          const ratings = p.reviews?.map((r: any) => r.rating) || [];
          const avg = ratings.length > 0 ? ratings.reduce((a:number, b:number) => a + b, 0) / ratings.length : 0;
          
          return { 
            ...p, 
            isBattery: false, 
            avgRating: avg, 
            totalReviews: ratings.length 
          };
        }),
        ...(resBat.data || []).map(b => ({ 
          ...b, 
          isBattery: true, 
          categories: { name: 'Batteries' },
          profiles: { store_name: 'SpaceAuto24' },
          avgRating: 0, // Optionnel: ajouter les reviews aux batteries aussi
          totalReviews: 0
        }))
      ];

      setProducts(hybridStock.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      toast.error("Erreur de synchronisation du stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStock();
    const sub = supabase.channel('global-stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refreshStock())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batteries' }, () => refreshStock())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => refreshStock()) // 🟢 Écoute aussi les nouvelles notes
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // 🟢 Composant visuel pour les étoiles de crédibilité
  const RatingStars = ({ rating, total }: { rating: number, total: number }) => {
    return (
      <div className="flex items-center gap-1 mt-1.5">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              size={8} 
              className={`${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
            />
          ))}
        </div>
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter ml-1">
          {total > 0 ? `${rating.toFixed(1)} (${total})` : "Aucun avis"}
        </span>
      </div>
    );
  };

  const deleteItem = async (id: string, isBattery: boolean) => {
    if (!window.confirm("Supprimer définitivement cet article ?")) return;
    const table = isBattery ? 'batteries' : 'products';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) toast.error("Erreur de suppression");
    else toast.success("Article retiré du catalogue");
  };

  const filteredItems = products.filter(p => {
    const matchesCat = filter ? p.categories?.name === filter : true;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* BARRE DE CONTRÔLE */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="RECHERCHER DANS L'INVENTAIRE GLOBAL..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black text-white outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest"
            />
          </div>
          <div className="flex items-center gap-4 bg-black/30 px-6 py-2 rounded-2xl border border-white/5">
            <Package className="text-blue-500 w-5 h-5" />
            <div>
              <p className="text-[10px] font-black text-white leading-none">{products.length}</p>
              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Articles Total</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-t border-white/5 pt-6">
          <button 
            onClick={() => setFilter(null)}
            className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!filter ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 border border-white/5'}`}
          >
            Tous les produits
          </button>
          {ALL_CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 border border-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DE STOCK */}
      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-[#111625] border border-white/5 rounded-[2rem] flex flex-col group hover:border-blue-500/30 transition-all shadow-xl relative overflow-hidden">
              
              <div className="h-44 bg-slate-900/50 relative overflow-hidden flex items-center justify-center p-6 border-b border-white/5">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain opacity-80 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border ${item.isBattery ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                    {item.isBattery ? <Zap size={10}/> : <Tag size={10}/>} {item.categories?.name}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {item.profiles?.store_name}
                    </p>
                    {/* Badge de confiance Admin */}
                    {item.avgRating >= 4.5 && (
                      <span className="text-[6px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md animate-pulse">
                        Elite
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-black text-white uppercase italic tracking-tighter leading-tight mt-1 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {/* 🟢 AFFICHAGE DE LA CRÉDIBILITÉ (ÉTOILES) */}
                  <RatingStars rating={item.avgRating} total={item.totalReviews} />
                </div>

                {item.isBattery && (
                  <div className="grid grid-cols-2 gap-2 mb-4 bg-white/5 p-2 rounded-xl border border-white/5">
                    <div className="text-center">
                      <p className="text-[6px] font-bold text-slate-500 uppercase">Capacité</p>
                      <p className="text-[9px] font-black text-white">{item.capacity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[6px] font-bold text-slate-500 uppercase">Démarrage</p>
                      <p className="text-[9px] font-black text-white">{item.cca}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <p className="text-lg font-[1000] text-white italic tracking-tighter">
                    {item.price.toLocaleString()} <small className="text-[9px] text-blue-500 not-italic">CFA</small>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => deleteItem(item.id, item.isBattery)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg">
                      <Trash2 size={14} />
                    </button>
                    <button className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 transition-all">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <div className="py-20 text-center bg-[#111625]/50 rounded-[3rem] border border-dashed border-white/10">
          <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aucun article trouvé</p>
        </div>
      )}
    </div>
  );
}