import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import Layout from './components/layout/Layout';
import VendorLayout from './pages/vendor/VendorLayout';
import VendorGuard from './pages/vendor/VendorGuard'; 

// Pages Authentification
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages Catalogue & Client
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import Checkout from './pages/Checkout';
import CustomerDashboard from './pages/customer/CustomerDashboard';

// 🟢 PAGES DE SUPPORT & ASSISTANCE
import SupportPage from './pages/support/SupportPage';
import ReturnPolicyPage from './pages/support/ReturnPolicyPage';
import FaqPage from './pages/support/FaqPage';

// 🔴 CORRECTION DES IMPORTS VENDEUR (Noms clarifiés)
// On renomme le fichier à la racine en "BecomeVendorPage" car c'est le formulaire de candidature
import BecomeVendorPage from './pages/VendorDashboard'; 
// On garde "VendorDashboard" pour la console réelle du vendeur
import VendorDashboard from './pages/vendor/VendorDashboard'; 

// Pages Thématiques
import MotorOil from './pages/MotorOil';
import Tools from './pages/Tools';
import Tires from './pages/Tires'; 
import Accessories from './pages/Accessories'; 
import Garages from './pages/Garages'; 

// Import du bouton
import WhatsAppFloatingBtn from './components/layout/WhatsAppFloatingBtn';

// --- AUTRES PAGES VENDEUR ---
import AddProduct from './pages/vendor/AddProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorMessages from './pages/vendor/VendorMessages';
import VendorNotifications from './pages/vendor/VendorNotifications';

// Pages Administration
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTransactions from "./pages/admin/AdminTransactions";

import './App.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        {/* --- BLOC PRINCIPAL --- */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/tires" element={<Tires />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/garages" element={<Garages />} />
          <Route path="/huiles" element={<MotorOil />} />
          <Route path="/outillage" element={<Tools />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />

          {/* 🟢 ROUTES ASSISTANCE */}
          <Route path="/support" element={<SupportPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/faq" element={<FaqPage />} />

          {/* Le formulaire de candidature Vendeur */}
          <Route path="/become-vendor" element={<BecomeVendorPage />} /> 

          {/* ADMINISTRATION */}
          <Route path="/admin">
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="transactions" element={<AdminTransactions />} />
          </Route>

          {/* ESPACE DE GESTION VENDEUR (Privé) */}
          <Route path="/vendor" element={<VendorLayout />}>
            <Route element={<VendorGuard />}>
              <Route index element={<VendorDashboard />} /> 
              <Route path="dashboard" element={<VendorDashboard />} />
              
              <Route path="add-product" element={<AddProduct />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="products" element={<VendorProducts />} />
              <Route path="messages" element={<VendorMessages />} />
              <Route path="notifications" element={<VendorNotifications />} />
              <Route path="settings" element={<VendorSettings />} />
            </Route>
          </Route>
        </Route>

        {/* --- HORS LAYOUT --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      <WhatsAppFloatingBtn />
    </Router>
  );
}

export default App;