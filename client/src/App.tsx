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

// Pages Thématiques
import MotorOil from './pages/MotorOil';
import Tools from './pages/Tools';
import Tires from './pages/Tires'; 
import Accessories from './pages/Accessories'; 
import Garages from './pages/Garages'; 

// --- PAGES VENDEUR ---
import VendorDashboardPage from './pages/VendorDashboard'; // 👈 Ta page de candidature (le formulaire)
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

          {/* PAGE POUR DEVENIR VENDEUR (Candidature) */}
          <Route path="/become-vendor" element={<VendorDashboardPage />} /> 

          {/* ADMINISTRATION */}
          <Route path="/admin">
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="transactions" element={<AdminTransactions />} />
          </Route>

          {/* ESPACE DE GESTION VENDEUR (Une fois accepté) */}
          <Route path="/vendor" element={<VendorLayout />}>
            <Route element={<VendorGuard />}>
              <Route index element={<VendorDashboardPage />} /> 
              <Route path="dashboard" element={<VendorDashboardPage />} />
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
    </Router>
  );
}

export default App;