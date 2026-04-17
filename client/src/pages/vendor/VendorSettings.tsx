import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Upload, FileText, Loader2, MapPin, CheckCircle2, 
  Star, Zap, Crown, ArrowRight, ShieldCheck, 
  ShieldAlert, Camera, User as UserIcon 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- CONFIGURATION DES ABONNEMENTS ---
const PACKAGES = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0',
    description: 'Vendez immédiatement, sans paperasse.',
    icon: <Star className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />,
    features: ['Jusqu\'à 10 produits', 'Boutique standard', 'Frais standards', 'Support email'],
    buttonText: 'Plan Actuel',
    popular: false,
    color: 'slate'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '5 000',
    period: '/ mois',
    description: 'Accélérez vos ventes avec la certification.',
    icon: <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />,
    badge: '1 Mois Offert 🎁',
    features: ['Produits illimités', 'Visibilité améliorée', 'Badge Recommandé', 'Certification requise'],
    buttonText: 'Passer en Pro',
    popular: true,
    color: 'blue'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '15 000',
    period: '/ mois',
    description: 'Dominez totalement votre catégorie.',
    icon: <Crown className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />,
    features: ['Mise en avant Accueil', 'Produits sponsorisés', 'Badge Top Vendeur', 'Support WhatsApp VIP'],
    buttonText: 'Devenir Premium',
    popular: false,
    color: 'orange'
  }
];

export default function VendorSettings() {
  const { user, setUser } = useAuthStore(); // On récupère setUser pour mettre à jour la Navbar
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoaded, setIsLoaded] = useState(false);

  const [files, setFiles] = useState<{ idCard: File | null; rccm: File | null; utilityBill: File | null }>({
    idCard: null,
    rccm: null,
    utilityBill: null
  });

  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('vendor_status, subscription_plan, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setVendorStatus(data.vendor_status || 'unverified');
        if (data.subscription_plan) setCurrentPlan(data.subscription_plan);
      } catch (err) {
        console.error("Erreur de profil", err);
      } finally {
        setTimeout(() => setIsLoaded(true), 100);
      }
    };
    fetchVendorProfile();
  }, [user]);

  // --- LOGIQUE UPLOAD PHOTO DE PROFIL ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles') // Assure-toi que ce bucket existe
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // 3. Mettre à jour la table 'profiles'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Mettre à jour les metadata de l'utilisateur pour la Navbar
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      // 5. Mettre à jour le store local
      setUser({ ...user, avatar_url: publicUrl });
      
      toast.success("Photo de profil mise à jour !");
    } catch (error: any) {
      toast.error("Erreur d'upload : " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.idCard || !files.rccm || !files.utilityBill) {
      toast.error("Veuillez fournir les 3 documents requis.");
      return;
    }

    setLoading(true);
    try {
      if (!user) return;
      const paths = {
        id: `vendors/${user.id}/cni.pdf`,
        rccm: `vendors/${user.id}/rccm.pdf`,
        utility: `vendors/${user.id}/facture_cie_sodeci.pdf`
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          vendor_status: 'pending',
          id_card_url: paths.id,
          register_commerce_url: paths.rccm,
          utility_bill_url: paths.utility,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Dossier envoyé ! Analyse en cours...");
      setVendorStatus('pending');
    } catch (err) {
      toast.error("Erreur d'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpgrade = (pkgId: string) => {
    if ((pkgId === 'pro' || pkgId === 'premium') && vendorStatus !== 'approved') {
      toast.error("Certification requise pour ce pack.");
      document.getElementById('certification-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    toast.success(`Demande plan ${pkgId} envoyée !`);
    setCurrentPlan(pkgId);
  };

  const FileSlot = ({ label, subLabel, icon: Icon, file, onChange }: any) => (
    <div className={`group relative border-2 border-dashed rounded-[1.5rem] md:rounded-3xl p-4 md:p-6 transition-all bg-white flex flex-col sm:flex-row items-center sm:items-start gap-3 md:gap-4 overflow-hidden
      ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-500'}`}
    >
      <input type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl shrink-0 flex items-center justify-center transition-colors 
        ${file ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50'}`}
      >
        {file ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-5 h-5 md:w-6 md:h-6" />}
      </div>
      <div className="flex-1 min-w-0 text-center sm:text-left w-full">
        <p className="font-black text-[10px] md:text-[11px] uppercase tracking-tighter text-slate-900 truncate">{label}</p>
        <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 md:mt-1 truncate">
          {file ? <span className="text-emerald-600 italic">{file.name}</span> : subLabel}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-10 md:space-y-16 px-2 sm:px-4 pb-20 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      
      {/* =========================================
          NOUVELLE SECTION : PHOTO DE PROFIL
          ========================================= */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/20"></div>
        
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center relative">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-slate-300" />
            )}
            
            {/* Overlay d'upload */}
            <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Changer</span>
                </>
              )}
              <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>
          {/* Badge statut en ligne */}
          <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">
            {user?.full_name || "Vendeur SpaceAuto"}
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Gestion du profil & Compte personnel
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
               ID: #{user?.id?.substring(0, 8)}
            </span>
            <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">
               Role: {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================
          SECTION 1 : LES PACKS
          ========================================= */}
      <div>
        <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-emerald-400 to-orange-500"></div>
          <span className="text-blue-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] mb-3 md:mb-4 block">Développez votre business</span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter uppercase mb-3 md:mb-4 leading-tight">
            Choisissez votre Pack
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm font-medium leading-relaxed px-2">
            Commencez gratuitement. Passez en Pro ou Premium pour débloquer des ventes illimitées.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-center pt-8">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className={`relative bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 transition-all duration-500 flex flex-col h-full
              ${pkg.popular 
                ? 'border-4 border-blue-600 shadow-2xl lg:-translate-y-4 lg:scale-105 z-10' 
                : 'border border-slate-200 shadow-sm hover:border-blue-200 z-0'}`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                  {pkg.badge}
                </div>
              )}
              <div className="flex justify-between items-start mb-5 md:mb-6">
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${pkg.color === 'blue' ? 'bg-blue-50' : pkg.color === 'orange' ? 'bg-orange-50' : 'bg-slate-50'}`}>
                  {pkg.icon}
                </div>
                {currentPlan === pkg.id && (
                  <span className="bg-emerald-50 text-emerald-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> Actif
                  </span>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight mb-1.5">{pkg.name}</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed min-h-[3rem]">{pkg.description}</p>
              <div className="my-6 md:my-8">
                <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{pkg.price}</span>
                {pkg.id !== 'free' && <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">CFA {pkg.period}</span>}
              </div>
              <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[10px] md:text-xs font-bold text-slate-600 leading-tight">
                    <CheckCircle2 className={`w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 mt-0.5 ${pkg.color === 'blue' ? 'text-blue-500' : pkg.color === 'orange' ? 'text-orange-500' : 'text-slate-300'}`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handlePlanUpgrade(pkg.id)}
                disabled={currentPlan === pkg.id}
                className={`w-full py-3.5 md:py-4 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all mt-auto active:scale-95 ${
                  currentPlan === pkg.id 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : pkg.popular ? 'bg-blue-600 text-white hover:bg-slate-900 shadow-lg' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg'
                }`}
              >
                {pkg.buttonText} {currentPlan !== pkg.id && <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================
          SECTION 2 : CERTIFICATION
          ========================================= */}
      <div id="certification-section" className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm p-6 sm:p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 md:mb-10 border-b border-slate-100 pb-6 md:pb-8">
          <div className="max-w-2xl">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 md:gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 shrink-0" /> Badge "Vendeur Vérifié"
            </h2>
            <p className="text-[11px] md:text-sm font-medium text-slate-500 leading-relaxed">
              Rassurez vos clients, augmentez vos ventes de 40% et débloquez les packs Pro/Premium.
            </p>
          </div>
          
          <div className={`w-full lg:w-auto px-4 py-3 rounded-2xl flex items-center gap-3 border shrink-0 ${
            vendorStatus === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            vendorStatus === 'pending' ? 'bg-blue-50 border-blue-200 text-blue-700' :
            'bg-orange-50 border-orange-200 text-orange-700'
          }`}>
            {vendorStatus === 'approved' ? <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" /> :
             vendorStatus === 'pending' ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> :
             <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" />}
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">Statut actuel</p>
              <p className="text-[11px] md:text-xs font-black uppercase tracking-tight">
                {vendorStatus === 'approved' ? 'Boutique Certifiée' :
                 vendorStatus === 'pending' ? 'Analyse en cours' :
                 'Profil Non Vérifié'}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full">
          {vendorStatus === 'approved' ? (
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8 md:p-10 rounded-[2rem] text-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-2">Félicitations !</h3>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-90 max-w-md mx-auto">
                Votre boutique est désormais certifiée SpaceAuto24.
              </p>
            </div>
          ) : vendorStatus === 'pending' ? (
            <div className="bg-blue-50 border border-blue-100 p-8 md:p-10 rounded-[2rem] text-center text-blue-800">
              <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin mx-auto mb-3 md:mb-4 text-blue-500" />
              <h3 className="text-base md:text-lg font-black uppercase tracking-tight mb-2">Analyse en cours...</h3>
              <p className="text-[10px] md:text-xs font-bold opacity-80 max-w-md mx-auto uppercase tracking-widest">
                Délai estimé : 24h à 48h.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <FileSlot label="Pièce d'identité" subLabel="CNI ou Passeport" icon={FileText} file={files.idCard} onChange={(f: any) => setFiles({...files, idCard: f})} />
                <FileSlot label="Registre Commerce" subLabel="RCCM (PDF)" icon={Upload} file={files.rccm} onChange={(f: any) => setFiles({...files, rccm: f})} />
                <FileSlot label="Localisation" subLabel="CIE / SODECI" icon={MapPin} file={files.utilityBill} onChange={(f: any) => setFiles({...files, utilityBill: f})} />
              </div>
              <div className="pt-2 md:pt-4 text-center">
                <button disabled={loading} className="w-full lg:w-auto px-8 md:px-12 py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-600 disabled:bg-slate-200 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mx-auto">
                  {loading ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <>Soumettre pour certification <ArrowRight className="w-4 h-4 md:w-5 md:h-5" /></>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}