import { ShieldCheck, RefreshCcw, Package, Clock, AlertTriangle } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans animate-in fade-in duration-700 pt-10">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCcw className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-[1000] text-slate-900 uppercase italic tracking-tighter mb-4">
            Politique de <span className="text-blue-600">Retour</span>
          </h1>
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
            Achetez en toute sérénité. Nous garantissons la conformité de vos pièces.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-3">Délai de rétractation (7 Jours)</h2>
              <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-wide">
                Conformément aux standards du commerce, vous disposez d'un délai de 7 jours francs à compter de la réception de votre commande pour retourner un article qui ne vous conviendrait pas, sous réserve qu'il respecte les conditions de retour.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-3">Conditions d'acceptation</h2>
              <ul className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-wide space-y-3">
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> La pièce n'a jamais été montée ou utilisée.</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> L'emballage d'origine est intact et non sali (pas de traces de cambouis).</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Toutes les notices et accessoires sont présents.</li>
              </ul>
              <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-[9px] font-black text-orange-800 uppercase tracking-widest">Attention : Les pièces électroniques (capteurs, calculateurs) déballées ne sont ni reprises ni échangées.</p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-xl flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center shrink-0">
              <RefreshCcw className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter mb-3">Procédure de Remboursement</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-wide mb-6">
                Une fois la pièce réceptionnée et inspectée par nos experts, le remboursement est effectué sous 48h à 72h ouvrées via le moyen de paiement utilisé lors de l'achat (Wave, Orange Money, ou virement bancaire).
              </p>
              <button className="py-4 px-8 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-colors">
                Initier un retour
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}