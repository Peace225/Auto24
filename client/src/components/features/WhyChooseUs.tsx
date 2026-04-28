import { ShieldCheck, Truck, UserCheck, MessageCircle } from 'lucide-react';

const FEATURES = [
  {
    id: 1,
    title: "Paiement Sécurisé",
    description: "Transactions 100% cryptées (Wave, OM, MTN).",
    icon: (size: string) => <ShieldCheck className={`${size} text-blue-600`} />,
    bgColor: "bg-blue-50"
  },
  {
    id: 2,
    title: "Livraison Rapide",
    description: "Expédition express Abidjan 24/48h.",
    icon: (size: string) => <Truck className={`${size} text-orange-500`} />,
    bgColor: "bg-orange-50"
  },
  {
    id: 3,
    title: "Vendeurs Vérifiés",
    description: "Marchands contrôlés par nos experts.",
    icon: (size: string) => <UserCheck className={`${size} text-emerald-500`} />,
    bgColor: "bg-emerald-50"
  },
  {
    id: 4,
    title: "Support WhatsApp",
    description: "Assistance pour trouver la bonne pièce.",
    icon: (size: string) => <MessageCircle className={`${size} text-blue-600`} />,
    bgColor: "bg-blue-50"
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-10 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Titre de la section (Miniaturisé sur mobile) */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2 md:mb-4">
            Pourquoi <span className="text-blue-600">SpaceAuto24</span> ?
          </h2>
          <div className="w-12 md:w-20 h-1 md:h-1.5 bg-orange-500 mx-auto rounded-full"></div>
        </div>

        {/* Grille : 2 colonnes sur mobile pour l'harmonie visuelle */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {FEATURES.map((feature) => (
            <div 
              key={feature.id} 
              className="group p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 text-center"
            >
              {/* Icône réduite sur mobile */}
              <div className={`w-12 h-12 md:w-20 md:h-20 ${feature.bgColor} rounded-xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {/* On appelle la fonction icon avec des tailles responsive */}
                {feature.icon("w-6 h-6 md:w-8 md:h-8")}
              </div>

              {/* Texte compact */}
              <h3 className="text-[10px] md:text-sm font-black text-slate-900 uppercase tracking-widest mb-1 md:mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-[8px] md:text-xs font-bold leading-tight md:leading-relaxed uppercase opacity-80">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}