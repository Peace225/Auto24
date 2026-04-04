// src/components/features/VendorBadge.tsx
import { ShieldCheck, Award } from 'lucide-react';

interface VendorBadgeProps {
  isVerified: boolean;
  planType: 'freemium' | 'pro' | 'elite';
  type: 'garage' | 'vendor';
}

export default function VendorBadge({ isVerified, planType, type }: VendorBadgeProps) {
  if (!isVerified) return null;

  const isGarage = type === 'garage';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border 
      ${isGarage ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}
    >
      {planType === 'pro' || planType === 'elite' ? (
        <Award className="w-4 h-4" />
      ) : (
        <ShieldCheck className="w-4 h-4" />
      )}
      <span>
        {isGarage ? 'Garage Certifié SpaceAuto24' : 'Vendeur Vérifié'}
      </span>
    </div>
  );
}