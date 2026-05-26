import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Store, MapPin, Loader2, Package, Search, Crown, Star, ShieldCheck, MessageSquareQuote, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getPublicPrice } from '../../utils/pricing';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États formulaire avis
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  const fetchData = async () => {
    setIsLoading(true);
    const { data: vendorData } = await supabase.from('profiles').select('*, subscriptions(package_name, status)').eq('id', id).single();
    const plan = vendorData?.subscriptions?.find((s:any)=>s.status==='active')?.package_name?.toLowerCase() || 'standard';
    setVendor({...vendorData, plan});

    const { data: productsData } = await supabase.from('products').select('*').eq('vendor_id', id).eq('status', 'approved');
    setProducts(productsData || []);

    const { data: reviewsData } = await supabase.from('reviews').select('*, profiles(full_name)').in('product_id', (productsData || []).map(p => p.id));
    setReviews(reviewsData || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Connectez-vous pour laisser un avis");
    const { error } = await supabase.from('reviews').insert([{ product_id: products[0]?.id, rating, comment, user_id: user.id }]);
    if (error) toast.error("Erreur d'envoi");
    else { toast.success("Avis publié !"); setComment(''); fetchData(); }
  };

  const style = {
    premium: { gradient: 'from-amber-500 to-orange-600', icon: Crown, label: 'PREMIUM' },
    pro: { gradient: 'from-blue-600 to-indigo-600', icon: Star, label: 'PRO' },
    standard: { gradient: 'from-slate-700 to-slate-900', icon: ShieldCheck, label: 'VÉRIFIÉ' }
  }[vendor?.plan as keyof typeof style || 'standard'];

  const categories = useMemo(() => ['Tous', ...new Set(products.map(p => p.category || 'Autres'))], [products]);
  const filteredProducts = useMemo(() => products.filter(p => (p.name.toLowerCase().includes(searchQuery.toLowerCase())) && (activeCategory === 'Tous' || p.category === activeCategory)), [products, searchQuery, activeCategory]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-[#FCFCFD]">
      {/* HEADER HERO */}
      <div className={`relative bg-gradient-to-r ${style.gradient} text-white pt-12 pb-16`}>
        <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-white/20 transition backdrop-blur"><ArrowLeft size={14} /> Retour</button>
        <div className="max-w-6xl mx-auto px-6 mt-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-2xl"><img src={vendor?.avatar_url} className="w-full h-full object-contain rounded-2xl" /></div>
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-black uppercase opacity-90"><style.icon size={12} /> {style.label}</div>
              <h1 className="text-4xl font-black uppercase">{vendor?.store_name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLONNE GAUCHE : CATALOGUE */}
        <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded-3xl shadow-sm border mb-8">
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <div className="flex gap-2 overflow-x-auto">{categories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase ${activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{cat}</button>)}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
                <Link to={`/product/${p.id}`} key={p.id} className="bg-white p-3 rounded-3xl border hover:shadow-xl transition-all">
                    <img src={p.image_url} className="w-full aspect-square object-cover rounded-2xl mb-3" />
                    <h3 className="font-black text-xs px-1 truncate">{p.name}</h3>
                    <p className="text-blue-600 font-black text-sm px-1 mt-1">{getPublicPrice(p.price).toLocaleString()} CFA</p>
                </Link>
                ))}
            </div>
        </div>

        {/* COLONNE DROITE : SIDEBAR */}
        <div className="space-y-8">
            {/* PLAN & CERTIFICATION */}
            <div className={`bg-gradient-to-br ${style.gradient} p-6 rounded-3xl text-white`}>
                <div className="flex items-center gap-2 mb-2 font-black uppercase text-sm"><style.icon size={20}/> {style.label}</div>
                <div className="text-[10px] opacity-80">Boutique certifiée par le réseau. Engagement qualité garanti.</div>
            </div>

            {/* FORMULAIRE AVIS */}
            <form onSubmit={submitReview} className="bg-white p-6 rounded-3xl border shadow-sm">
                <h3 className="font-black uppercase mb-4 text-sm">Noter la boutique</h3>
                <div className="flex gap-2 mb-4">{[1,2,3,4,5].map(s => <Star key={s} size={24} className={rating >= s ? "fill-amber-400 text-amber-400 cursor-pointer" : "cursor-pointer"} onClick={() => setRating(s)} />)}</div>
                <textarea className="w-full p-4 bg-slate-50 rounded-2xl mb-4 text-sm" value={comment} onChange={e => setComment(e.target.value)} placeholder="Votre avis..." required />
                <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 text-xs">
                    <Send size={14} /> Publier l'avis
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}