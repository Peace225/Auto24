import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';

export default function VendorLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex">
        {/* SIDEBAR : On s'assure qu'elle commence sous la Navbar (top-[height]) */}
        {/* Ajuste top-[160px] selon la hauteur totale Navbar + SubHeader */}
        <div className="hidden lg:block fixed left-0 top-[160px] bottom-0 w-72 border-r border-slate-200 bg-white z-40">
          <VendorSidebar />
        </div>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 lg:ml-72 px-4 md:px-8 pb-20">
          <div className="max-w-7xl mx-auto pt-8">
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  );
}