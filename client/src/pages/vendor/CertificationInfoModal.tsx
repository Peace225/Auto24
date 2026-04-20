import { ShieldCheck, ArrowRight, X, FileCheck, Zap, Star } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CertificationInfoModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const scrollToDocs = () => {
    onClose();
    setTimeout(() => {
      document.getElementById('certification-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#05070A]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative border border-white/10">
        
        {/* Header avec Dégradé */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-orange-600"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all">
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-[1000] text-slate-900 uppercase tracking-tighter italic leading-tight">
              Certification <br /> <span className="text-amber-500">Obligatoire</span>
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Sécurité & Excellence SpaceAuto24</p>
          </div>

          <div className="space-y-6 mb-10">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <FileCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-900 mb-1">Vérification d'identité</p>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase opacity-70">
                  Pour accéder aux plans Pro/Élite, nous devons valider votre existence légale (RCCM & CNI).
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <Star className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-900 mb-1">Confiance Client</p>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase opacity-70">
                  Le badge "Vérifié" rassure vos acheteurs et multiplie vos ventes par 3.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={scrollToDocs}
              className="w-full py-5 bg-[#05070A] text-white rounded-2xl font-[1000] text-[11px] uppercase tracking-[0.3em] hover:bg-amber-500 hover:text-black transition-all shadow-xl flex items-center justify-center gap-3 border border-transparent"
            >
              Envoyer mes documents <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-transparent text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}