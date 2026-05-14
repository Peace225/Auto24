import React from 'react';
import { Check, Crown, Package, Zap, ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interface pour sécuriser les données
interface Plan {
  name: string;
  tier: string;
  price: string;
  icon: React.ElementType; // C'est cet élément qui empêchait le clonage
  color: string;
  features: string[];
  limit: string;
  maxProducts: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    tier: 'standard',
    price: '0',
    icon: Package,
    color: 'from-slate-500 to-slate-800',
    features: ['Jusqu\'à 10 produits', 'Statistiques de base', 'Support par email', '1 compte admin'],
    limit: '10 produits',
    maxProducts: 10
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '10.000',
    icon: Star,
    popular: true,
    color: 'from-amber-500 to-orange-600',
    features: ['Jusqu\'à 50 produits', 'Vues uniques & Taux de conv.', 'Badge Pro vérifié', 'Support prioritaire', 'Boost visibilité'],
    limit: '50 produits',
    maxProducts: 50
  },
  {
    name: 'Business',
    tier: 'premium',
    price: '25.000',
    icon: Crown,
    color: 'from-violet-600 to-purple-700',
    features: ['Produits illimités', 'Analytics avancés complets', 'Multi-administrateurs (5)', 'Gestion de stock avancée', 'API accès'],
    limit: 'Illimité',
    maxProducts: 9999
  }
];

export default function VendorPricing() {
  const navigate = useNavigate();

  const handleSelectPlan = (plan: Plan) => {
    console.log("Plan sélectionné :", plan.tier);

    /**
     * CORRECTION DU BUG DataCloneError :
     * On extrait 'icon' de l'objet plan car on ne peut pas passer de 
     * composants React (fonctions) dans le state de navigation.
     */
    const { icon, ...planData } = plan;

    navigate('/vendor/settings/payment', { 
      state: { plan: planData }, // On envoie uniquement les données sérialisables
      replace: false 
    });
  };

  return (
    <div className="min-h-screen bg-[#020305] text-white relative p-6 lg:p-10">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 group cursor-pointer"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Retour au Dashboard</span>
        </button>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 italic">
            BOOSTEZ VOTRE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-violet-500">BUSINESS</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-sm md:text-base">
            Choisissez le plan adapté à votre croissance et passez au niveau supérieur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.tier}
              className={`relative group rounded-[2.5rem] border ${
                plan.popular 
                  ? 'border-amber-500/50 bg-amber-500/[0.03]' 
                  : 'border-white/10 bg-white/[0.02]'
              } p-8 transition-all hover:-translate-y-2 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                  Plus Populaire
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-xl`}>
                <plan.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-black mb-2 italic uppercase tracking-tighter">{plan.name}</h3>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-slate-500 text-[10px] uppercase font-bold">CFA / mois</span>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2">
                  Inclus :
                </p>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <Check size={12} className="text-emerald-500" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer relative z-20 ${
                  plan.popular 
                  ? 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.02] shadow-lg shadow-amber-500/20' 
                  : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                Choisir ce plan
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 rounded-[2.5rem] bg-gradient-to-r from-violet-600/10 to-transparent border border-violet-500/20 text-center">
          <Zap className="w-8 h-8 text-violet-500 mx-auto mb-4" />
          <h4 className="text-xl font-bold mb-2 uppercase italic tracking-tighter">Besoin d'une solution sur mesure ?</h4>
          <p className="text-slate-400 text-sm mb-6">Pour les flottes et grandes entreprises, contactez-nous.</p>
          <button className="text-violet-400 font-black text-[10px] uppercase tracking-[0.2em] hover:underline cursor-pointer">
            Support Enterprise
          </button>
        </div>
      </div>
    </div>
  );
}