import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function VendorGuard() {
  const { user, isLoading } = useAuthStore();
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      // 1. Si on attend toujours la réponse de AuthStore, on ne fait rien
      if (isLoading) return;

      // 2. Si l'utilisateur n'est pas connecté du tout
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // 3. Vérification du rôle dans la table profiles
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Si l'utilisateur est un client classique, on l'envoie vers la page pour devenir vendeur
        if (data.role !== 'vendor' && data.role !== 'admin') {
           navigate('/become-vendor', { replace: true });
        } else {
           // S'il est vendeur ou admin, on arrête le chargement, il peut passer.
           setIsCheckingRole(false);
        }
      } catch (err) {
        console.error("Erreur Guard:", err);
        navigate('/', { replace: true });
      }
    };

    checkRole();
  }, [user, isLoading, navigate]);

  // --- ÉCRAN DE CHARGEMENT ---
  if (isLoading || isCheckingRole) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="relative">
          <div className="h-24 w-24 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-slate-900" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center px-4">
          Connexion sécurisée...
        </p>
      </div>
    );
  }

  // --- PASSAGE AUTORISÉ ---
  // On laisse passer TOUS les vendeurs (qu'ils soient 'approved', 'pending' ou 'unverified')
  // C'est le composant VendorDashboard qui se chargera d'afficher la bannière Freemium.
  return <Outlet />;
}