import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative z-20 bg-slate-900 text-slate-300 py-8 md:py-16 mt-auto border-t-[6px] md:border-t-[10px] border-slate-950"> 
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
        
        {/* COLONNE 1 : LOGO & DESC (Aligné à gauche) */}
        <div className="flex flex-col items-start">
          <Link to="/" className="font-[1000] text-xl md:text-3xl text-white tracking-tighter block mb-3 md:mb-6 italic uppercase">
            SpaceAuto<span className="text-orange-500">24</span>
          </Link>
          <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] md:tracking-[0.2em] leading-relaxed max-w-[280px]">
            La plateforme de référence de la pièce détachée et du service automobile en Côte d'Ivoire.
          </p>
        </div>

        {/* COLONNE 2 : SERVICES (Aligné à gauche) */}
        <div className="flex flex-col items-start">
          <h4 className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6 border-b border-orange-500/30 pb-1 w-fit">
            Services
          </h4>
          <ul className="space-y-3 md:space-y-4 text-[9px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 w-full">
            <li>
              <Link to="/catalog" className="hover:text-orange-500 transition-colors flex items-center gap-2.5">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-slate-700 rounded-full shrink-0"></span> 
                Catalogue de pièces
              </Link>
            </li>
            <li>
              <Link to="/garages" className="hover:text-orange-500 transition-colors flex items-center gap-2.5">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-slate-700 rounded-full shrink-0"></span> 
                Garages Partenaires
              </Link>
            </li>
            <li>
              <Link to="/become-vendor" className="hover:text-orange-500 transition-colors flex items-center gap-2.5">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-slate-700 rounded-full shrink-0"></span> 
                Devenir Vendeur Pro
              </Link>
            </li>
          </ul>
        </div>

        {/* COLONNE 3 : ASSISTANCE (Aligné à gauche) */}
        <div className="flex flex-col items-start">
          <h4 className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6 border-b border-blue-500/30 pb-1 w-fit">
            Assistance
          </h4>
          <ul className="space-y-3 md:space-y-4 text-[9px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 w-full">
            <li>
              <Link to="/support" className="hover:text-blue-500 transition-colors flex items-center gap-2.5">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-blue-900 rounded-full shrink-0"></span> 
                Support & Contact
              </Link>
            </li>
            <li>
              <Link to="/return-policy" className="hover:text-blue-500 transition-colors flex items-center gap-2.5">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-blue-900 rounded-full shrink-0"></span> 
                Politique de retour
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-blue-500 transition-colors flex items-center gap-2.5">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-blue-900 rounded-full shrink-0"></span> 
                FAQ
              </Link>
            </li>
          </ul>
        </div>
        
      </div>
      
      {/* COPYRIGHT (Aligné à gauche ou centré selon ton choix, ici gauche pour la consistance) */}
      <div className="max-w-[1440px] mx-auto px-4 text-left text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-600 mt-10 md:mt-16 border-t border-white/5 pt-6 md:pt-8">
        © {new Date().getFullYear()} SpaceAuto24. Tous droits réservés.
      </div>
    </footer>
  );
}