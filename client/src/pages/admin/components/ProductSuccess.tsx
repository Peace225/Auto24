import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, Edit2, Info, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface ProductSuccessProps {
  setActiveTab: (tab: string) => void;
  onEdit: (product: any) => void;
}

export default function ProductSuccess({ setActiveTab, onEdit }: ProductSuccessProps) {
  const [product, setProduct] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const savedProduct = localStorage.getItem('last_published_product');
    if (savedProduct) {
      setProduct(JSON.parse(savedProduct));
    }
  }, []);

  const handleEdit = () => {
    onEdit(product);
    setActiveTab('add-product');
  };

  // Fonction pour valider la publication interne
  const handlePublish = async () => {
    if (!product) return;
    setIsPublishing(true);
    try {
      // Met à jour le statut du produit à 'published' (visible côté client)
      const { error } = await supabase
        .from('products')
        .update({ status: 'published' })
        .eq('id', product.id);

      if (error) throw error;

      toast.success("Produit validé et publié avec succès !");
      setActiveTab('products'); // Redirige vers la liste des produits
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10">
        <p>Aucune information de produit trouvée.</p>
        <button onClick={() => setActiveTab('add-product')} className="mt-4 text-blue-500 underline">
          Retourner à la publication
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      {/* Bouton retour */}
      <button 
        onClick={() => setActiveTab('add-product')} 
        className="flex items-center text-slate-500 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft size={20} /> Retour à l'ajout
      </button>

      {/* Header Succès */}
      <div className="flex flex-col items-center text-green-500 mb-8">
        <CheckCircle size={56} />
        <h1 className="text-2xl font-black mt-4 text-white uppercase tracking-wider">Pré-enregistrement Réussi</h1>
        <p className="text-slate-400 text-sm">Le produit est prêt à être validé pour la Boutique</p>
      </div>

      {/* Carte d'affichage uniforme */}
      <div className="bg-[#0A0E14] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl">
        
        {/* Image du produit */}
        <div className="w-full h-56 overflow-hidden rounded-2xl mb-6 bg-black/20">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">Pas d'image</div>
          )}
        </div>

        {/* En-tête de la carte */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black text-white">{product.name}</h2>
            <p className="text-blue-500 text-xs font-bold uppercase tracking-widest">{product.brand}</p>
          </div>
          <span className="bg-blue-600/20 text-blue-500 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck size={12} /> OFFICIEL
          </span>
        </div>

        {/* Grille d'informations techniques */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <DetailCard label="Prix" value={`${product.price?.toLocaleString()} FCFA`} />
          <DetailCard label="Stock" value={product.stock} />
          <DetailCard label="État" value={product.condition} />
          <DetailCard label="Réf OEM" value={product.oem_reference || '-'} />
          <DetailCard label="Véhicule" value={product.vehicle_model || '-'} />
          <DetailCard label="Année" value={product.year || '-'} />
        </div>

        {/* Description détaillée */}
        <div className="mb-8">
          <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-2 flex items-center gap-2">
            <Info size={12} /> Description
          </h4>
          <p className="text-slate-300 text-sm bg-black/20 p-4 rounded-xl italic">
            {product.description || 'Aucune description fournie.'}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button 
            onClick={handleEdit}
            className="py-3 border border-white/10 hover:bg-white/5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
          >
            <Edit2 size={16} /> Éditer
          </button>
          
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="py-3 bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all text-white disabled:opacity-50"
          >
            {isPublishing ? 'Publication...' : <><Check size={16} /> Valider & Publier</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-[#05070B] p-3 rounded-xl border border-white/5">
      <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">{label}</p>
      <p className="text-white font-semibold text-sm truncate">{value}</p>
    </div>
  );
}