import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Upload, FileText, Loader2, MapPin, CheckCircle2, 
  Star, Zap, Crown, ArrowRight, ShieldCheck, 
  ShieldAlert, Camera, User as UserIcon, Diamond, 
  Sparkles, BadgeCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import PaymentModal from './PaymentModal'; 
import CertificationInfoModal from './CertificationInfoModal';

const PACKAGES = [
  {
    id: 'free',
    name: 'Standard',
    price: '0',
    description: 'L’essentiel pour débuter votre activité.',
    icon: <Star className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />,
    features: ['10 articles max', 'Boutique standard', 'Frais standards', 'Support community'],
    buttonText: 'Plan Actuel',
    color: 'slate'
  },
  {
    id: 'pro',
    name: 'Pro Expérience',
    price: '5 000',
    period: '/ mois',
    description: 'La puissance de la certification SpaceAuto.',
    icon: <Zap className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />,
    badge: 'Populaire',
    features: ['Stock illimité', 'Badge Certifié Or', 'Priorité moteur de recherche', 'Analytics avancés'],
    buttonText: 'Passer en Pro',
    popular: true,
    color: 'amber'
  },
  {
    id: 'premium',
    name: 'Élite Royale',
    price: '15 000',
    period: '/ mois',
    description: 'Le summum du prestige pour les leaders.',
    icon: <Crown className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />,
    features: ['Showroom Accueil 7j/7', 'Compte Manager Dédié', 'Frais réduits -20%', 'WhatsApp VIP Conciergerie'],
    buttonText: 'Devenir Élite',
    color: 'orange'
  }
];

export default function VendorSettings() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [files, setFiles] = useState<{ idCard: File | null; rccm: File | null; utilityBill: File | null }>({
    idCard: null,
    rccm: null,
    utilityBill: null
  });

  const fetchVendorProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('vendor_status, subscription_plan, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setVendorStatus(data.vendor_status || 'unverified');
      if (data.subscription_plan) setCurrentPlan(data.subscription_plan);
      
      // Sync local store if different
      if (data.avatar_url && data.avatar_url !== user.avatar_url) {
        setUser({ ...user, avatar_url: data.avatar_url });
      }
    } catch (err) {
      console.error("Erreur profil:", err);
    } finally {
      setIsLoaded(true);
    }
  }, [user, setUser]);

  useEffect(() => {
    fetchVendorProfile();

    const channel = supabase
      .channel(`realtime-settings-${user?.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user?.id}` 
      }, (payload) => {
        setVendorStatus(payload.new.vendor_status);
        setCurrentPlan(payload.new.subscription_plan);
        // Mise à jour automatique de la photo si changée ailleurs
        if (payload.new.avatar_url) setUser({ ...user!, avatar_url: payload.new.avatar_url });
        toast.success("Compte mis à jour par l'administration.");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchVendorProfile, user, setUser]);

  // 🟢 LOGIQUE D'UPLOAD AVATAR (AVEC SYNC NAVBAR)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (max 2Mo)");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get URL
      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(filePath);

      // 3. Update Profile Table
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (dbError) throw dbError;

      // 4. Update Global Store (Navbar change instantanément)
      setUser({ ...user, avatar_url: publicUrl });
      
      toast.success("Portrait mis à jour !");
    } catch (error: any) {
      toast.error(`Erreur upload : ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePlanUpgrade = (pkg: any) => {
    if (pkg.id === currentPlan) return;
    if ((pkg.id === 'pro' || pkg.id === 'premium') && vendorStatus !== 'approved') {
      setIsInfoModalOpen(true); 
      return;
    }
    setSelectedPlanForPayment(pkg);
  };

  // 🟢 LOGIQUE DE CERTIFICATION (UPLOAD RÉEL DES DOCS)
  const handleCertificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.idCard || !files.rccm || !files.utilityBill) {
      toast.error("Le dossier doit être complet.");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Upload des 3 fichiers vers un bucket 'vendor-documents'
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        const path = `${user?.id}/${key}-${Date.now()}`;
        const { data, error } = await supabase.storage.from('images').upload(path, file!);
        if (error) throw error;
        return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      // 2. Mise à jour de la table profiles
      await supabase.from('profiles').update({ 
        vendor_status: 'pending',
        // On pourrait stocker les URLs ici si tes colonnes existent
      }).eq('id', user?.id);

      setVendorStatus('pending');
      toast.success("Dossier d'Élite transmis !");
    } catch (err: any) {
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const FileSlot = ({ label, subLabel, icon: Icon, file, onChange }: any) => (
    <div className={`group relative border-2 border-dashed rounded-[2rem] p-6 transition-all duration-500 cursor-pointer
      ${file ? 'border-amber-500 bg-amber-500/5' : 'border-slate-200 hover:border-amber-400 bg-white'}`}
    >
      <input type="file" onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className="flex flex-col items-center gap-3">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 
          ${file ? 'bg-amber-500 text-white rotate-[360deg]' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-50'}`}
        >
          {file ? <BadgeCheck className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>
        <div className="text-center">
          <p className="font-black text-[10px] uppercase tracking-widest text-slate-900">{label}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
            {file ? <span className="text-amber-600 truncate block max-w-[120px]">{file.name}</span> : subLabel}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-10 md:space-y-16 pb-24 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
      
      {/* HEADER PROFIL */}
      <div className="bg-[#05070A] rounded-[3rem] p-8 md:p-12 border border-amber-500/10 shadow-2xl relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-amber-500/30 p-2 relative">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-amber-500">
                {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile" /> : <UserIcon className="w-12 h-12 text-slate-600" />}
              </div>
              <label className="absolute bottom-1 right-1 w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 border-4 border-[#05070A]">
                <Camera className="w-4 h-4" />
                <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            {uploadingAvatar && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
          </div>
          <div className="flex-1 text-center md:text-left text-white">
            <h1 className="text-3xl md:text-5xl font-[1000] uppercase tracking-tighter italic mb-2">{user?.full_name || "Vendeur Élite"}</h1>
            <p className="text-amber-500/60 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-2 justify-center md:justify-start">
              <Diamond className="w-3 h-3" /> Membre du réseau officiel Abidjan
            </p>
          </div>
        </div>
      </div>

      {/* PLANS */}
      <div className="space-y-12">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl font-[1000] text-slate-900 uppercase tracking-tighter">Votre <span className="text-amber-500 italic">Abonnement</span></h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className={`relative bg-white rounded-[2.5rem] p-8 md:p-10 transition-all duration-700 flex flex-col h-full border-2 
              ${currentPlan === pkg.id ? 'border-amber-500 shadow-2xl scale-105 z-10' : 'border-slate-100 hover:border-amber-200'}`}>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{pkg.name}</h3>
              <div className="mb-10"><span className="text-4xl font-[1000] text-slate-900 tracking-tighter">{pkg.price}</span></div>
              <ul className="space-y-4 mb-10 flex-grow">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-600"><Sparkles className="w-4 h-4 text-amber-400 shrink-0" /> {f}</li>
                ))}
              </ul>
              <button 
                onClick={() => handlePlanUpgrade(pkg)}
                disabled={currentPlan === pkg.id}
                className={`w-full py-5 rounded-2xl font-[1000] text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg
                  ${currentPlan === pkg.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-black text-white hover:bg-amber-500'}`}>
                {currentPlan === pkg.id ? 'Plan Actuel' : pkg.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CERTIFICATION */}
      <div id="certification-section" className="bg-[#05070A] rounded-[3rem] p-8 md:p-16 relative overflow-hidden border border-amber-500/10 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-12 relative z-10">
          <div className="lg:w-1/3 space-y-6">
            <h2 className="text-3xl font-[1000] text-white uppercase tracking-tighter leading-none italic">Certification <br/> <span className="text-amber-500">Officielle</span></h2>
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${vendorStatus === 'approved' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-white/60'}`}>
              {vendorStatus === 'approved' ? <BadgeCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              <span className="text-[10px] font-[1000] uppercase tracking-widest">{vendorStatus === 'approved' ? 'Boutique Certifiée' : 'Validation Requise'}</span>
            </div>
          </div>
          <div className="lg:w-2/3">
            {vendorStatus === 'approved' ? (
              <div className="h-full bg-amber-500 text-black p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-2xl">
                <Crown className="w-16 h-16 mb-6" />
                <h3 className="text-2xl font-[1000] uppercase tracking-tighter mb-2">Statut Vérifié</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-2">Votre excellence est reconnue.</p>
              </div>
            ) : vendorStatus === 'pending' ? (
              <div className="h-full bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center text-white">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-6" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Analyse en cours</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Réponse sous 24h à 48h.</p>
              </div>
            ) : (
              <form onSubmit={handleCertificationSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FileSlot label="ID Card" subLabel="CNI / Passeport" icon={FileText} file={files.idCard} onChange={(f: any) => setFiles({...files, idCard: f})} />
                  <FileSlot label="RCCM" subLabel="Registre (PDF)" icon={Upload} file={files.rccm} onChange={(f: any) => setFiles({...files, rccm: f})} />
                  <FileSlot label="Adresse" subLabel="CIE / SODECI" icon={MapPin} file={files.utilityBill} onChange={(f: any) => setFiles({...files, utilityBill: f})} />
                </div>
                <button disabled={loading} className="w-full py-5 bg-amber-500 text-black rounded-2xl font-[1000] text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-4">
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Soumettre mon dossier d'élite"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {selectedPlanForPayment && (
        <PaymentModal 
          isOpen={!!selectedPlanForPayment}
          onClose={() => setSelectedPlanForPayment(null)}
          plan={selectedPlanForPayment}
          vendorId={user?.id || ''}
        />
      )}

      <CertificationInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
    </div>
  );
}