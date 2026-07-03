import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Checkout from './pages/Checkout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Batteries from './pages/Batteries';
import StoreDetail from './components/features/StoreDetail';

// PAGES DE SUPPORT & ASSISTANCE
import SupportPage from './pages/support/SupportPage';
import ReturnPolicyPage from './pages/support/ReturnPolicyPage';
import FaqPage from './pages/support/FaqPage';
import PrivacyPolicy from './pages/support/PrivacyPolicy';
import TermsOfService from './pages/support/TermsOfService';

// IMPORTS VENDEUR
import BecomeVendorPage from './pages/vendor/BecomeVendorPage'; 
import VendorDashboard from './pages/vendor/VendorDashboard'; 
import VendorPricing from './pages/vendor/VendorPricing'; 
import VendorPayment from './pages/vendor/VendorPayment';
import BoostPage from './pages/vendor/BoostPage';

// Pages Thématiques
import MotorOil from './pages/MotorOil';
import Tools from './pages/Tools';
import Tires from './pages/Tires'; 
import Accessories from './pages/Accessories'; 
import Garages from './pages/Garages'; 

// Import du bouton & Panier
import WhatsAppFloatingBtn from './components/layout/WhatsAppFloatingBtn';
import CartDrawer from './components/features/CartDrawer'; 

// --- AUTRES PAGES VENDEUR ---
import AddProduct from './pages/vendor/AddProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorMessages from './pages/vendor/VendorMessages';
import VendorNotifications from './pages/vendor/VendorNotifications';
import RegisterVendorPage from './pages/vendor/RegisterVendorPage';
import EditProduct from './pages/vendor/EditProduct';

// Pages Administration
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTransactions from "./pages/admin/AdminTransactions";

import './App.css';

function ConditionalWhatsApp() {
  const location = useLocation();
  const hiddenPaths = ['/admin', '/vendor', '/dashboard', '/login', '/register'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) return null;
  return <WhatsAppFloatingBtn />;
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <CartDrawer />

      <Routes>
        {/* --- 1. ROUTES CLIENTS (Avec Layout) --- */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          
          {/* 🟢 RECHERCHE & CATALOGUE */}
          <Route path="/search" element={<Catalog />} />
          <Route path="/catalog" element={<Catalog />} />
          
          <Route path="/tires" element={<Tires />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/garages" element={<Garages />} />
          <Route path="/huiles" element={<MotorOil />} />
          <Route path="/batteries" element={<Batteries />} />
          <Route path="/outillage" element={<Tools />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          
          {/* ASSISTANCE & LÉGAL */}
          <Route path="/support" element={<SupportPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          
          <Route path="/become-vendor" element={<BecomeVendorPage />} /> 
          <Route path="/store/:id" element={<StoreDetail />} />
        </Route>

        {/* --- 2. ROUTES VENDEURS --- */}
        <Route 
          path="/vendor" 
          element={
            <VendorGuard>
              <VendorLayout />
            </VendorGuard>
          }
        >
          <Route index element={<Navigate to="/vendor/dashboard" replace />} /> 
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products">
            <Route index element={<VendorProducts />} />
            <Route path="new" element={<AddProduct />} />
            <Route path="edit/:id" element={<EditProduct />} />
          </Route>
          <Route path="orders" element={<VendorOrders />} />
          <Route path="messages" element={<VendorMessages />} />
          <Route path="notifications" element={<VendorNotifications />} />
          <Route path="boost" element={<BoostPage />} />
          <Route path="settings">
            <Route index element={<VendorSettings />} />
            <Route path="plans" element={<VendorPricing />} />
            <Route path="payment" element={<VendorPayment />} />
          </Route>
        </Route>

        {/* --- 3. ROUTES ADMIN --- */}
        <Route path="/admin">
           <Route index element={<Navigate to="/admin/dashboard" replace />} />
           <Route path="dashboard" element={<AdminDashboard />} />
           <Route path="transactions" element={<AdminTransactions />} />
        </Route>

        {/* --- 4. AUTH & ERREURS --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-vendor" element={<RegisterVendorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ConditionalWhatsApp />
    </Router>
  );
}

export default App;