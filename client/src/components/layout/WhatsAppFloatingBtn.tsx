import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloatingBtn() {
  const phoneNumber = "22500000000"; // ⚠️ Remplace par ton vrai numéro
  const message = encodeURIComponent("Bonjour SpaceAuto24, j'aimerais avoir plus d'informations sur vos pièces.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-8 right-8 z-[999] group">
      {/* Tooltip élégant au survol */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
        Besoin d'aide ?
        {/* Flèche du tooltip */}
        <div className="absolute top-1/2 -translate-y-1/2 left-full border-4 border-transparent border-l-slate-900"></div>
      </div>

      {/* Effet de pulsation (ping) en arrière-plan */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 group-hover:opacity-0 transition-opacity"></span>

      {/* Le bouton principal */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-16 h-16 bg-[#25D366] text-white rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:shadow-[0_15px_40px_rgba(37,211,102,0.6)] hover:-translate-y-1 transition-all duration-300 active:scale-90"
        aria-label="Contactez-nous sur WhatsApp"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
        
        {/* Petit badge de notification en ligne */}
        <span className="absolute top-1 right-1 w-4 h-4 bg-white border-2 border-[#25D366] rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse"></span>
        </span>
      </a>
    </div>
  );
}