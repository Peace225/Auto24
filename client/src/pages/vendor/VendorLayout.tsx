import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';

export default function VendorLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Si ton Header (le blanc avec le logo) n'est pas déjà dans App.tsx, 
        tu peux l'importer et le placer ici. 
      */}
      
      <div className="flex w-full">
        {/* LA SIDEBAR (Fixe à gauche sur Desktop, Flottante sur Mobile) */}
        <VendorSidebar />

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden lg:ml-72 transition-all duration-300">
          <div className="px-4 md:px-8 
            /* pt-[100px] : Très important pour que le contenu ne soit pas caché sous le Header fixe */
            pt-[100px] 
            /* pb-32 : Laisse de l'espace pour la barre de navigation flottante sur mobile */
            pb-32 lg:pb-12"
          >
            <div className="max-w-7xl mx-auto">
              {/* C'est ici que tes pages (Dashboard, Orders, etc.) vont s'afficher */}
              <Outlet /> 
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}