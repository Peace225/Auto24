import HeroSection from '../components/features/HeroSection';
import Partners from '../components/features/Partners';
import AllPartsGrid from '../components/features/AllPartsGrid';
import FeaturedProducts from '../components/features/FeaturedProducts';
import WhyChooseUs from '../components/features/WhyChooseUs';
import FeaturedStores from '../components/features/FeaturedStores';
import BoostedProducts from '../components/features/BoostedProducts';
import PromoPage from '../components/features/PromoPage';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* 🟢 HERO SECTION (Recherche + Banner) */}
      <HeroSection />

      {/* 🟢 PRODUITS BOOST */}
      <BoostedProducts />

      {/* 🟢 PRODUITS À LA UNE */}
      <FeaturedProducts />

      {/* 🟢 PRODUITS PROMO */}
      <PromoPage />
      
      <FeaturedStores />

      {/* 🟢 GRILLE COMPLÈTE DU CATALOGUE */}
      <AllPartsGrid />
      
       {/* 🟢 Ajout Pourquoi choisir SpaceAuto24 */}
      <WhyChooseUs />

      {/* 🟢 NOS PARTENAIRES MARQUES */}
      <Partners />

    </div>
  );
}