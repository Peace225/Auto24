import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-slate-800">
      <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8 text-slate-950">
        Politique de confidentialité
      </h1>
      
      <div className="space-y-6 text-sm md:text-base leading-relaxed">
        <p>
          Chez <strong>SpaceAuto24</strong>, nous accordons une importance capitale à la protection de vos données personnelles. La présente politique détaille la manière dont nous collectons, utilisons et protégeons vos informations.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">1. Données collectées</h2>
        <p>
          Nous collectons les informations que vous nous transmettez directement, notamment :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Vos informations d'identification (nom, prénom, e-mail).</li>
          <li>Vos coordonnées liées à vos commandes de pièces ou services.</li>
          <li>Données techniques liées à l'utilisation du site (adresse IP, cookies).</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8">2. Utilisation des informations</h2>
        <p>
          Vos données nous permettent de :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Gérer votre compte utilisateur et sécuriser vos accès.</li>
          <li>Faciliter la mise en relation avec nos garages partenaires en Côte d'Ivoire.</li>
          <li>Vous envoyer des notifications essentielles concernant vos commandes.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8">3. Protection des données</h2>
        <p>
          Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles conformes aux standards du secteur pour empêcher tout accès non autorisé, altération ou divulgation de vos données personnelles.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8">4. Vos droits</h2>
        <p>
          Conformément aux réglementations en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ces droits à tout moment en nous contactant directement.
        </p>

        <div className="mt-12 p-6 bg-slate-100 rounded-lg border-l-4 border-blue-500">
          <p className="font-bold">Des questions sur vos données ?</p>
          <p>
            Notre équipe dédiée est à votre écoute : 
            <a href="mailto:support@spaceauto24.com" className="text-blue-600 font-bold ml-2 hover:underline">
              support@spaceauto24.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}