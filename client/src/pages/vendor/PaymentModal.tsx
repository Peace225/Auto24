import { X, Smartphone, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: { id: string; name: string; price: string };
  vendorId: string;
}

export default function PaymentModal({ isOpen, onClose, plan, vendorId }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');

  if (!isOpen) return null;

  const handlePayment = async (method: string) => {
    setLoading(true);
    setStep('processing');

    try {
      // 1. Enregistrer l'intention de paiement
      const { error } = await supabase.from('subscriptions').insert([{
        vendor_id: vendorId,
        plan_id: plan.id,
        amount: parseInt(plan.price.replace(/\s/g, '')),
        payment_method: method,
        status: 'pending'
      }]);

      if (error) throw error;

      // 2. Simulation de l'appel API (CinetPay, FedaPay ou Stripe)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. Mise à jour du profil (En production, ceci se fait via Webhook)
      await supabase.from('profiles').update({ 
        subscription_plan: plan.id 
      }).eq('id', vendorId);

      setStep('success');
      toast.success(`Bienvenue dans le plan ${plan.name} !`);
    } catch (err) {
      toast.error("Erreur lors du traitement");
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-100">
        
        {step !== 'success' && (
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}

        <div className="p-8 md:p-10">
          {step === 'select' && (
            <>
              <div className="text-center mb-8">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Finaliser l'activation</p>
                <h3 className="text-2xl font-[1000] text-slate-900 uppercase tracking-tighter italic">Paiement Sécurisé</h3>
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Pack {plan.name}</p>
                  <p className="text-2xl font-[1000] text-slate-900 tracking-tighter">{plan.price} <small className="text-xs uppercase font-black text-slate-400">CFA</small></p>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={() => handlePayment('mobile_money')} className="w-full p-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl flex items-center gap-4 hover:border-amber-500 hover:bg-amber-50/30 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-[1000] uppercase text-slate-900">Mobile Money</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Orange, MTN, Moov</p>
                  </div>
                </button>

                <button onClick={() => handlePayment('card')} className="w-full p-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl flex items-center gap-4 hover:border-blue-500 hover:bg-blue-50/30 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-[1000] uppercase text-slate-900">Carte Bancaire</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Visa, Mastercard</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 tracking-tight">Validation en cours</h3>
                <p className="text-xs font-bold text-slate-400 mt-2">Veuillez valider l'opération sur votre téléphone...</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-[1000] uppercase text-slate-900 tracking-tighter italic">Paiement Reçu !</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                  Votre abonnement {plan.name} est activé.<br/>Vos avantages sont disponibles immédiatement.
                </p>
              </div>
              <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-colors">
                Accéder à mon Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}