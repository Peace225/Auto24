import { useState } from 'react';
import { 
  Calendar as CalendarIcon, Clock, MapPin, 
  Wrench, ChevronRight, CheckCircle2, 
  AlertCircle, ArrowRight, X, ShieldCheck, Star, Loader2 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const SERVICES = [
  { id: 'install', label: 'Installation de pièces', icon: Wrench, price: 'À partir de 5.000 FCFA' },
  { id: 'vidange', label: 'Vidange Complète', icon: Clock, price: 'À partir de 15.000 FCFA' },
  { id: 'checkup', label: 'Diagnostic Sécurité', icon: ShieldCheck, price: 'Gratuit (Membres)' }
];

const GARAGES = [
  { id: 1, name: "Garage Elite - Zone 4", area: "Marcory", rating: 4.9 },
  { id: 2, name: "SpaceAuto Center - Riviera", area: "Cocody", rating: 4.8 },
  { id: 3, name: "Expert Auto - Plateau", area: "Plateau", rating: 4.7 }
];

export default function AppointmentManager({ vehicles }: { vehicles: any[] }) {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState({
    vehicle_id: '',
    service_type: '',
    garage_id: '',
    date: '',
    time: ''
  });

  const handleBooking = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('appointments').insert([{
        ...booking,
        customer_id: user?.id,
        status: 'pending'
      }]);

      if (error) throw error;
      toast.success("Demande de rendez-vous envoyée !");
      setIsOpen(false);
      setStep(1);
    } catch (err) {
      toast.error("Erreur lors de la réservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* --- BANNIÈRE D'APPEL À L'ACTION --- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 opacity-10 -mr-10 -mt-10 rotate-12">
          <Wrench className="w-32 h-32 md:w-40 md:h-40" />
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-xl md:text-2xl font-[1000] uppercase italic tracking-tighter mb-3 md:mb-4">Installation Professionnelle</h2>
          <p className="text-blue-100 text-[10px] md:text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-6 md:mb-8">
            Ne prenez aucun risque. Faites installer vos pièces par nos garages partenaires certifiés à Abidjan.
          </p>
          <button 
            onClick={() => setIsOpen(true)}
            className="px-6 py-3.5 md:px-8 md:py-4 bg-orange-500 hover:bg-white hover:text-orange-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 w-full sm:w-auto"
          >
            Réserver un créneau
          </button>
        </div>
      </div>

      {/* --- MODAL DE RÉSERVATION (MULTI-STEP) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 md:p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="p-5 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h3 className="text-lg md:text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Prendre Rendez-vous</h3>
                  <p className="text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Étape {step} sur 3</p>
               </div>
               <button onClick={() => setIsOpen(false)} className="p-2 md:p-3 hover:bg-slate-200 rounded-full transition-colors bg-slate-100 md:bg-transparent">
                 <X className="w-4 h-4 md:w-5 md:h-5 text-slate-600 md:text-slate-400" />
               </button>
            </div>

            <div className="p-5 md:p-12 overflow-y-auto">
              
              {/* ÉTAPE 1 : VÉHICULE & SERVICE */}
              {step === 1 && (
                <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-3 md:space-y-4">
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 md:ml-2">Sélectionnez votre véhicule</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {vehicles.map(v => (
                          <button 
                            key={v.id}
                            onClick={() => setBooking({...booking, vehicle_id: v.id})}
                            className={`p-4 md:p-5 rounded-2xl border-2 text-left transition-all ${booking.vehicle_id === v.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                          >
                            <p className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase">{v.make} {v.model}</p>
                            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mt-0.5">{v.year} • {v.fuel_type}</p>
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-3 md:space-y-4">
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 md:ml-2">Type de prestation</label>
                      <div className="space-y-3">
                        {SERVICES.map(s => (
                          <button 
                            key={s.id}
                            onClick={() => setBooking({...booking, service_type: s.id})}
                            className={`w-full p-4 md:p-5 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 transition-all ${booking.service_type === s.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                          >
                            <div className="flex items-center gap-3 md:gap-4">
                               <div className={`p-2.5 md:p-3 rounded-xl ${booking.service_type === s.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                 <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                               </div>
                               <span className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase">{s.label}</span>
                            </div>
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-100/50 sm:bg-transparent px-2 py-1 sm:p-0 rounded-md">{s.price}</span>
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              )}

              {/* ÉTAPE 2 : CHOIX DU GARAGE */}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 md:ml-2">Choisissez un centre partenaire</label>
                  <div className="space-y-3 md:space-y-4">
                    {GARAGES.map(g => (
                      <button 
                        key={g.id}
                        onClick={() => setBooking({...booking, garage_id: g.id.toString()})}
                        className={`w-full p-5 md:p-6 rounded-2xl md:rounded-[2rem] border-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 transition-all ${booking.garage_id === g.id.toString() ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                           <div className="bg-white p-2 rounded-full shadow-sm sm:shadow-none sm:p-0 sm:bg-transparent">
                             <MapPin className={`w-5 h-5 md:w-6 md:h-6 ${booking.garage_id === g.id.toString() ? 'text-blue-600' : 'text-slate-300'}`} />
                           </div>
                           <div className="text-left">
                              <p className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase">{g.name}</p>
                              <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{g.area}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 text-orange-500 bg-orange-50 sm:bg-transparent px-2 py-1 sm:p-0 rounded-md">
                           <Star className="w-3 h-3 fill-orange-500" /> <span className="text-[9px] md:text-[10px] font-black">{g.rating}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : DATE & HEURE */}
              {step === 3 && (
                <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-3 md:space-y-4">
                         <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 md:ml-2">Date souhaitée</label>
                         <input 
                           type="date" 
                           className="w-full p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] md:text-[11px] font-black focus:border-blue-600 outline-none transition-colors"
                           onChange={(e) => setBooking({...booking, date: e.target.value})}
                         />
                      </div>
                      <div className="space-y-3 md:space-y-4">
                         <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 md:ml-2">Heure</label>
                         <input 
                           type="time" 
                           className="w-full p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] md:text-[11px] font-black focus:border-blue-600 outline-none transition-colors"
                           onChange={(e) => setBooking({...booking, time: e.target.value})}
                         />
                      </div>
                   </div>
                   
                   <div className="p-4 md:p-6 bg-blue-50 rounded-2xl md:rounded-3xl border border-blue-100 flex items-start gap-3 md:gap-4">
                      <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-[9px] md:text-[10px] text-blue-800 font-bold leading-relaxed uppercase tracking-tight">
                        La réservation sera confirmée par appel de notre concierge sous 30 minutes. Le paiement s'effectue directement au garage.
                      </p>
                   </div>
                </div>
              )}
            </div>

            {/* Footer Modal Buttons */}
            <div className="p-5 md:p-8 border-t border-slate-50 bg-slate-50/30 flex flex-col-reverse sm:flex-row justify-between gap-3 md:gap-4">
               {step > 1 && (
                 <button 
                   onClick={() => setStep(step - 1)}
                   className="w-full sm:w-auto px-6 py-4 text-slate-500 bg-slate-100 sm:bg-transparent text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:text-slate-900 hover:bg-slate-200 rounded-xl md:rounded-2xl transition-colors"
                 >
                   Retour
                 </button>
               )}
               <button 
                 onClick={() => step < 3 ? setStep(step + 1) : handleBooking()}
                 disabled={loading}
                 className="w-full sm:flex-1 py-4 md:py-5 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 active:scale-95"
               >
                 {loading ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : (
                   <> {step === 3 ? "Confirmer la réservation" : "Continuer"} <ArrowRight className="w-3 h-3 md:w-4 md:h-4" /> </>
                 )}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}