import { Link } from 'react-router-dom';

export default function Footer() {
  // copie l'email si le mailto ne s'ouvre pas
  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      // remplace par un toast si tu en as un
      console.log(`Email copié : ${email}`);
    } catch {}
  };

  return (
    <footer className="relative z-20 bg-slate-900 text-slate-300 py-8 md:py-12 mt-auto border-t-[6px] md:border-t-[8px] border-slate-950">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">

        {/* COLONNE 1 : LOGO & DESC */}
        <div className="flex flex-col items-start">
          <Link to="/" className="font-[1000] text-lg md:text-2xl text-white tracking-tighter block mb-2 md:mb-4 italic uppercase">
            SpaceAuto<span className="text-orange-500">24</span>
          </Link>
          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] md:tracking-[0.15em] leading-relaxed max-w-[240px]">
            La plateforme de référence de la pièce détachée et du service automobile en Côte d'Ivoire.
          </p>
        </div>

        {/* COLONNE 2 : SERVICES */}
        <div className="flex flex-col items-start">
          <h4 className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 border-b border-orange-500/30 pb-1 w-fit">
            Services
          </h4>
          <ul className="space-y-2 md:space-y-3 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 w-full">
            <li>
              <Link to="/catalog" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-slate-700 rounded-full shrink-0"></span>
                Catalogue de pièces
              </Link>
            </li>
            <li>
              <Link to="/garages" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-slate-700 rounded-full shrink-0"></span>
                Garages Partenaires
              </Link>
            </li>
            <li>
              <Link to="/become-vendor" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-slate-700 rounded-full shrink-0"></span>
                Devenir Vendeur Pro
              </Link>
            </li>
          </ul>
        </div>

        {/* COLONNE 3 : ASSISTANCE */}
        <div className="flex flex-col items-start">
          <h4 className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 border-b border-blue-500/30 pb-1 w-fit">
            Assistance
          </h4>
          <ul className="space-y-2 md:space-y-3 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 w-full">
            <li>
              <a
                href="mailto:support@spaceauto24.com"
                onClick={() => copyEmail('support@spaceauto24.com')}
                className="hover:text-blue-500 transition-colors flex items-center gap-2"
              >
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-900 rounded-full shrink-0"></span>
                support@spaceauto24.com
              </a>
            </li>
            <li>
              <a
                href="mailto:contact@spaceauto24.com"
                onClick={() => copyEmail('contact@spaceauto24.com')}
                className="hover:text-blue-500 transition-colors flex items-center gap-2"
              >
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-900 rounded-full shrink-0"></span>
                contact@spaceauto24.com
              </a>
            </li>
            <li>
              <Link to="/faq" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-900 rounded-full shrink-0"></span>
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-900 rounded-full shrink-0"></span>
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link to="/terms-of-service" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-900 rounded-full shrink-0"></span>
                Conditions d'utilisation
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="max-w-[1440px] mx-auto px-4 text-left text-[7px] md:text-[9px] font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] text-slate-700 mt-8 md:mt-12 border-t border-white/5 pt-4 md:pt-6">
        © {new Date().getFullYear()} SpaceAuto24. Tous droits réservés.
      </div>
    </footer>
  );
}