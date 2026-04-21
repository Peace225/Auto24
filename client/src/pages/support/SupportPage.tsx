import { MessageCircle, Phone, Mail, Clock, MapPin, Send, HeadphonesIcon } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans animate-in fade-in duration-700">
      
      {/* HEADER HERO */}
      <div className="bg-slate-900 py-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 rotate-12 -mr-20 -mt-20">
          <HeadphonesIcon className="w-96 h-96 text-white" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-[1000] text-white uppercase italic tracking-tighter mb-4">
            Comment pouvons-nous vous <span className="text-blue-500">aider ?</span>
          </h1>
          <p className="text-slate-400 text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto leading-relaxed">
            Notre équipe d'experts à Abidjan est à votre disposition pour vous guider dans le choix de vos pièces ou le suivi de vos commandes.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* CARTE WHATSAPP */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 text-center hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">WhatsApp</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Réponse en - de 15 min</p>
            <a href="https://wa.me/2250000000000" target="_blank" rel="noreferrer" className="inline-block w-full py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-colors">
              Discuter en direct
            </a>
          </div>

          {/* CARTE TÉLÉPHONE */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 text-center hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">Téléphone</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">LUN - SAM : 08H - 18H</p>
            <a href="tel:+2250000000000" className="inline-block w-full py-4 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-colors">
              +225 00 00 00 00 00
            </a>
          </div>

          {/* CARTE EMAIL */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 text-center hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">Email</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Support commercial</p>
            <a href="mailto:support@spaceauto24.ci" className="inline-block w-full py-4 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-colors">
              Écrivez-nous
            </a>
          </div>
        </div>

        {/* FORMULAIRE & INFOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter mb-8">Envoyer un message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="NOM COMPLET" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[11px] font-black uppercase focus:border-blue-600 outline-none transition-colors" />
                <input type="email" placeholder="ADRESSE EMAIL" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[11px] font-black uppercase focus:border-blue-600 outline-none transition-colors" />
              </div>
              <input type="text" placeholder="SUJET DE LA DEMANDE (EX: COMPATIBILITÉ PIÈCE)" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[11px] font-black uppercase focus:border-blue-600 outline-none transition-colors" />
              <textarea placeholder="VOTRE MESSAGE..." rows={5} className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[11px] font-black uppercase focus:border-blue-600 outline-none transition-colors resize-none"></textarea>
              <button type="button" className="py-5 px-8 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-200 flex items-center gap-3">
                Envoyer <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-500" /> Nos Bureaux
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed mb-4">
                Abidjan, Cocody Riviera Palmeraie<br />
                Côte d'Ivoire
              </p>
              <hr className="border-white/10 my-6" />
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" /> Horaires
              </h3>
              <ul className="text-[10px] font-bold text-slate-400 uppercase space-y-3 tracking-widest">
                <li className="flex justify-between"><span>Lun - Ven</span> <span className="text-white">08:00 - 18:00</span></li>
                <li className="flex justify-between"><span>Samedi</span> <span className="text-white">09:00 - 15:00</span></li>
                <li className="flex justify-between"><span>Dimanche</span> <span className="text-orange-400">Fermé</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}