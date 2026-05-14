import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Loader2, ArrowLeft, CheckCircle, Camera, Copy, Info, SmartphoneNfc, ReceiptText, Zap, Star } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const WAVE_LOGO = "/assets/logo/wave.png";
const ORANGE_LOGO = "/assets/logo/orange.png";
const MTN_LOGO = "/assets/logo/mtn.jpg";
const MOOV_LOGO = "/assets/logo/moov.png";

const PLAN_CONFIG: Record<string, { base: number; commission: number; service: number; operator: number }> = {
  'standard': { base: 0,     commission: 0,   service: 0,   operator: 0 },
  'pro':      { base: 10000, commission: 100, service: 100, operator: 150 }, 
  'premium':  { base: 25000, commission: 250, service: 200, operator: 300 }, 
};

interface Plan {
  name: string;
  tier: string;
  color: string;
}

const OPERATORS = [
  { id: 'wave', name: 'Wave', color: 'bg-[#40BCF4]', number: '07 00 00 00 00', logo: WAVE_LOGO },
  { id: 'orange', name: 'Orange', color: 'bg-[#FF7900]', number: '07 01 01 01 01', logo: ORANGE_LOGO },
  { id: 'mtn', name: 'MTN', color: 'bg-[#FFCC00]', number: '05 05 05 05 05', logo: MTN_LOGO },
  { id: 'moov', name: 'Moov', color: 'bg-[#005DAA]', number: '01 01 01 01 01', logo: MOOV_LOGO }
];

export default function VendorPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const plan = location.state?.plan as Plan | undefined;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('momo');
  const [selectedOp, setSelectedOp] = useState(OPERATORS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentTier = plan?.tier?.toLowerCase() || 'standard';
  const config = PLAN_CONFIG[currentTier] || PLAN_CONFIG['standard'];
  
  const totalToPay = config.base + config.commission + config.service + config.operator;
  const isFreePlan = totalToPay === 0;

  useEffect(() => {
    if (!plan) navigate('/vendor/settings/plans', { replace: true });
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [plan, navigate, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return toast.error("Session expirée.");
    if (!isFreePlan && paymentMethod === 'momo' && !screenshot) {
        return toast.error("Le reçu est obligatoire pour valider le transfert.");
    }

    setIsProcessing(true);
    try {
      let publicImageUrl = "";
      if (!isFreePlan && paymentMethod === 'momo' && screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, screenshot);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
        publicImageUrl = data.publicUrl;
      }

      const { error: subError } = await supabase.from('subscriptions').insert([{
        user_id: user.id,
        vendor_name: user.user_metadata?.full_name || user.email,
        plan_tier: plan?.tier,
        amount_total: totalToPay,
        payment_method: isFreePlan ? 'FREE' : paymentMethod,
        operator: isFreePlan ? 'NONE' : (paymentMethod === 'momo' ? selectedOp.name : 'CARD'),
        proof_url: publicImageUrl,
        status: isFreePlan ? 'active' : 'pending'
      }]);

      if (subError) throw subError;
      setIsSuccess(true);
      timeoutRef.current = setTimeout(() => navigate('/vendor/dashboard'), 3000);
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
      setIsProcessing(false);
    }
  };

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#020305] text-white p-4 lg:p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RECAPITULATIF */}
        <div className="lg:col-span-4 space-y-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-black uppercase tracking-tighter transition-all">
            <ArrowLeft size={14} /> <span>Changer de plan</span>
          </button>
          
          <div className={`p-6 rounded-[2rem] bg-gradient-to-br ${plan.color} shadow-2xl relative overflow-hidden`}>
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic">
                {isFreePlan ? "Statut du Plan" : "Total Net à payer"}
              </span>
              <h3 className="text-4xl font-black italic tracking-tighter mt-1">
                {isFreePlan ? "ACTIF" : `${totalToPay.toLocaleString()} F`}
              </h3>
            </div>
            {isFreePlan ? <Star size={100} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" /> : <ReceiptText size={100} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />}
          </div>

          {!isFreePlan && (
            <div className="bg-[#080A0F] border border-white/5 rounded-[2rem] p-6 space-y-4 shadow-xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-3 italic">Détails de facturation</h4>
                <div className="space-y-3 text-xs italic">
                    <div className="flex justify-between items-center text-slate-400">
                        <span>Abonnement</span>
                        <span className="font-bold">{config.base.toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-500">
                        <span>Frais de service</span>
                        <span className="font-bold">+{ (config.commission + config.service + config.operator).toLocaleString() } F</span>
                    </div>
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-white">
                        <span className="text-[10px] font-black uppercase not-italic tracking-widest">Total Final</span>
                        <span className="text-sm font-black tracking-tight">{totalToPay.toLocaleString()} CFA</span>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* ZONE D'ACTION */}
        <div className="lg:col-span-8 bg-[#080A0F] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[400px]">
          
          {isSuccess && (
            <div className="absolute inset-0 z-50 bg-[#080A0F]/98 backdrop-blur-xl flex flex-col items-center justify-center animate-in zoom-in">
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Plan Mis à Jour</h2>
              <p className="text-slate-500 text-[10px] uppercase mt-2 tracking-widest font-bold italic">Actualisation de vos accès...</p>
            </div>
          )}

          {isFreePlan ? (
            /* --- AJOUT DE KEY POUR STABILISER REACT --- */
            <div key="free-plan-view" className="text-center space-y-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-xs mx-auto">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <ShieldCheck className="text-emerald-500" size={32} />
                    </div>
                    
                    <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">Votre Plan Actuel</span>
                    </div>

                    <h2 className="text-2xl font-black italic uppercase mb-2 text-white">Service Standard</h2>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                        Vous utilisez actuellement les fonctionnalités de base. Vos services sont actifs et aucune action n'est requise de votre part.
                    </p>
                </div>

                <div className="pt-8 flex flex-col gap-3 max-w-sm mx-auto">
                    <button 
                        type="button"
                        onClick={() => navigate('/vendor/dashboard')}
                        className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                    >
                        Retour au Dashboard
                    </button>
                    <p className="text-[9px] text-slate-600 font-bold uppercase italic tracking-tighter">
                        Besoin de plus de puissance ? Explorez les plans Pro ou Premium.
                    </p>
                </div>
            </div>
          ) : (
            /* --- AJOUT DE KEY POUR STABILISER LE FORMULAIRE --- */
            <form key="paid-payment-form" onSubmit={handleActivation} className="space-y-6">
              <div className="flex gap-4 mb-8">
                <button type="button" onClick={() => setPaymentMethod('momo')} className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'momo' ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 bg-white/[0.02] opacity-30'}`}>
                    <SmartphoneNfc size={20} className={paymentMethod === 'momo' ? 'text-amber-500' : ''} />
                    <span className="text-[10px] font-black uppercase italic">Mobile Money</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'card' ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 bg-white/[0.02] opacity-30'}`}>
                    <CreditCard size={20} className={paymentMethod === 'card' ? 'text-amber-500' : ''} />
                    <span className="text-[10px] font-black uppercase italic">Carte Bancaire</span>
                </button>
              </div>

              {paymentMethod === 'momo' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-4 gap-2">
                        {OPERATORS.map((op) => (
                            <button key={op.id} type="button" onClick={() => setSelectedOp(op)} className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedOp.id === op.id ? 'border-white bg-white/10' : 'border-transparent opacity-40'}`}>
                                <img src={op.logo} alt={op.name} className="w-8 h-8 object-contain" />
                                <span className="text-[8px] font-black uppercase">{op.name}</span>
                            </button>
                        ))}
                    </div>
                    <div className={`${selectedOp.color} p-6 rounded-3xl text-white flex justify-between items-center shadow-xl transition-colors`}>
                        <div>
                            <p className="text-[9px] font-black uppercase opacity-70 italic mb-1 text-black/60">Numéro {selectedOp.name}</p>
                            <p className="text-2xl font-mono font-black text-white">{selectedOp.number}</p>
                        </div>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(selectedOp.number); toast.success("Copié !"); }} className="p-4 bg-black/20 rounded-xl hover:bg-black/40 transition-all border border-white/10">
                            <Copy size={18} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase italic text-slate-500 flex items-center gap-2">
                            <Camera size={14} /> Télécharger le reçu ({totalToPay.toLocaleString()} F)
                        </span>
                        <label className="block cursor-pointer">
                            <div className={`w-full h-32 border-2 border-dashed rounded-3xl flex items-center justify-center transition-all ${previewUrl ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                                {previewUrl ? <img src={previewUrl} className="h-full object-contain p-2" /> : <div className="text-[9px] font-black uppercase text-slate-600 italic">Importer la preuve du transfert</div>}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <input type="text" placeholder="NUMÉRO DE CARTE" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm font-mono focus:border-amber-500 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="MM / YY" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center text-sm font-mono outline-none" />
                        <input type="text" placeholder="CVC" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center text-sm font-mono outline-none" />
                    </div>
                </div>
              )}

              <button disabled={isProcessing} className="w-full py-6 bg-amber-500 text-black rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-amber-400 disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-4">
                <span>{isProcessing ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}</span>
                <span>{isProcessing ? "Validation..." : `Confirmer & Payer`}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}