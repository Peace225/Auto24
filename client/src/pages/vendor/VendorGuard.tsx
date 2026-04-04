import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom'; // Ajout de Outlet
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  ChevronRight,
  Headphones 
} from 'lucide-react';

// Plus besoin de l'interface VendorGuardProps si on utilise Outlet
export default function VendorGuard() {
  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'rejected' | 'none'>('loading');
  const [reason, setReason] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkVendorStatus();
  }, []);

  const checkVendorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('vendor_status, rejection_reason')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setStatus(data?.vendor_status || 'none');
      setReason(data?.rejection_reason || null);
    } catch (err) {
      console.error("Erreur Guard:", err);
      setStatus('none');
    }
  };

  if (status === 'loading') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="relative">
          <div className="h-24 w-24 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-slate-900" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center px-4">
          Vérification de votre compte vendeur...
        </p>
      </div>
    );
  }

  // --- CRUCIAL : Utilisation de Outlet pour les routes enfants de /vendor ---
  if (status === 'approved') return <Outlet />;

  const content = {
    none: {
      icon: <FileText className="w-10 h-10 text-orange-500" />,
      title: "Validation Requise",
      desc: "Pour activer votre console et vendre vos pièces sur SpaceAuto24, vous devez soumettre vos documents (RCCM & CNI).",
      btnText: "Démarrer l'activation",
      action: () => navigate('/vendor/settings')
    },
    pending: {
      icon: <Clock className="w-10 h-10 text-blue-500" />,
      title: "Examen en cours",
      desc: "Vos documents sont en cours de vérification par notre équipe à Abidjan. Patience, cela prend moins de 24h.",
      btnText: "Contacter le support",
      action: () => window.open('https://wa.me/2250700000000', '_blank')
    },
    rejected: {
      icon: <ShieldAlert className="w-10 h-10 text-red-500" />,
      title: "Dossier Refusé",
      desc: reason || "Vos documents ne sont pas conformes. Veuillez les mettre à jour pour réactiver votre boutique.",
      btnText: "Modifier mes documents",
      action: () => navigate('/vendor/settings')
    }
  };

  const current = content[status === 'rejected' ? 'rejected' : status === 'pending' ? 'pending' : 'none'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden transition-all">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-50 rounded-full"></div>

        <div className={`h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner ${
          status === 'pending' ? 'bg-blue-50' : status === 'rejected' ? 'bg-red-50' : 'bg-orange-50'
        }`}>
          {current.icon}
        </div>

        <h2 className="text-3xl font-[1000] text-slate-900 uppercase tracking-tighter mb-6 leading-none">
          {current.title}
        </h2>
        
        <p className="text-slate-500 text-[11px] font-bold leading-relaxed mb-10 uppercase tracking-wide px-4">
          {current.desc}
        </p>

        <button 
          onClick={current.action}
          className="group w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
        >
          {current.btnText}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 text-slate-400">
              <Headphones className="w-4 h-4 text-orange-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">Assistance Technique</span>
           </div>
           <p className="text-[11px] font-[1000] text-slate-900">+225 07 00 00 00 00</p>
        </div>
      </div>
    </div>
  );
}