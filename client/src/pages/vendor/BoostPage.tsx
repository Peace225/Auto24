import React, { useState, useEffect } from 'react';
import { 
  Rocket, Loader2, X, Zap, CreditCard, Smartphone, ArrowLeft, CheckCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function BoostPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [plan, setPlan] = useState('standard');
  const [boostedCount, setBoostedCount] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'config' | 'payment'>('config');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [boostDays, setBoostDays] = useState(7);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CONFIGURATION LOGIQUE ---
  const PRICE_PER_WEEK = 1000;
  const PREMIUM_QUOTA = 100;
  
  const totalWeeks = Math.round(boostDays / 7);
  
  // Vérification du droit au gratuité
  const isEligibleForFree = () => {
    if (plan === 'premium' && boostedCount < PREMIUM_QUOTA) return true;
    if (plan === 'pro' && totalWeeks <= 1) return true; // Exemple: Pro a 1 semaine offerte
    return false;
  };

  const totalCost = isEligibleForFree() ? 0 : totalWeeks * PRICE_PER_WEEK;

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    try {
      setLoading(true);
      // 1. Récupérer le profil et le plan
      const { data: profile } = await supabase.from('profiles').select('subscription_plan').eq('id', user?.id).single();
      const userPlan = (profile?.subscription_plan || 'standard').toLowerCase();
      setPlan(userPlan);

      // 2. Récupérer les produits
      const { data: productsData } = await supabase.from('products').select('*').eq('vendor_id', user?.id).order('created_at', { ascending: false });
      setProducts(productsData || []);

      // 3. Compter combien sont déjà boostés
      const count = productsData?.filter(p => p.is_boosted).length || 0;
      setBoostedCount(count);

    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const finalizeBoost = async () => {
    setIsProcessing(true);
    try {
      const boostedUntil = new Date();
      boostedUntil.setDate(boostedUntil.getDate() + boostDays);

      await supabase.from('products').update({ 
        is_boosted: true, 
        boosted_at: new Date().toISOString(),
        boosted_until: boostedUntil.toISOString() 
      }).eq('id', selectedProduct.id);

      await fetchData();
      setIsModalOpen(false);
      setStep('config');
    } catch (err) {
      alert("Erreur");
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#020305] text-white p-6 lg:p-10 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header avec Statut Quota */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black italic uppercase italic">Sponsoring</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
              Plan actuel : <span className="text-blue-500">{plan}</span>
            </p>
          </div>
          
          {plan === 'premium' && (
            <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-zinc-400">Quota Premium</p>
              <p className="text-lg font-black tracking-tighter">
                {boostedCount} <span className="text-zinc-500 text-sm">/ {PREMIUM_QUOTA} produits</span>
              </p>
            </div>
          )}
        </div>

        {/* Grille Produits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-[#080A0F] border border-white/5 rounded-[2rem] overflow-hidden">
              <div className="aspect-square relative">
                {product.image_url && <img src={product.image_url} className="w-full h-full object-cover opacity-80" />}
                {product.is_boosted && (
                  <div className="absolute top-4 left-4 bg-blue-600 px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2">
                    <Zap size={12} fill="white" /> SPONSORISÉ
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-bold text-sm truncate mb-4 uppercase italic">{product.name}</h3>
                {!product.is_boosted ? (
                  <button 
                    onClick={() => { setSelectedProduct(product); setStep('config'); setIsModalOpen(true); }}
                    className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Booster cet article
                  </button>
                ) : (
                  <div className="w-full py-4 bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase rounded-xl text-center border border-white/5">
                    Boost en cours
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0D0F14] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8">
            
            {step === 'config' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black uppercase italic">Réglages</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Durée du sponsoring</span>
                    <span className="text-3xl font-black text-blue-500 italic">{totalWeeks} SEM.</span>
                  </div>
                  <input type="range" min="7" max="56" step="7" value={boostDays} onChange={(e) => setBoostDays(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none accent-blue-600" />
                </div>

                {/* Info Quota pour Premium */}
                {plan === 'premium' && boostedCount >= PREMIUM_QUOTA && (
                  <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
                    <AlertCircle size={20} />
                    <p className="text-[10px] font-bold uppercase leading-tight">Quota de 100 produits atteint. Frais de sponsoring standards appliqués.</p>
                  </div>
                )}

                <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
                   <div className="flex justify-between text-[10px] font-black uppercase mb-4">
                     <span className="text-zinc-500 italic">Avantage {plan}</span>
                     <span className={totalCost === 0 ? "text-green-500" : "text-zinc-400"}>
                        {totalCost === 0 ? "INCLUS" : "QUOTA DÉPASSÉ"}
                     </span>
                   </div>
                   <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                     <span className="font-black uppercase italic text-sm">Prix final</span>
                     <span className="text-3xl font-black text-blue-500">{totalCost.toLocaleString()} CFA</span>
                   </div>
                </div>

                <button 
                  onClick={() => totalCost > 0 ? setStep('payment') : finalizeBoost()}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
                >
                  {totalCost > 0 ? <CreditCard size={18} /> : <Zap size={18} />}
                  <span>{totalCost > 0 ? "Continuer vers le paiement" : "Activer le boost offert"}</span>
                </button>
              </div>
            )}

            {/* STEP PAYMENT (Identique au précédent) */}
            {step === 'payment' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('config')} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20}/></button>
                  <h2 className="text-xl font-black uppercase italic">Paiement</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {['Orange Money', 'Wave', 'Carte Bancaire'].map((m) => (
                    <button key={m} onClick={finalizeBoost} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500 transition-all group">
                      <span className="font-black uppercase text-xs">{m}</span>
                      <CheckCircle size={18} className="text-zinc-800 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}