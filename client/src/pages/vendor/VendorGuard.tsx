import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Suppression de Outlet
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

// Ajout du type pour children
interface VendorGuardProps {
  children: React.ReactNode;
}

export default function VendorGuard({ children }: VendorGuardProps) {
  const { user, isLoading } = useAuthStore();
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      if (isLoading) return;

      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data.role !== 'vendor' && data.role !== 'admin') {
          navigate('/become-vendor', { replace: true });
        } else {
          // L'utilisateur a le bon rôle
          setIsCheckingRole(false);
        }
      } catch (err) {
        console.error("Erreur Guard:", err);
        navigate('/', { replace: true });
      }
    };

    checkRole();
  }, [user, isLoading, navigate]);

  // --- ÉCRAN DE CHARGEMENT (Version Sombre pour coller à l'image a_6.PNG) ---
  if (isLoading || isCheckingRole) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#05070B]">
        <div className="relative">
          {/* Spinner stylisé orange/ambre */}
          <div className="h-24 w-24 border-4 border-white/5 border-t-amber-500 rounded-full animate-spin"></div>
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white animate-pulse" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center px-4">
          Vérification des accès vendeur...
        </p>
      </div>
    );
  }

  // --- PASSAGE AUTORISÉ ---
  // IMPORTANT : On retourne 'children' car VendorLayout est passé en enfant dans App.tsx
  return <>{children}</>;
}