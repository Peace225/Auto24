import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, Phone, Check, X, Clock, 
  User, Car, MapPin, MessageCircle, MoreVertical 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminConcierge() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        profiles:customer_id (full_name, phone, commune),
        user_vehicles:vehicle_id (make, model, plate_number)
      `)
      .order('created_at', { ascending: false });

    if (!error) setAppointments(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      toast.success(`Rendez-vous ${newStatus === 'confirmed' ? 'confirmé' : 'annulé'}`);
      fetchAppointments();
    }
  };

  return (
    <div className="p-6 md:p-10 bg-[#05070A] min-h-screen text-white font-sans">
      
      {/* HEADER ADMIN */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-[1000] uppercase italic tracking-tighter">
            Gestion <span className="text-orange-500">Conciergerie</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
            Demandes de rendez-vous en attente • SpaceAuto24
          </p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase">Aujourd'hui</p>
              <p className="text-sm font-black text-white">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
           </div>
        </div>
      </div>

      {/* LISTE DES DEMANDES */}
      <div className="grid grid-cols-1 gap-4">
        {appointments.map((apt) => (
          <div key={apt.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/[0.07] transition-all">
            
            {/* INFO CLIENT & VÉHICULE */}
            <div className="flex items-center gap-6 w-full md:w-1/3">
              <div className="h-16 w-16 rounded-2xl bg-orange-500 flex items-center justify-center text-black font-black text-xl">
                {apt.profiles?.full_name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-tight text-lg">{apt.profiles?.full_name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  <MapPin className="w-3 h-3 text-orange-500" /> {apt.profiles?.commune}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black text-blue-400 uppercase mt-2">
                  <Car className="w-3.5 h-3.5" /> {apt.user_vehicles?.make} {apt.user_vehicles?.model}
                </div>
              </div>
            </div>

            {/* INFO RENDEZ-VOUS */}
            <div className="flex flex-wrap justify-center gap-8 w-full md:w-1/3">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Date & Heure</p>
                <p className="text-sm font-black text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> {apt.date} • {apt.time}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Service</p>
                <p className="text-sm font-black text-white uppercase">{apt.service_type}</p>
              </div>
            </div>

            {/* ACTIONS CONCIERGE */}
            <div className="flex items-center gap-3 w-full md:w-1/3 justify-end">
              <a 
                href={`tel:${apt.profiles?.phone}`} 
                className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                title="Appeler le client"
              >
                <Phone className="w-5 h-5" />
              </a>
              <button 
                onClick={() => updateStatus(apt.id, 'confirmed')}
                className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
              >
                <Check className="w-4 h-4" /> Confirmer
              </button>
              <button 
                onClick={() => updateStatus(apt.id, 'rejected')}
                className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>
        ))}

        {appointments.length === 0 && !loading && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Aucune demande en attente</p>
          </div>
        )}
      </div>
    </div>
  );
}