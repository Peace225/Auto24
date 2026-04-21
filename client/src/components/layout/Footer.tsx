import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 mt-auto border-t-[10px] border-slate-950">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* COLONNE 1 : LOGO & DESC */}
        <div>
          <Link to="/" className="font-[1000] text-3xl text-white tracking-tighter block mb-6 italic uppercase">
            SpaceAuto<span className="text-orange-500">24</span>
          </Link>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-xs">
            La plateforme de référence de la pièce détachée et du service automobile en Côte d'Ivoire.
          </p>
        </div>

        {/* COLONNE 2 : SERVICES */}
        <div>
          <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6">Services</h4>
          <ul className="space-y-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <li>
              <Link to="/catalog" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> Catalogue de pièces
              </Link>
            </li>
            <li>
              <Link to="/garages" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> Garages Partenaires (Abidjan)
              </Link>
            </li>
            <li>
              <Link to="/become-vendor" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> Devenir Vendeur Pro
              </Link>
            </li>
          </ul>
        </div>

        {/* COLONNE 3 : ASSISTANCE */}
        <div>
          <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6">Assistance</h4>
          <ul className="space-y-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <li>
              {/* 🟢 Le lien pointe maintenant vers /support */}
              <Link to="/support" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-900 rounded-full"></span> Support technique & Contact
              </Link>
            </li>
            <li>
              {/* 🟢 Le lien pointe maintenant vers /return-policy */}
              <Link to="/return-policy" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-900 rounded-full"></span> Politique de retour
              </Link>
            </li>
            <li>
              {/* 🟢 Le lien pointe maintenant vers /faq */}
              <Link to="/faq" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-900 rounded-full"></span> FAQ
              </Link>
            </li>
          </ul>
        </div>
        
      </div>
      
      {/* COPYRIGHT */}
      <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mt-16 border-t border-white/5 pt-8">
        © {new Date().getFullYear()} SpaceAuto24. Tous droits réservés.
      </div>
    </footer>
  );
}