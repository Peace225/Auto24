import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar'; // Vérifie bien ce chemin d'import

export default function VendorLayout() {
  return (
    // 1. On change le fond pour correspondre au dashboard sombre (vu sur l'image)
    <div className="min-h-screen bg-[#05070B] flex overflow-hidden">
      
      {/* 
        LA SIDEBAR 
        Elle doit être en 'fixed' (géré dans VendorSidebar) 
      */}
      <VendorSidebar />

      {/* 
        CONTENU PRINCIPAL 
        On force la marge à gauche (lg:ml-72) pour laisser la place à la Sidebar 
      */}
      <main className="flex-1 w-full min-h-screen overflow-y-auto lg:ml-72 transition-all duration-300">
        <div className="px-4 md:px-8 
          /* pt-8 : On réduit si tu n'as pas de header fixe, ou garde pt-24 si tu en as un */
          pt-8 
          /* pb-32 : Espace pour la barre mobile */
          pb-32 lg:pb-12"
        >
          {/* Conteneur pour limiter la largeur et centrer comme sur ton image a_6.PNG */}
          <div className="max-w-7xl mx-auto">
            {/* C'est ici que s'injecte le VendorDashboard */}
            <Outlet /> 
          </div>
        </div>
      </main>
    </div>
  );
}