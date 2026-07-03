import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-slate-800">
      <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8 text-slate-950">
        Conditions Générales d'Utilisation (CGU)
      </h1>
      
      <div className="space-y-6 text-sm md:text-base leading-relaxed">
        <p>
          Bienvenue sur <strong>SpaceAuto24</strong>. En accédant à notre plateforme, vous acceptez les présentes conditions générales d'utilisation. Si vous n'êtes pas en accord avec celles-ci, nous vous invitons à ne pas utiliser nos services.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">1. Objet du service</h2>
        <p>
          SpaceAuto24 est une plateforme numérique dédiée à la mise en relation entre les propriétaires de véhicules et les professionnels de l'automobile (garages, vendeurs de pièces détachées) en Côte d'Ivoire.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">2. Responsabilité</h2>
        <p>
          SpaceAuto24 agit en tant qu'intermédiaire. Nous ne saurions être tenus responsables de la qualité des pièces vendues ou des prestations réalisées par nos garages partenaires. Tout litige lié à une transaction commerciale doit être réglé directement entre l'utilisateur et le prestataire concerné.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">3. Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site (textes, logos, images, base de données) est la propriété exclusive de SpaceAuto24. Toute reproduction, même partielle, sans autorisation préalable est strictement interdite.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">4. Utilisation du compte</h2>
        <p>
          L'utilisateur est responsable de la confidentialité de ses identifiants. Toute activité réalisée via votre compte sera considérée comme effectuée par vous-même.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">5. Droit applicable</h2>
        <p>
          Les présentes conditions sont régies par les lois en vigueur en Côte d'Ivoire. Tout litige relatif à l'utilisation de la plateforme sera soumis à la compétence des tribunaux compétents d'Abidjan.
        </p>

        <div className="mt-12 p-6 bg-slate-100 rounded-lg border-l-4 border-orange-500">
          <p className="font-bold">Besoin de plus d'informations ?</p>
          <p>
            Contactez-nous à l'adresse suivante : 
            <a href="mailto:contact@spaceauto24.com" className="text-blue-600 font-bold ml-2 hover:underline">
              contact@spaceauto24.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}