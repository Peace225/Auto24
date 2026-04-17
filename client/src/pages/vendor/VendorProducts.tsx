import { useState, useEffect } from 'react';
import { PlusCircle, X, UploadCloud, Zap, Package, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function VendorProducts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- ÉTATS FREEMIUM ---
  const [userPlan, setUserPlan] = useState('free');
  const [productCount, setProductCount] = useState(0);
  const MAX_FREE_PRODUCTS = 10;

  // État du formulaire
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Mécanique',
    brand: 'Générique', // Requis par la BDD
    image: '', 
    previewUrl: '' 
  });

  // --- INITIALISATION (Récupération des données) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Récupérer le plan du vendeur
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .single();
        if (profile) setUserPlan(profile.subscription_plan || 'free');

        // 2. Récupérer SES produits
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
    };

    fetchData();
  }, [user]);

  // --- LOGIQUE CLOUDINARY ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setNewProduct(prev => ({ ...prev, previewUrl: localPreview }));

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'spaceauto_preset');
    formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'votre_cloud_name');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'votre_cloud_name'}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      if (!response.ok) throw new Error("Échec de l'upload");

      const data = await response.json();
      setNewProduct(prev => ({ ...prev, image: data.secure_url }));
    } catch (error) {
      console.error("Erreur Cloudinary:", error);
      toast.error("Erreur lors du téléchargement de l'image");
    } finally {
      setUploading(false);
    }
  };

  // --- SAUVEGARDE DANS SUPABASE ---
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || (!newProduct.image && !newProduct.previewUrl)) {
      toast.error("Veuillez remplir les champs obligatoires et ajouter une image.");
      return;
    }
    
    if (!user) return;
    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          vendor_id: user.id,
          name: newProduct.name,
          brand: newProduct.brand,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 1,
          images: [newProduct.image || newProduct.previewUrl], // Format Array pour notre BDD
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      // Mise à jour locale
      setProducts([data, ...products]);
      setProductCount(prev => prev + 1);
      setIsModalOpen(false);
      setNewProduct({ name: '', price: '', stock: '', category: 'Mécanique', brand: 'Générique', image: '', previewUrl: '' });
      toast.success("Pièce ajoutée avec succès !");

    } catch (error) {
      console.error("Erreur ajout:", error);
      toast.error("Erreur lors de la création de l'article.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- GESTION DU CLIC SUR AJOUTER ---
  const handleOpenModal = () => {
    if (userPlan === 'free' && productCount >= MAX_FREE_PRODUCTS) {
      toast.error("Limite de 10 produits atteinte. Passez au plan Pro !");
      navigate('/vendor/settings');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    // PLUS BESOIN de "flex min-h-screen ml-72", VendorLayout s'en charge !
    <div className="space-y-6 md:space-y-8 w-full max-w-7xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-700 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-[1000] uppercase text-slate-900 tracking-tighter">
            Catalogue <span className="text-blue-600">Pièces</span>
          </h1>
          {userPlan === 'free' && (
             <div className="flex items-center gap-2 mt-1">
               <span className={`text-[10px] font-black uppercase tracking-widest ${productCount >= MAX_FREE_PRODUCTS ? 'text-red-500' : 'text-slate-400'}`}>
                 {productCount} / {MAX_FREE_PRODUCTS} produits (Plan Gratuit)
               </span>
             </div>
          )}
        </div>
        <button 
          onClick={handleOpenModal} 
          className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 md:py-4 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-slate-900/10 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" /> Ajouter au stock
        </button>
      </div>

      {/* GRILLE DES PRODUITS */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-[2rem] border border-slate-100 shadow-sm">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Catalogue vide</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 mb-6">Commencez à ajouter vos pièces pour générer des ventes.</p>
          <button onClick={handleOpenModal} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-colors">
            Ajouter ma première pièce
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 p-4 sm:p-5 hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-100">
                <img src={p.images?.[0] || 'https://via.placeholder.com/400?text=Sans+Image'} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest backdrop-blur-md border shadow-sm ${p.stock < 5 ? 'bg-red-500/90 text-white border-red-400' : 'bg-white/90 text-slate-900 border-white'}`}>
                  {p.stock} en stock
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-[1000] uppercase text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
                <p className="text-base sm:text-lg font-[1000] text-slate-900 tracking-tighter">{p.price.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span></p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors"><Package className="w-4 h-4"/></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL D'AJOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-emerald-400 to-orange-500"></div>
            <div className="p-6 sm:p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-[1000] uppercase text-slate-900 tracking-tighter">Nouvelle <span className="text-blue-600">Pièce</span></h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ajout rapide au catalogue</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* ZONE D'APERÇU DE L'IMAGE */}
                <div className="relative aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden bg-slate-50 group hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300">
                  {newProduct.previewUrl ? (
                    <>
                      <img src={newProduct.previewUrl} className={`w-full h-full object-cover transition-all duration-500 ${uploading ? 'blur-sm opacity-50' : ''}`} alt="Aperçu de la pièce" />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      )}
                      {!uploading && (
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Modifier l'image</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                      )}
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-blue-500/20 transition-all duration-300">
                        <UploadCloud className="text-slate-400 group-hover:text-blue-600 w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-blue-600 leading-relaxed">
                        Photo principale<br/><span className="text-[8px] font-bold text-slate-300">(Requis)</span>
                      </p>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  )}
                </div>

                {/* FORMULAIRE */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Désignation</label>
                    <input type="text" placeholder="Ex: Kit Embrayage LUK" className="w-full p-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 outline-none border border-slate-200 focus:border-blue-500 focus:bg-white transition-all uppercase placeholder:text-slate-300" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix (CFA)</label>
                      <input type="number" placeholder="0" className="w-full p-4 bg-slate-50 rounded-xl text-xs font-black text-blue-600 outline-none border border-slate-200 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock dispo</label>
                      <input type="number" placeholder="1" className="w-full p-4 bg-slate-50 rounded-xl text-xs font-black text-slate-900 outline-none border border-slate-200 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={handleAddProduct}
                      disabled={uploading || isSaving || !newProduct.name || !newProduct.price || (!newProduct.image && !newProduct.previewUrl)}
                      className="w-full bg-slate-900 text-white py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirmer l'ajout <Zap className="w-4 h-4 fill-white" /></>}
                    </button>
                    <p className="text-[8px] font-bold text-center text-slate-400 uppercase tracking-widest mt-3">La pièce sera visible immédiatement.</p>
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