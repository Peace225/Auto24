// src/components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <span className="font-bold text-2xl text-white tracking-tight block mb-4">
            SpaceAuto<span className="text-orange-500">24</span>
          </span>
          <p className="text-sm text-gray-400">
            La plateforme de référence de la pièce détachée et du service automobile en Côte d'Ivoire. [cite: 2]
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Services</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition">Catalogue de pièces</a></li>
            <li><a href="#" className="hover:text-white transition">Garages Partenaires (Abidjan)</a></li>
            <li><a href="#" className="hover:text-white transition">Devenir Vendeur Pro</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Assistance</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition">Support technique WhatsApp</a></li>
            <li><a href="#" className="hover:text-white transition">Politique de retour</a></li>
            <li><a href="#" className="hover:text-white transition">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-12 border-t border-gray-800 pt-8">
        © {new Date().getFullYear()} SpaceAuto24. Tous droits réservés.
      </div>
    </footer>
  );
}