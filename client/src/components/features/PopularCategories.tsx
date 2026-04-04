// src/components/features/PopularCategories.tsx
import { Wrench, Settings, BatteryCharging, ShieldAlert, Droplets, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    title: "Liaison au sol",
    subtitle: "Suspension, Freinage...",
    icon: <Wrench className="w-8 h-8 text-blue-600 group-hover:text-white" />,
    color: "bg-blue-50 group-hover:bg-blue-600",
    link: "/catalog?cat=liaison"
  },
  {
    title: "Organes Moteurs",
    subtitle: "Distribution, Injection...",
    icon: <Settings className="w-8 h-8 text-orange-500 group-hover:text-white" />,
    color: "bg-orange-50 group-hover:bg-orange-500",
    link: "/catalog?cat=moteur"
  },
  {
    title: "Huile Moteur",
    subtitle: "5W30, 10W40, Total...",
    icon: <Droplets className="w-8 h-8 text-red-600 group-hover:text-white" />,
    color: "bg-red-50 group-hover:bg-red-600",
    link: "/huiles"
  },
  {
    title: "Outillage",
    subtitle: "Cliquets, Levage, Clés...",
    icon: <Hammer className="w-8 h-8 text-green-600 group-hover:text-white" />,
    color: "bg-green-50 group-hover:bg-green-600",
    link: "/outillage"
  }
];

export default function PopularCategories() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center tracking-tight">
        Explorez par catégories populaires
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {CATEGORIES.map((cat, index) => (
          <Link 
            key={index} 
            to={cat.link}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
          >
            <div className={`${cat.color} p-4 rounded-2xl mb-4 transition-colors duration-300`}>
              {cat.icon}
            </div>
            <h3 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
              {cat.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{cat.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}