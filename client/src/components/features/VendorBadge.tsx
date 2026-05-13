// src/components/features/VendorBadge.tsx
import { ShieldCheck, Award, Crown } from 'lucide-react';

interface VendorBadgeProps {
  isVerified: boolean;
  planType: 'freemium' | 'pro' | 'elite';
  type: 'garage' | 'vendor';
}

export default function VendorBadge({ isVerified, planType, type }: VendorBadgeProps) {
  // Un vendeur non vérifié n'affiche pas de badge de confiance
  if (!isVerified) return null;

  const isGarage = type === 'garage';
  const isHighLevel = planType === 'pro' || planType === 'elite';

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-[1000] uppercase tracking-widest border backdrop-blur-sm shadow-sm transition-all
      ${isGarage 
        ? 'bg-blue-600/10 text-blue-600 border-blue-600/20' 
        : 'bg-slate-900/5 text-slate-700 border-slate-200'
      }`}
    >
      {/* Icone dynamique selon le prestige du compte */}
      {planType === 'elite' ? (
        <Crown className="w-3 h-3 text-amber-500" />
      ) : isHighLevel ? (
        <Award className="w-3 h-3 text-blue-600" />
      ) : (
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
      )}

      <span>
        {isGarage ? 'Garage Certifié' : 'Vendeur Vérifié'}
      </span>
    </div>
  );
}