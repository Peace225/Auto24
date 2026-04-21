import { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

const FAQ_DATA = [
  {
    category: "Commandes & Livraison",
    questions: [
      { q: "Quels sont les délais de livraison à Abidjan ?", a: "Pour les commandes passées avant 12h, la livraison est assurée en 24h ouvrées dans tout le grand Abidjan. Pour l'intérieur du pays, comptez 48h à 72h." },
      { q: "Puis-je payer à la livraison ?", a: "Non, pour des raisons de sécurité et de logistique, tous les paiements s'effectuent à la commande via nos terminaux sécurisés (Mobile Money, Carte Bleue)." }
    ]
  },
  {
    category: "Pièces & Compatibilité",
    questions: [
      { q: "Comment être sûr que la pièce est compatible avec mon véhicule ?", a: "Utilisez notre fonctionnalité 'Mon Garage' pour enregistrer votre véhicule. Le système filtrera automatiquement les pièces 100% compatibles." },
      { q: "Les pièces vendues sont-elles d'origine ?", a: "Nous proposons deux gammes : des pièces d'origine (OEM) et des pièces de rechange certifiées (Aftermarket) provenant d'équipementiers reconnus mondialement." }
    ]
  },
  {
    category: "Rendez-vous Garages",
    questions: [
      { q: "Comment fonctionne l'installation en garage partenaire ?", a: "Lors de l'achat de votre pièce, vous pouvez sélectionner l'option 'Installation'. Notre concierge vous contactera pour fixer un rendez-vous dans le garage certifié le plus proche de chez vous." }
    ]
  }
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans animate-in fade-in duration-700 pt-10">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-[1000] text-slate-900 uppercase italic tracking-tighter mb-4">
            Questions <span className="text-orange-500">Fréquentes</span>
          </h1>
          
          <div className="relative max-w-xl mx-auto mt-8">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="RECHERCHER UNE RÉPONSE..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-blue-600 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-12">
          {FAQ_DATA.map((section, sIndex) => (
            <div key={sIndex}>
              <h3 className="text-lg font-[1000] text-slate-900 uppercase tracking-tighter italic mb-6 border-b border-slate-200 pb-2">
                {section.category}
              </h3>
              <div className="space-y-4">
                {section.questions.map((faq, qIndex) => {
                  const index = `${sIndex}-${qIndex}`;
                  const isOpen = openIndex === index;
                  
                  // Simple search filter
                  if (searchQuery && !faq.q.toLowerCase().includes(searchQuery.toLowerCase()) && !faq.a.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return null;
                  }

                  return (
                    <div key={qIndex} className={`bg-white border rounded-2xl transition-all duration-300 ${isOpen ? 'border-blue-600 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}>
                      <button 
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-8 py-6 flex justify-between items-center text-left"
                      >
                        <span className="text-[11px] md:text-xs font-black text-slate-900 uppercase tracking-widest pr-4 leading-relaxed">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`px-8 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-wide">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}