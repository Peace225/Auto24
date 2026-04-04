import { useState } from 'react';
import VendorSidebar from './VendorSidebar';
import { PlusCircle, X, UploadCloud, Zap, Package } from 'lucide-react';

export default function VendorProducts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // État du formulaire
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Mécanique',
    image: '', // URL finale Cloudinary
    previewUrl: '' // URL locale temporaire pour l'aperçu immédiat
  });

  // Données de test
  const [products, setProducts] = useState([
    { 
      id: 1, 
      name: "Plaquettes Brembo X", 
      price: "45,000 CFA", 
      stock: 12, 
      category: "Freinage",
      image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400"
    }
  ]);

  // --- LOGIQUE D'UPLOAD ET D'APERÇU ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. GÉNERER L'APERÇU IMMÉDIAT (Local)
    // createObjectURL crée une URL temporaire pointant vers le fichier sur ton PC
    const localPreview = URL.createObjectURL(file);
    setNewProduct(prev => ({ ...prev, previewUrl: localPreview }));

    // 2. ENVOYER VERS CLOUDINARY (Arrière-plan)
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'votre_preset_unsigned');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'votre_cloud_name'}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      if (!response.ok) throw new Error("Échec de l'upload");

      const data = await response.json();
      // 3. MISE À JOUR AVEC L'URL FINALE
      setNewProduct(prev => ({ ...prev, image: data.secure_url }));
    } catch (error) {
      console.error("Erreur Cloudinary:", error);
      // Optionnel : remettre l'aperçu à zéro si l'upload échoue vraiment
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || (!newProduct.image && !newProduct.previewUrl)) return;
    
    const productToAdd = {
      id: Date.now(),
      ...newProduct,
      price: `${newProduct.price} CFA`,
      stock: parseInt(newProduct.stock) || 0,
      image: newProduct.image || newProduct.previewUrl // Fallback sur l'aperçu si Cloudinary pas configuré
    };

    setProducts([productToAdd, ...products]);
    setIsModalOpen(false);
    // Reset complet du formulaire
    setNewProduct({ name: '', price: '', stock: '', category: 'Mécanique', image: '', previewUrl: '' });
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
      <VendorSidebar />
      
      <main className="flex-1 lg:ml-72 p-8 pt-28">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12 animate-in fade-in duration-700">
          <h1 className="text-3xl font-[1000] uppercase text-slate-900 tracking-tighter">Catalogue <span className="text-slate-400">Pièces</span></h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-orange-500 transition-all duration-300 shadow-xl shadow-slate-900/10">
            <PlusCircle className="w-5 h-5" /> Ajouter au stock
          </button>
        </div>

        {/* GRILLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
              <div className="relative h-48 w-full rounded-[2rem] overflow-hidden mb-6 bg-slate-50">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className={`absolute top-4 left-4 px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest backdrop-blur-sm border ${p.stock < 5 ? 'bg-orange-500/10 text-orange-600 border-orange-200' : 'bg-white/80 text-slate-900 border-white/20'}`}>
                  {p.stock} en stock
                </div>
              </div>
              <h3 className="text-sm font-[1000] uppercase text-slate-900 tracking-tight leading-tight group-hover:text-orange-500 transition-colors">{p.name}</h3>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                <p className="text-lg font-[1000] text-slate-900">{p.price}</p>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors"><Package className="w-5 h-5"/></div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL ÉLÉGANT AVEC APERÇU GARANTI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600"></div>
            <div className="p-12">
              <div className="flex justify-between items-start mb-10">
                <h2 className="text-2xl font-[1000] uppercase text-slate-900 tracking-tighter">Nouvelle <span className="text-orange-500">Référence</span></h2>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* ZONE D'APERÇU DE L'IMAGE (CORRIGÉE) */}
                <div className="relative aspect-square border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden bg-slate-50 group hover:border-orange-500 hover:bg-orange-50/30 transition-all duration-500">
                  
                  {/* Si previewUrl existe, on affiche l'aperçu instantané */}
                  {newProduct.previewUrl ? (
                    <>
                      <img 
                        src={newProduct.previewUrl} 
                        className={`w-full h-full object-cover transition-all duration-500 ${uploading ? 'blur-sm opacity-50' : ''}`} 
                        alt="Aperçu de la pièce" 
                      />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {/* Bouton pour changer l'image si l'aperçu ne convient pas */}
                      {!uploading && (
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Changer la photo</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                      )}
                    </>
                  ) : (
                    // État initial : Pas d'image sélectionnée
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group p-8 text-center">
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 mx-auto group-hover:scale-110 group-hover:shadow-orange-500/10 transition-all duration-500">
                        <UploadCloud className="text-slate-400 group-hover:text-orange-500 w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400 group-hover:text-orange-500 leading-relaxed">
                        Glisser ou sélectionner la photo de la pièce
                      </p>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  )}
                </div>

                {/* FORMULAIRE */}
                <div className="space-y-6">
                  <input type="text" placeholder="DÉSIGNATION (EX: KIT EMBRAYAGE LUK)" className="w-full p-5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none border-2 border-transparent focus:border-orange-500 transition-all uppercase tracking-widest" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="PRIX (CFA)" className="p-5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none border-2 border-transparent focus:border-orange-500 transition-all" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                    <input type="number" placeholder="STOCK" className="p-5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none border-2 border-transparent focus:border-orange-500 transition-all" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                  </div>
                  <button 
                    onClick={handleAddProduct}
                    disabled={uploading || !newProduct.name || (!newProduct.image && !newProduct.previewUrl)}
                    className="w-full group relative overflow-hidden bg-slate-900 text-white py-6 rounded-[1.8rem] font-[1000] uppercase tracking-[0.25em] text-[10px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                       {uploading ? 'Envoi en cours...' : 'Confirmer l\'ajout'} <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                    </span>
                    <div className="absolute inset-0 bg-orange-500 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}