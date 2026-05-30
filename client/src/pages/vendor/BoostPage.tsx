import React, { useState, useEffect } from 'react';
import { 
  Loader2, X, Zap, CreditCard, ArrowLeft, CheckCircle, AlertCircle, Copy, Check, ArrowRight 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

// 🟢 TES NUMÉROS MARCHANDS (À modifier avec tes vrais numéros)
const MERCHANT_NUMBERS: Record<string, { num: string, name: string }> = {
  'Wave': { num: '07 00 00 00 00', name: 'SPACEAUTO24' },
  'Orange Money': { num: '07 00 00 00 00', name: 'SPACEAUTO24' },
  'MTN MoMo': { num: '05 00 00 00 00', name: 'SPACEAUTO24' }
};

export default function BoostPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [plan, setPlan] = useState('standard');
  const [boostedCount, setBoostedCount] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'config' | 'payment' | 'verify'>('config');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [boostDays, setBoostDays] = useState(7);
  
  // Nouveaux états pour le paiement manuel
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const PRICE_PER_WEEK = 1000;
  const PREMIUM_QUOTA = 100;
  const totalWeeks = Math.round(boostDays / 7);
  
  const isEligibleForFree = () => {
    if (plan === 'premium' && boostedCount < PREMIUM_QUOTA) return true;
    if (plan === 'pro' && totalWeeks <= 1) return true;
    return false;
  };

  const totalCost = isEligibleForFree() ? 0 : totalWeeks * PRICE_PER_WEEK;

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('subscription_plan').eq('id', user?.id).single();
      const userPlan = (profile?.subscription_plan || 'standard').toLowerCase();
      setPlan(userPlan);

      // 🔴 SÉCURITÉ : On ne récupère que les produits "approved" (Validés par l'admin)
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user?.id)
        .eq('status', 'approved') 
        .order('created_at', { ascending: false });
        
      setProducts(productsData || []);

      const count = (productsData || []).filter(p => p.is_boosted).length;
      setBoostedCount(count);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number.replace(/\s/g, ''));
    setIsCopied(true);
    toast.success('Numéro copié !');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const proceedToVerify = (method: string) => {
    setSelectedMethod(method);
    setTransactionId('');
    setStep('verify');
  };

  const finalizeBoost = async () => {
    if (totalCost > 0 && transactionId.trim().length < 4) {
      toast.error("Veuillez entrer un ID de transaction valide");
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fausse attente pour l'UX

    try {
      const boostedUntil = new Date();
      boostedUntil.setDate(boostedUntil.getDate() + boostDays);

      // 1. Activation immédiate du boost
      const { error } = await supabase.from('products').update({
        is_boosted: true,
        boosted_at: new Date().toISOString(),
        boosted_until: boostedUntil.toISOString()
      }).eq('id', selectedProduct.id);

      if (error) throw error;

      // 2. Historique pour l'admin (Paiement avec ID de transaction)
      if (totalCost > 0) {
        await supabase.from('transactions').insert({
          user_id: user?.id,
          amount: totalCost,
          payment_method: selectedMethod,
          type: 'boost',
          status: 'completed',
          reference: transactionId.trim().toUpperCase() // 🟢 L'admin verra ce code
        });
      }

      toast.success("Succès ! Votre pièce est maintenant sponsorisée.");
      await fetchData();
      setIsModalOpen(false);
      setStep('config');
    } catch (err: any) {
      console.error("Erreur:", err);
      toast.error("Erreur lors de l'activation");
    } finally { setIsProcessing(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#020305] flex justify-center items-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-[#020305] text-white p-6 lg:p-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black italic uppercase">Sponsoring</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Plan actuel : <span className="text-blue-500">{plan}</span></p>
          </div>
          {plan === 'premium' && (
            <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-zinc-400">Quota Premium</p>
              <p className="text-lg font-black tracking-tighter">{boostedCount} <span className="text-zinc-500 text-sm">/ {PREMIUM_QUOTA} produits</span></p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
             let imgDisplay = null;
             if (product.images && product.images.length > 0) {
                 try {
                     const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                     imgDisplay = Array.isArray(parsed) ? parsed[0] : parsed;
                 } catch (e) { imgDisplay = product.images; }
             } else if (product.image_url) { imgDisplay = product.image_url; }

            return (
              <div key={product.id} className="bg-[#080A0F] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col hover:border-white/10 transition-colors">
                <div className="aspect-square relative bg-white/5 p-4 flex items-center justify-center">
                  {imgDisplay ? (
                      <img src={imgDisplay.replace(/^["']|["']$/g, '')} className="w-full h-full object-contain mix-blend-screen" alt={product.name} />
                  ) : <div className="text-zinc-700 font-bold uppercase text-xs">Sans image</div>}

                  {product.is_boosted && (
                    <div className="absolute top-3 left-3 bg-blue-600 px-3 py-1.5 rounded-full text-[9px] font-black flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
                      <Zap size={10} fill="white" /> ACTIF
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <div className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-widest">{product.brand || 'Générique'}</div>
                  <h3 className="font-bold text-sm line-clamp-2 mb-4 leading-snug">{product.name}</h3>
                  
                  <div className="mt-auto">
                    {!product.is_boosted ? (
                      <button 
                        onClick={() => { setSelectedProduct(product); setStep('config'); setIsModalOpen(true); }}
                        className="w-full py-3.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                      >
                        Booster cette pièce
                      </button>
                    ) : (
                      <div className="w-full py-3.5 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-blue-500/20 flex items-center justify-center gap-2">
                        <Zap size={12} fill="currentColor" /> Sponsoring en cours
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Message si aucun produit n'est approuvé */}
        {products.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-2">Aucun produit éligible</p>
                <p className="text-xs text-zinc-600">Vous n'avez pas encore de pièces validées par l'administration.</p>
            </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0D0F14] border border-white/10 w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
            
            {/* STEP 1: CONFIGURATION */}
            {step === 'config' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black uppercase italic">Réglages</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Durée du sponsoring</span>
                    <span className="text-3xl font-black text-blue-500 italic">{totalWeeks} SEM.</span>
                  </div>
                  <input type="range" min="7" max="56" step="7" value={boostDays} onChange={(e) => setBoostDays(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none accent-blue-600" />
                </div>

                <div className="bg-zinc-900/80 rounded-3xl p-6 border border-white/5">
                   <div className="flex justify-between text-[10px] font-black uppercase mb-4">
                     <span className="text-zinc-500 italic">Avantage {plan}</span>
                     <span className={totalCost === 0 ? "text-green-500" : "text-zinc-400"}>{totalCost === 0 ? "INCLUS" : "QUOTA DÉPASSÉ"}</span>
                   </div>
                   <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                     <span className="font-black uppercase italic text-sm">A Payer</span>
                     <span className="text-3xl font-black text-blue-500 tracking-tighter">{totalCost.toLocaleString()} <span className="text-xs">CFA</span></span>
                   </div>
                </div>

                <button 
                  onClick={() => totalCost > 0 ? setStep('payment') : finalizeBoost()}
                  disabled={isProcessing}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : totalCost > 0 ? <CreditCard size={18} /> : <Zap size={18} />}
                  <span>{isProcessing ? "Activation..." : totalCost > 0 ? "Procéder au paiement" : "Activer le boost offert"}</span>
                </button>
              </div>
            )}

            {/* STEP 2: CHOIX MÉTHODE */}
            {step === 'payment' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('config')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full"><ArrowLeft size={20}/></button>
                  <h2 className="text-xl font-black uppercase italic">Paiement</h2>
                </div>
                <p className="text-xs text-zinc-400 font-medium">Sélectionnez le réseau pour régler <span className="text-white font-bold">{totalCost.toLocaleString()} CFA</span></p>

                <div className="grid grid-cols-1 gap-3">
                  {Object.keys(MERCHANT_NUMBERS).map((m) => (
                    <button key={m} onClick={() => proceedToVerify(m)} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
                      <span className="font-black uppercase text-xs tracking-widest">{m}</span>
                      <ArrowRight size={18} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: VÉRIFICATION MANUELLE */}
            {step === 'verify' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setStep('payment')} disabled={isProcessing} className="p-2 bg-white/5 hover:bg-white/10 rounded-full disabled:opacity-50"><ArrowLeft size={20}/></button>
                  <h2 className="text-xl font-black uppercase italic">Validation</h2>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">1. Envoyez le paiement</p>
                  <p className="text-sm font-medium text-zinc-300 mb-2">Veuillez transférer <strong className="text-white">{totalCost.toLocaleString()} CFA</strong> au numéro {selectedMethod} suivant :</p>
                  
                  <div className="flex items-center justify-between bg-[#0D0F14] border border-white/10 p-3 rounded-xl mt-3">
                    <div>
                      <div className="text-xs font-bold text-zinc-400">{MERCHANT_NUMBERS[selectedMethod]?.name}</div>
                      <div className="text-lg font-black tracking-widest">{MERCHANT_NUMBERS[selectedMethod]?.num}</div>
                    </div>
                    <button onClick={() => handleCopyNumber(MERCHANT_NUMBERS[selectedMethod]?.num)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-blue-500">
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">2. Confirmez la transaction</p>
                  <input 
                    type="text" 
                    placeholder={`ID de transaction ${selectedMethod}...`} 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    className="w-full bg-[#080A0F] border border-white/10 p-4 rounded-xl text-sm font-bold uppercase tracking-widest placeholder:text-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[9px] text-zinc-600 font-medium text-center">Vous trouverez cet ID dans le SMS de confirmation de l'opérateur.</p>
                </div>

                <button 
                  onClick={finalizeBoost}
                  disabled={isProcessing || transactionId.trim().length < 4}
                  className="w-full py-5 mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                  <span>{isProcessing ? "Activation..." : "Activer le Sponsoring"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}