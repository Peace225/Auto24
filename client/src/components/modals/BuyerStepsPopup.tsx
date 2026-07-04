import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface BuyerStepsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyerStepsPopup({ isOpen, onClose }: BuyerStepsPopupProps) {
  const navigate = useNavigate();

  // Fait disparaître la carte automatiquement après 12 secondes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 12000); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Positionné en bas à gauche (bottom-6 left-6), sans overlay sombre
    <div className="fixed bottom-6 left-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] shadow-2xl bg-white rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-hidden">
      
      {/* En-tête bleu foncé de la carte */}
      <div className="bg-[#1a2b4c] text-white p-4 flex justify-between items-center relative">
        <div>
          <h3 className="font-bold text-sm">Nouveau sur SpaceAuto24 ?</h3>
          <p className="text-xs text-blue-200">Voici comment ça marche</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-white/60 hover:text-white transition-colors bg-white/10 rounded-full p-1.5"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Contenu : Les étapes condensées */}
      <div className="p-5 space-y-4">
        
        {/* Étape 1 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Inscrivez-vous gratuitement</h4>
            <p className="text-[11px] text-slate-500">Créez votre compte en quelques secondes.</p>
          </div>
        </div>

        {/* Étape 2 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Enregistrez votre véhicule</h4>
            <p className="text-[11px] text-slate-500">Pour des pièces 100% compatibles.</p>
          </div>
        </div>

        {/* Étape 3 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Comparez et économisez</h4>
            <p className="text-[11px] text-slate-500">Trouvez le meilleur prix parmi nos vendeurs certifiés.</p>
          </div>
        </div>

        {/* Étape 4 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Commandez en confiance</h4>
            <p className="text-[11px] text-slate-500">Paiement sécurisé et livraison rapide.</p>
          </div>
        </div>
      </div>

      {/* Bas de la carte avec le bouton d'action */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <button 
          onClick={() => {
            onClose();
            navigate('/register');
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg shadow-md transition-all text-sm flex justify-center items-center gap-2"
        >
          Je m'inscris maintenant
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>

    </div>
  );
}