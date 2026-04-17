import { ShieldCheck, Truck, UserCheck, MessageCircle } from 'lucide-react';

const FEATURES = [
  {
    id: 1,
    title: "Paiement Sécurisé",
    description: "Transactions 100% cryptées via Wave, Orange Money ou MTN.",
    icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
    bgColor: "bg-blue-50"
  },
  {
    id: 2,
    title: "Livraison Rapide",
    description: "Expédition express dans toutes les communes d'Abidjan en 24/48h.",
    icon: <Truck className="w-8 h-8 text-orange-500" />,
    bgColor: "bg-orange-50"
  },
  {
    id: 3,
    title: "Vendeurs Vérifiés",
    description: "Chaque marchand est rigoureusement contrôlé par nos experts.",
    icon: <UserCheck className="w-8 h-8 text-emerald-500" />,
    bgColor: "bg-emerald-50"
  },
  {
    id: 4,
    title: "Support WhatsApp",
    description: "Une assistance personnalisée pour trouver la bonne pièce.",
    icon: <MessageCircle className="w-8 h-8 text-blue-600" />,
    bgColor: "bg-blue-50"
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Titre de la section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">
            Pourquoi choisir <span className="text-blue-600">SpaceAuto24</span> ?
          </h2>
          <div className="w-20 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
        </div>

        {/* Grille des 4 blocs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature) => (
            <div 
              key={feature.id} 
              className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 text-center"
            >
              {/* Icône avec cercle de fond */}
              <div className={`w-20 h-20 ${feature.bgColor} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {feature.icon}
              </div>

              {/* Texte */}
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed uppercase">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}