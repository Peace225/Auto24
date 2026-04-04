// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom'; // On remplace ReactNode par Outlet
import Navbar from './Navbar';
import SubHeaderSearch from '../SubHeaderSearch';
import Footer from './Footer';

// Plus besoin de l'interface LayoutProps car Outlet gère l'injection automatiquement
export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <SubHeaderSearch />
      
      <main className="flex-grow">
        {/* C'est ICI que le contenu de tes routes (Home, Login, etc.) 
            va "sortir". Sans <Outlet />, la zone reste vide.
        */}
        
        <Outlet /> 
      </main>
      
      <Footer />
    </div>
  );
}