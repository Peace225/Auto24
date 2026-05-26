// src/components/features/VendorBadge.tsx
import { ShieldCheck, Award, Crown, Store } from 'lucide-react';

interface VendorBadgeProps {
  isVerified: boolean;
  planType: 'premium' | 'pro' | 'standard' | string;
  type?: 'garage' | 'vendor';
}

export default function VendorBadge({ isVerified, planType, type = 'vendor' }: VendorBadgeProps) {
  // Si le vendeur n'est pas vérifié, on peut soit ne rien afficher, 
  // soit afficher un badge neutre. Ici, on garde ta logique initiale.
  if (!isVerified) return null;

  const plan = planType?.toLowerCase() || 'standard';
  const isGarage = type === 'garage';

  // Choix de l'icône selon le prestige
  const renderIcon = () => {
    switch (plan) {
      case 'premium': return <Crown className="w-3 h-3 text-amber-500" />;
      case 'pro': return <Award className="w-3 h-3 text-blue-600" />;
      default: return <ShieldCheck className="w-3 h-3 text-emerald-500" />;
    }
  };

  // Styles dynamiques
  const getStyles = () => {
    if (isGarage) return 'bg-blue-600/10 text-blue-700 border-blue-600/20';
    if (plan === 'premium') return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    if (plan === 'pro') return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-[1000] uppercase tracking-widest border backdrop-blur-sm shadow-sm ${getStyles()}`}>
      {renderIcon()}
      <span>
        {isGarage ? 'Garage Certifié' : plan === 'premium' ? 'Premium' : plan === 'pro' ? 'Pro' : 'Vérifié'}
      </span>
    </div>
  );
}