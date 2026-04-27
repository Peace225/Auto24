import { useState, useEffect, useCallback } from 'react';
import { 
  PlusCircle, X, UploadCloud, Zap, Package, Loader2, 
  AlertCircle, Trash2, CheckCircle2, Search, ShieldAlert, 
  Crown, Car, Settings as SettingsIcon, Tag, Calendar, Layers, 
  Image as ImageIcon, ChevronLeft, ChevronRight, Info, ListFilter,
  ZapOff, Maximize
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  "Pièces moteur",
  "Filtres et huile",
  "Direction / Suspension / Train",
  "Freinage",
  "Distribution et Accessoires",
  "Embrayage et Boîte de vitesse",
  "Démarrage électrique",
  "Optiques / Phares / Ampoules",
  "Capteurs et Sondes",
  "Essuie-glaces et pièces",
  "Batterie"
];

// --- COMPOSANT CAROUSEL (Inchangé) ---
function ProductCardCarousel({ images, name }: { images: string[], name: string }) {
  const [index, setIndex] = useState(0);
  const displayImages = images && images.length > 0 ? images : ['https://via.placeholder.com/400?text=Pas+d\'image'];
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((prev) => (prev + 1) % displayImages.length); };
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length); };

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-50 flex items-center justify-center group/carousel border border-slate-100">
      <img src={displayImages[index]} alt={name} className="w-full h-full object-contain p-2 transition-all duration-500" />
      {displayImages.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-white/80 backdrop-blur rounded-full shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white z-10"><ChevronLeft size={14} /></button>
          <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white/80 backdrop-blur rounded-full shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white z-10"><ChevronRight size={14} /></button>
          <div className="absolute bottom-2 flex gap-1 z-10">
            {displayImages.map((_, i) => (<div key={i} className={`w-1 h-1 rounded-full transition-all ${i === index ? 'bg-blue-600 w-3' : 'bg-slate-300'}`} />))}
          </div>
        </>
      )}
    </div>
  );
}

export default function VendorProducts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [userPlan, setUserPlan] = useState('free');
  const [productCount, setProductCount] = useState(0);
  const MAX_FREE_PRODUCTS = 10;

  // --- ÉTAT DU FORMULAIRE ENRICHI ---
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', stock: '1', brand: '', model: '', year: '', phase: '', reference: '', category: '',
    // Spécifiques Batterie
    battery_capacity: '',
    battery_voltage: '12V',
    battery_dimensions: '',
    battery_polarity: ''
  });

  const [filesToUpload, setFilesToUpload] = useState<(File | null)[]>([null, null, null, null]);
  const [previews, setPreviews] = useState<string[]>(['', '', '', '']);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('subscription_plan, status').eq('id', user.id).single();
      if (profile) setUserPlan(profile.subscription_plan || 'free');
      const { data: vendorProducts } = await supabase.from('products').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false });
      setProducts(vendorProducts || []);
      setProductCount(vendorProducts?.length || 0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    fetchProducts();
    if (!user) return;
    const channel = supabase.channel(`v-p-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `vendor_id=eq.${user.id}` }, () => fetchProducts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchProducts]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFiles = [...filesToUpload]; newFiles[index] = file; setFilesToUpload(newFiles);
    const newPreviews = [...previews]; newPreviews[index] = URL.createObjectURL(file); setPreviews(newPreviews);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category || !filesToUpload[0]) {
      toast.error("Veuillez remplir les champs obligatoires."); return;
    }
    setIsSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        if (file) {
          const fileName = `products/${user?.id}/${Date.now()}-${i}`;
          await supabase.storage.from('images').upload(fileName, file);
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          uploadedUrls.push(urlData.publicUrl);
        }
      }
      const { error } = await supabase.from('products').insert([{
        vendor_id: user?.id, 
        ...newProduct, 
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock), 
        image_url: uploadedUrls[0], 
        images: uploadedUrls, 
        status: 'pending'
      }]);
      if (error) throw error;
      setIsModalOpen(false); resetForm(); toast.success("En attente de validation !");
    } catch (error: any) { toast.error(error.message); } finally { setIsSaving(false); }
  };

  const resetForm = () => {
    setNewProduct({ name: '', price: '', stock: '1', brand: '', model: '', year: '', phase: '', reference: '', category: '', battery_capacity: '', battery_voltage: '12V', battery_dimensions: '', battery_polarity: '' });
    setFilesToUpload([null, null, null, null]); setPreviews(['', '', '', '']);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-700">
      
      {/* HEADER SECTION (Quotas, etc.) */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-[1000] uppercase text-slate-900 tracking-tighter italic">Catalogue <span className="text-blue-600">Vendeur</span></h1>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{productCount} pièces enregistrées</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/10"><PlusCircle size={14}/> Ajouter une pièce</button>
      </div>

      {/* GRILLE PRODUITS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-3 md:p-4 hover:shadow-2xl transition-all relative group flex flex-col">
            <ProductCardCarousel images={p.images || [p.image_url]} name={p.name} />
            <h3 className="text-[10px] md:text-xs font-[1000] uppercase text-slate-900 leading-tight mb-1 line-clamp-1">{p.name}</h3>
            <p className="text-[8px] font-bold text-blue-600 uppercase mb-2">{p.category}</p>
            <div className="mt-auto pt-2 border-t border-slate-50 flex justify-between items-center">
              <span className="text-xs md:text-sm font-[1000] text-slate-900">{p.price.toLocaleString()} <small className="text-[7px]">CFA</small></span>
              <Trash2 size={12} className="text-red-400 cursor-pointer hover:text-red-600 transition-colors" onClick={() => { if(window.confirm('Supprimer ?')) supabase.from('products').delete().eq('id', p.id); }} />
            </div>
          </div>
        ))}
      </div>

      {/* MODAL D'AJOUT XXL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] z-[10000]">
            <div className="p-6 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <h2 className="text-lg font-[1000] uppercase italic text-slate-900">Nouvelle <span className="text-blue-600">Pièce</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-8 custom-scrollbar">
              
              {/* IMAGES */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <label key={idx} className={`relative aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${previews[idx] ? 'border-blue-500' : 'border-slate-200 bg-slate-50 hover:bg-blue-50'}`}>
                    {previews[idx] ? <img src={previews[idx]} className="w-full h-full object-cover" /> : (
                      <div className="text-center p-2 text-slate-400"><UploadCloud className="mx-auto mb-1" size={20} /><span className="text-[7px] font-black uppercase tracking-tighter">{idx === 0 ? 'Image 1' : `Vue ${idx + 1}`}</span></div>
                    )}
                    <input type="file" className="hidden" onChange={(e) => handleFileChange(idx, e)} accept="image/*" />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COLONNE 1 : BASE */}
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><Tag size={12}/> Détails de vente</h4>
                   <div className="space-y-3">
                      <input className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="DÉSIGNATION (EX: BATTERIE 75AH)" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                      <div className="relative">
                        <ListFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select className="w-full pl-11 p-4 bg-slate-50 rounded-2xl text-[10px] font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase appearance-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                          <option value="">CATÉGORIE...</option>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black text-blue-600 border-none outline-none" placeholder="PRIX (CFA)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-bold border-none outline-none" placeholder="STOCK" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                      </div>
                   </div>
                </div>

                {/* COLONNE 2 : COMPATIBILITÉ & OPTION BATTERIE */}
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><Car size={12}/> Compatibilité</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <input className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold border-none outline-none uppercase focus:ring-2 focus:ring-blue-500" placeholder="MARQUE" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
                      <input className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold border-none outline-none uppercase focus:ring-2 focus:ring-blue-500" placeholder="MODÈLE" value={newProduct.model} onChange={e => setNewProduct({...newProduct, model: e.target.value})} />
                   </div>

                   {/* 🟢 BLOC SPÉCIFIQUE BATTERIE (Apparaît si Catégorie === Batterie) */}
                   {newProduct.category === "Batterie" && (
                     <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 space-y-4 animate-in slide-in-from-right-4 duration-500">
                        <h4 className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-2 mb-2">
                           <ZapOff size={14}/> Fiche Technique Batterie
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-blue-400 uppercase ml-1">Capacité (Ah)</label>
                              <input className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="EX: 75AH" value={newProduct.battery_capacity} onChange={e => setNewProduct({...newProduct, battery_capacity: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-blue-400 uppercase ml-1">Voltage</label>
                              <select className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" value={newProduct.battery_voltage} onChange={e => setNewProduct({...newProduct, battery_voltage: e.target.value})}>
                                 <option value="12V">12V (Auto)</option>
                                 <option value="24V">24V (Poids Lourd)</option>
                                 <option value="6V">6V (Moto/Ancienne)</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-blue-400 uppercase ml-1">Dimensions (mm)</label>
                              <input className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="L X L X H" value={newProduct.battery_dimensions} onChange={e => setNewProduct({...newProduct, battery_dimensions: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-blue-400 uppercase ml-1">Polarité</label>
                              <input className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="+ GAUCHE / DROITE" value={newProduct.battery_polarity} onChange={e => setNewProduct({...newProduct, battery_polarity: e.target.value})} />
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>

              <button onClick={handleAddProduct} disabled={isSaving} className="w-full bg-[#111625] text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <>Mettre en vente <Zap size={16} fill="white" /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}