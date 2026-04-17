import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';

export default function VendorLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex w-full">
        
        {/* CONTENU PRINCIPAL */}
        {/* Le pb-28 (Padding Bottom) empêche le contenu de se cacher sous la barre mobile */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden lg:ml-72 px-4 md:px-8 pt-8 pb-28">
          <div className="max-w-7xl mx-auto">
            <Outlet /> 
          </div>
        </main>

        {/* LA SIDEBAR / BARRE MOBILE EST PLACÉE TOUT EN BAS */}
        {/* L'ordre du DOM garantit qu'elle s'affiche au-dessus du contenu */}
        <VendorSidebar />
        
      </div>
    </div>
  );
}