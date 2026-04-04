import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VendorSettings() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ 
    idCard: File | null; 
    rccm: File | null;
    utilityBill: File | null; // CIE / SODECI
  }>({
    idCard: null,
    rccm: null,
    utilityBill: null
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification stricte des 3 documents
    if (!files.idCard || !files.rccm || !files.utilityBill) {
      toast.error("DOSSIER INCOMPLET : TOUS LES DOCUMENTS SONT REQUIS");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simulation des URLs de stockage (à lier avec ton bucket Supabase Storage)
      const paths = {
        id: `vendors/${user.id}/cni.pdf`,
        rccm: `vendors/${user.id}/rccm.pdf`,
        utility: `vendors/${user.id}/facture_cie_sodeci.pdf`
      };

      // Mise à jour du profil avec le nouveau statut 'pending'
      const { error } = await supabase
        .from('profiles')
        .update({
          vendor_status: 'pending',
          id_card_url: paths.id,
          register_commerce_url: paths.rccm,
          utility_bill_url: paths.utility, // Assure-toi d'ajouter cette colonne en SQL
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("DOSSIER ENVOYÉ ! ANALYSE EN COURS...");
      
      // Petit délai pour laisser le temps au toast de s'afficher
      setTimeout(() => {
        window.location.reload(); 
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error("ERREUR RÉSEAU : ÉCHEC DE L'ENVOI");
    } finally {
      setLoading(false);
    }
  };

  // Composant interne pour éviter la répétition du design des slots
  const FileSlot = ({ 
    label, 
    subLabel, 
    icon: Icon, 
    file, 
    onChange 
  }: { label: string, subLabel: string, icon: any, file: File | null, onChange: (f: File | null) => void }) => (
    <div className={`group relative border-2 border-dashed rounded-[2.5rem] p-8 transition-all bg-white ${file ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 hover:border-orange-500'}`}>
      <input 
        type="file" 
        accept="image/*,application/pdf"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
      />
      <div className="flex items-center gap-6">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-colors ${file ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
          {file ? <CheckCircle2 className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
        </div>
        <div className="flex-1">
          <p className="font-black text-[11px] uppercase tracking-tighter text-slate-900">{label}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {file ? <span className="text-emerald-600 font-black tracking-normal italic">{file.name}</span> : subLabel}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen">
      <header className="mb-12 text-center">
        <div className="inline-block px-4 py-1 bg-orange-100 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4">
          Certification Vendeur
        </div>
        <h1 className="text-4xl font-[1000] text-slate-900 uppercase tracking-tighter leading-none">
          Activation <span className="text-slate-300 italic">Boutique</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-4">
          Soumettez vos justificatifs pour débloquer votre dashboard
        </p>
      </header>

      <form onSubmit={handleUpload} className="space-y-4">
        
        <FileSlot 
          label="Pièce d'identité" 
          subLabel="CNI, Passeport ou Permis (PDF/JPG)"
          icon={FileText}
          file={files.idCard}
          onChange={(f) => setFiles({...files, idCard: f})}
        />

        <FileSlot 
          label="Registre de Commerce" 
          subLabel="Document RCCM officiel (Format PDF)"
          icon={Upload}
          file={files.rccm}
          onChange={(f) => setFiles({...files, rccm: f})}
        />

        <FileSlot 
          label="Preuve de Localisation" 
          subLabel="Facture CIE ou SODECI (- de 3 mois)"
          icon={MapPin}
          file={files.utilityBill}
          onChange={(f) => setFiles({...files, utilityBill: f})}
        />

        <div className="pt-8">
          <button 
            disabled={loading}
            className="group w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 disabled:bg-slate-200 transition-all shadow-2xl shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-4"
          >
            {loading ? (
              <Loader2 className="animate-spin w-6 h-6" />
            ) : (
              <>
                Finaliser l'inscription
                <CheckCircle2 className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          <p className="text-center text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-6 px-10 leading-relaxed">
            En soumettant ces documents, vous certifiez l'exactitude des informations fournies pour l'exploitation de votre boutique sur SpaceAuto24.
          </p>
        </div>
      </form>
    </div>
  );
}