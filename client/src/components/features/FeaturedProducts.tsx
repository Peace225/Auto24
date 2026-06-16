import { useEffect, useState, useMemo } from 'react';
import { ArrowRight, Loader2, Heart, ShoppingCart, Star, Store, Crown, Award, Zap, Truck, ShieldCheck, RotateCcw, BadgeCheck, Headphones, ChevronDown, ChevronUp, PackageCheck, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getPublicPrice } from '../../utils/pricing';
import VendorBadge from '../features/VendorBadge';

export default function FeaturedProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToCart = useCartStore((state) => state.addToCart);

  const [products, setProducts] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 🟢 FILTRES AUTO ET PAGINATION
  const [planFilter, setPlanFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    setVisibleCount(15);
  }, [planFilter, brandFilter]);

  const fetchAllBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('brand')
        .eq('status', 'approved')
        .not('brand', 'is', null);

      if (!error && data) {
        const uniqueBrands = [...new Set(data.map(p => p.brand).filter(Boolean))];
        setAllBrands(uniqueBrands.sort() as string[]);
      }
    } catch (e) {
      console.error("Erreur chargement des marques:", e);
    }
  };

  const loadFeatured = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles!products_vendor_id_fkey (
            store_name,
            role,
            status,
            subscription_plan
          ),
          reviews (rating)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted = (data || []).map(item => {
        const avg = item.reviews?.length ? item.reviews.reduce((a: number, c: any) => a + c.rating, 0) / item.reviews.length : 0;
        const isAdmin = item.vendor?.role === 'admin' || item.vendor?.role === 'super_admin';
        const activePlan = isAdmin ? 'premium' : (item.vendor?.subscription_plan || 'standard');

        let img = 'https://placehold.co/300x300/e2e8f0/94a3b8?text=Image+Non+Disponible';
        
        if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
          img = item.images[0];
        } 
        else if (typeof item.images === 'string' && item.images.length > 5) {
          try {
            const parsed = JSON.parse(item.images);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) img = parsed[0];
            else img = item.images;
          } catch (e) {
            img = item.images;
          }
        } 
        else if (item.image_url && typeof item.image_url === 'string' && item.image_url.length > 5) {
          img = item.image_url;
        }

        img = img.replace(/^["']|["']$/g, '');

        // Sécurisation de la compatibilité et récupération des fallbacks (ex: oem_reference vs reference)
        let compat = item.compatibility || '';
        if (Array.isArray(item.compatibility)) compat = item.compatibility.join(', ');
        
        return {
          ...item,
          final_price: getPublicPrice(item.price || 0),
          image: img,
          vendor_name: isAdmin ? 'SPACEAUTO' : (item.vendor?.store_name || 'Boutique'),
          vendor_status: isAdmin ? 'approved' : (item.vendor?.status || 'standard'),
          vendor_plan: activePlan.toLowerCase(),
          avgRating: avg,
          reviewsCount: item.reviews?.length || 0,
          compatibility_text: compat,
          // Consolidation des champs pour l'affichage
          safe_reference: item.reference || item.oem_reference || 'N/A',
          safe_model: item.model || item.vehicle_model || 'Générique',
          safe_stock: item.stock !== undefined ? item.stock : (item.stock_quantity || 0),
          safe_condition: item.condition || 'Neuf',
          safe_year: item.year || ''
        };
      });

      // On filtre les produits en rupture de stock si tu le souhaites (ici on les garde mais on l'affiche)
      setProducts(formatted);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement des produits");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    fetchAllBrands();
    
    if (user) {
      supabase.from('favorites').select('product_id').eq('user_id', user.id)
        .then(({ data }) => setFavorites(data?.map(f => f.product_id) || []));
    }

    const productsChannel = supabase.channel('public-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadFeatured(true);
        fetchAllBrands();
      })
      .subscribe();

    const profilesChannel = supabase.channel('public-profiles-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadFeatured(true))
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  const toggleFav = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return navigate('/login');
    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(x => x !== id) : [...prev, id]);
    if (isFav) await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
    else await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchPlan = planFilter === 'all' || p.vendor_plan === planFilter;
      const matchBrand = brandFilter === 'all' || p.brand === brandFilter;
      return matchPlan && matchBrand;
    });
  }, [products, planFilter, brandFilter]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'premium': return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
      default: return 'bg-slate-700 text-white';
    }
  };

  return (
    <section className="py-8" id="featured-products-section">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] px-5 py-3 flex items-center gap-3">
            <Zap className="text-white" size={20} fill="white" />
            <h2 className="font-black text-white text-lg tracking-tight">
              TOP PIÈCES <span className="text-yellow-200">AUTO</span>
            </h2>
            <span className="hidden md:block ml-auto text-xs font-bold text-white/90 uppercase tracking-widest">
              — BOUTIQUES PREMIUM • PRO • STANDARD —
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-4 py-3 bg-[#FAFBFC] border-b text-xs">
            {[
              {icon: Truck, t:'LIVRAISON RAPIDE', s:'24-48h partout'},
              {icon: ShieldCheck, t:'PAIEMENT SÉCURISÉ', s:'Mobile Money & Carte'},
              {icon: RotateCcw, t:'RETOURS FACILES', s:'Sous 7 jours'},
              {icon: BadgeCheck, t:'PIÈCES CERTIFIÉES', s:'Vendeurs vérifiés'},
              {icon: Headphones, t:'SUPPORT 7J/7', s:'Experts auto'},
            ].map((item,i)=>(
              <div key={i} className="flex items-center gap-2">
                <item.icon size={16} className="text-orange-500 shrink-0"/>
                <div><div className="font-bold text-slate-800 leading-none">{item.t}</div><div className="text-[10px] text-slate-500">{item.s}</div></div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 p-4 bg-white border-b">
            <div className="flex gap-1.5">
              {['all','premium','pro','standard'].map(p => (
                <button key={p} onClick={()=>setPlanFilter(p)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition ${planFilter===p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p==='all' ? 'Tous' : p}
                </button>
              ))}
            </div>
            <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}
              className="ml-auto text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-semibold text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
              <option value="all">Toutes marques</option>
              {allBrands.map(b=> <option key={b} value={b}>{b}</option>)}
            </select>
            <Link to="/catalog" className="text-xs font-bold uppercase flex items-center gap-1 text-slate-600 hover:text-black ml-2">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-orange-500" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aucun produit trouvé pour ces filtres.</div>
              <button onClick={() => {setPlanFilter('all'); setBrandFilter('all'); setVisibleCount(15);}} className="mt-4 text-orange-500 font-bold text-sm hover:underline">Réinitialiser les filtres</button>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedProducts.map(p => {
                  const plan = p.vendor_plan;
                  const isOutOfStock = p.safe_stock <= 0;
                  const isConditionNeuf = p.safe_condition?.toLowerCase().includes('neuf');

                  return (
                    <div key={p.id} className="group relative bg-white rounded-2xl border border-slate-100 hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col">
                      <div className="absolute top-2 left-2 z-20">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full shadow-sm ${getPlanBadge(plan)}`}>
                          {plan === 'premium' ? 'PREMIUM' : plan === 'pro' ? 'PRO' : 'STANDARD'}
                        </span>
                      </div>

                      <button onClick={(e) => toggleFav(p.id, e)} className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm hover:scale-110 transition">
                        <Heart size={14} className={favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                      </button>

                      <Link to={`/product/${p.id}`} className="relative block aspect-square p-4 bg-gradient-to-b from-slate-50 to-white">
                        <img src={p.image} className={`w-full h-full object-contain mix-blend-darken transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} alt={p.name} />
                        <div className="absolute bottom-2 right-2">
                          <VendorBadge isVerified={p.vendor_status === 'approved'} planType={plan} type={p.vendor?.role === 'garage' ? 'garage' : 'vendor'} />
                        </div>
                      </Link>

                      <div className="p-3 flex flex-col flex-1">
                        <div className={`text-[9px] font-bold uppercase mb-1 flex items-center gap-1 truncate ${plan==='premium'?'text-amber-600':plan==='pro'?'text-blue-600':'text-slate-500'}`}>
                          {plan==='premium'?<Crown size={11}/>:plan==='pro'?<Award size={11}/>:<Store size={11}/>}
                          {p.vendor_name}
                        </div>

                        <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 min-h-[2.4em] leading-snug" title={p.name}>{p.name}</h3>

                        {/* --- NOUVEAU : ÉTAT & STOCK --- */}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isConditionNeuf ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.safe_condition}
                          </span>
                          <span className={`text-[8px] font-black uppercase flex items-center gap-0.5 ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                            {isOutOfStock ? <AlertCircle size={10} /> : <PackageCheck size={10} />}
                            {isOutOfStock ? 'Rupture' : `${p.safe_stock} Dispo`}
                          </span>
                        </div>

                        {/* --- NOUVEAU : MARQUE, MODÈLE, ANNÉE, RÉFÉRENCE --- */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 mt-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-700 truncate max-w-[60px]" title={p.brand}>{p.brand || '—'}</span>
                          <span>•</span>
                          <span className="truncate max-w-[70px]" title={`${p.safe_model} ${p.safe_year}`}>
                            {p.safe_model} {p.safe_year ? `(${p.safe_year})` : ''}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[70px]" title={p.safe_reference}>Réf: {p.safe_reference}</span>
                        </div>

                        {/* --- COMPATIBILITÉ --- */}
                        {p.compatibility_text && (
                          <div className="mt-2 text-[9px] text-slate-600 line-clamp-1 border-t border-slate-100 pt-1.5" title={p.compatibility_text}>
                            <span className="font-bold text-slate-800">Comp. :</span> {p.compatibility_text}
                          </div>
                        )}

                        <div className="mt-3 mb-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-slate-900 tracking-tight">{p.final_price.toLocaleString('fr-FR')}</span>
                            <span className="text-[10px] font-bold text-slate-500">FCFA</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={9} className={i < Math.round(p.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                            ))}
                            <span className="text-[9px] text-slate-400">({p.reviewsCount})</span>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <button
                            disabled={isOutOfStock}
                            onClick={(e) => { e.preventDefault(); addToCart({...p, price: p.final_price }); toast.success('Ajouté au panier'); }}
                            className={`w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                              isOutOfStock 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-[#2563EB] hover:bg-blue-700 text-white active:scale-95'
                            }`}
                          >
                            <ShoppingCart size={15}/> {isOutOfStock ? 'Indisponible' : 'Ajouter'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 🟢 BOUTONS VOIR PLUS / RÉDUIRE */}
              {(visibleCount < filteredProducts.length || visibleCount > 15) && (
                <div className="flex flex-wrap justify-center items-center gap-3 mt-8 mb-4">
                  {visibleCount < filteredProducts.length && (
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 15)}
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-500 hover:shadow-md font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
                    >
                      Voir plus de pièces <ChevronDown size={16} />
                    </button>
                  )}
                  {visibleCount > 15 && (
                    <button 
                      onClick={() => {
                        setVisibleCount(15);
                        document.getElementById('featured-products-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
                    >
                      Réduire <ChevronUp size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}