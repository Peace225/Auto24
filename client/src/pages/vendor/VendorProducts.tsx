import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, X, UploadCloud, Zap, Package, Loader2, AlertCircle, Trash2, CheckCircle2, Search, ShieldAlert, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function VendorProducts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ÉTATS DU VENDEUR ---
  const [userPlan, setUserPlan] = useState('free');
  const [vendorStatus, setVendorStatus] = useState('unverified');
  const [productCount, setProductCount] = useState(0);
  const MAX_FREE_PRODUCTS = 10;

  // État du formulaire
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    brand: 'Générique', 
    image: '', 
    previewUrl: '' 
  });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // --- INITIALISATION & TEMPS RÉEL ---
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, status')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserPlan(profile.subscription_plan || 'free');
        setVendorStatus(profile.status || 'unverified');
      }

      const { data: vendorProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(vendorProducts || []);
      setProductCount(vendorProducts?.length || 0);

    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();

    if (!user) return;
    const channel = supabase
      .channel(`vendor-${user.id}-products-profile`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `vendor_id=eq.${user.id}` }, 
        () => fetchProducts()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
        () => fetchProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProducts]);

  // --- LOGIQUE D'UPLOAD SUPABASE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileToUpload(file);
    const localPreview = URL.createObjectURL(file);
    setNewProduct(prev => ({ ...prev, previewUrl: localPreview }));
  };

  // --- SAUVEGARDE DANS SUPABASE ---
  const handleAddProduct = async () => {
    // 🟢 SÉCURITÉ CÔTÉ SAUVEGARDE
    if (userPlan === 'free' && productCount >= MAX_FREE_PRODUCTS) {
      toast.error("Vous avez atteint votre limite de produits gratuits.");
      return;
    }

    if (!newProduct.name || !newProduct.price || (!fileToUpload && !newProduct.previewUrl)) {
      toast.error("Veuillez remplir les champs obligatoires et ajouter une image.");
      return;
    }
    
    if (!user) return;
    setIsSaving(true);
    setUploading(true);

    try {
      let finalImageUrl = newProduct.image;

      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `products/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, fileToUpload);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from('products')
        .insert([{
          vendor_id: user.id,
          name: newProduct.name,
          brand: newProduct.brand,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 1,
          image_url: finalImageUrl, 
          status: 'pending' // L'admin doit valider
        }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewProduct({ name: '', price: '', stock: '', brand: 'Générique', image: '', previewUrl: '' });
      setFileToUpload(null);
      toast.success("Pièce ajoutée et en attente de validation !");

    } catch (error: any) {
      console.error("Erreur ajout:", error);
      toast.error(`Erreur : ${error.message || 'Impossible de créer la pièce'}`);
    } finally {
      setIsSaving(false);
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if(!window.confirm(`Retirer "${name}" du catalogue ?`)) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success("Produit supprimé");
    } catch (error) {
      toast.error("Impossible de supprimer le produit");
    }
  };

  // 🟢 LA LOGIQUE D'OUVERTURE DU MODAL (CORRIGÉE)
  const handleOpenModal = () => {
    // 1. On vérifie d'abord si la boutique est approuvée par l'admin
    if (vendorStatus !== 'approved') {
      toast.error("Votre boutique doit être validée par un administrateur avant de pouvoir ajouter des pièces.");
      return;
    }

    // 2. Si elle est approuvée, on vérifie la limite de l'abonnement
    if (userPlan === 'free' && productCount >= MAX_FREE_PRODUCTS) {
      toast.error("Limite de 10 produits atteinte. Passez au plan Pro !");
      navigate('/vendor/settings'); // Redirige vers la page pour payer l'abonnement
      return;
    }

    // 3. Si tout est bon, on ouvre le modal
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // 🟢 Variable pour savoir si on bloque le bouton visuellement
  const isLimitReached = userPlan === 'free' && productCount >= MAX_FREE_PRODUCTS;

  return (
    <div className="space-y-6 md:space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔴 ALERTE DE SÉCURITÉ : BOUTIQUE NON VALIDÉE */}
      {!loading && vendorStatus !== 'approved' && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
               <ShieldAlert className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-[1000] text-orange-900 uppercase text-sm md:text-base tracking-tight mb-1">Boutique en attente de validation</h3>
              <p className="text-[10px] md:text-xs font-bold text-orange-800/80 leading-relaxed max-w-xl">
                Vous ne pouvez pas encore ajouter de pièces au catalogue. Veuillez finaliser la configuration de votre boutique et patienter que l'équipe SpaceAuto24 valide vos documents.
              </p>
            </div>
          </div>
          <Link to="/vendor/settings" className="w-full sm:w-auto text-center whitespace-nowrap bg-orange-600 text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md active:scale-95">
            Compléter mon profil
          </Link>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm w-full relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-[1000] uppercase text-[#111625] tracking-tighter italic">
                Mon <span className="text-blue-600">Catalogue</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {userPlan === 'free' && (
                   <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isLimitReached ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                     {productCount} / {MAX_FREE_PRODUCTS} (Gratuit)
                   </span>
                )}
                {userPlan !== 'free' && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Stock Illimité ({productCount})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher une pièce..." 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-xl text-[10px] md:text-xs font-black border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase placeholder:text-slate-400 shadow-inner"
            />
          </div>
          
          {/* 🟢 BOUTON AJOUTER DYNAMIQUE */}
          <button 
            onClick={handleOpenModal} 
            disabled={vendorStatus !== 'approved'}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-md border border-transparent
              ${vendorStatus !== 'approved' 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70' // Désactivé si non validé par admin
                : isLimitReached 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 border-amber-500/50' // Style PRO si limite atteinte
                  : 'bg-[#111625] text-white hover:bg-blue-600 active:scale-95' // Style normal
              }
            `}
          >
            {isLimitReached ? (
              <><Crown className="w-5 h-5" /> Passer PRO</>
            ) : (
              <><PlusCircle className="w-5 h-5" /> Ajouter</>
            )}
          </button>
        </div>
      </div>
      
      {/* RAPPEL GARANTIE / ETAT */}
      {isLimitReached && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] md:text-xs font-medium text-red-800 leading-relaxed">
            <strong className="font-black uppercase">Stock plein :</strong> Vous avez atteint la limite de 10 produits gratuits. <button onClick={() => navigate('/vendor/settings')} className="underline font-bold text-red-600 ml-1 hover:text-red-700">Passez en PRO pour tout débloquer.</button>
          </p>
        </div>
      )}

      {/* GRILLE DES PRODUITS */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-12">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Catalogue vide</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 mb-6">Commencez à ajouter vos pièces pour générer des ventes sur l'accueil.</p>
          <button 
            onClick={handleOpenModal} 
            disabled={vendorStatus !== 'approved'}
            className="bg-blue-50 border border-blue-100 text-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter ma première pièce
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-[1.5rem] border border-slate-200 p-4 sm:p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-500 relative flex flex-col group">
              
              {/* IMAGE ZONE */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                <img 
                  src={p.image_url || 'https://via.placeholder.com/400?text=Sans+Image'} 
                  alt={p.name} 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" 
                />
                
                {/* Badges superposés */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <div className={`px-2.5 py-1 rounded shadow-sm border font-black text-[8px] uppercase tracking-widest ${
                    p.status === 'pending' ? 'bg-orange-500 text-white border-orange-400' : 'bg-emerald-500 text-white border-emerald-400 flex items-center gap-1'
                  }`}>
                    {p.status === 'pending' ? 'En Validation' : <><CheckCircle2 className="w-2.5 h-2.5" /> En Ligne</>}
                  </div>
                  
                  <div className={`w-fit px-2.5 py-1 rounded shadow-sm border font-black text-[8px] uppercase tracking-widest ${
                    p.stock < 5 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white/90 text-slate-700 border-white/50 backdrop-blur-sm'
                  }`}>
                    Stock: {p.stock}
                  </div>
                </div>

                {/* Bouton de suppression rapide au survol */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, p.name); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 scale-90 group-hover:scale-100"
                  title="Supprimer la pièce"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* INFOS ZONE */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-xs sm:text-sm font-[1000] uppercase text-[#111625] tracking-tight leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-4">
                  {p.name}
                </h3>
                
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                  <p className="text-lg font-[1000] text-[#111625] tracking-tighter italic">
                    {p.price.toLocaleString()} <span className="text-[9px] text-slate-400">CFA</span>
                  </p>
                  <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#111625] group-hover:border-[#111625] group-hover:text-white transition-colors">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL D'AJOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 my-auto border border-slate-100">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-emerald-400 to-orange-500"></div>
            <div className="p-6 sm:p-10">
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-[1000] uppercase text-[#111625] tracking-tighter italic">Nouvelle <span className="text-blue-600">Pièce</span></h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ajout rapide au catalogue</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* ZONE D'APERÇU DE L'IMAGE */}
                <div className="relative aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden bg-slate-50 group hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300">
                  {newProduct.previewUrl ? (
                    <>
                      <img src={newProduct.previewUrl} className={`w-full h-full object-contain transition-all duration-500 p-2 ${uploading ? 'blur-sm opacity-50' : ''}`} alt="Aperçu de la pièce" />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      )}
                      {!uploading && (
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm">
                            <UploadCloud className="w-8 h-8 mb-2 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Modifier l'image</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                      )}
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                      <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-blue-500/20 transition-all duration-300">
                        <UploadCloud className="text-slate-300 group-hover:text-blue-600 w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-blue-600 leading-relaxed">
                        Photo principale<br/><span className="text-[8px] font-bold text-slate-300">(Requis)</span>
                      </p>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  )}
                </div>

                {/* FORMULAIRE */}
                <div className="space-y-4 flex flex-col justify-center">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Désignation</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Kit Embrayage LUK" 
                      className="w-full p-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 outline-none border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all uppercase placeholder:text-slate-300 shadow-inner" 
                      value={newProduct.name} 
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix (CFA)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full p-4 bg-slate-50 rounded-xl text-xs font-black text-blue-600 outline-none border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner" 
                        value={newProduct.price} 
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock dispo</label>
                      <input 
                        type="number" 
                        placeholder="1" 
                        className="w-full p-4 bg-slate-50 rounded-xl text-xs font-black text-slate-900 outline-none border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner" 
                        value={newProduct.stock} 
                        onChange={e => setNewProduct({...newProduct, stock: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button 
                      onClick={handleAddProduct}
                      disabled={uploading || isSaving || !newProduct.name || !newProduct.price || (!fileToUpload && !newProduct.previewUrl)}
                      className="w-full bg-[#111625] text-white py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 border border-transparent"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Mettre en Ligne <Zap className="w-4 h-4 fill-white" /></>}
                    </button>
                    <p className="text-[8px] font-bold text-center text-slate-400 uppercase tracking-widest mt-3">Visible sur l'accueil dès validation par l'Admin.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}