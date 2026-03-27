import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Catalog from "./pages/Catalog.tsx";
import CategoryProducts from "./pages/CategoryProducts.tsx";
import CatalogDetail from "./pages/CatalogDetail.tsx";
import CatalogCategoryProducts from "./pages/CatalogCategoryProducts.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import OrderConfirmation from "./pages/OrderConfirmation.tsx";
import Navigation from "./components/layout/Navigation.tsx";
import Layout from "./components/layout/Layout.tsx";
import BirdDetail from "./pages/BirdDetail";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout.tsx";

import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminProducts from "./pages/admin/AdminProducts.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import ProtectedRoute from "./components/admin/ProtectedRoute.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute>
                <AdminLayout><AdminProducts /></AdminLayout>
              </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/orders" 
          element={
            <ProtectedRoute>
                <AdminLayout><AdminOrders /></AdminLayout>
              </ProtectedRoute>
          } 
        />

        <Route path="*" element={
          <>
            <Navigation />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/katalog" element={<Catalog />} />
                <Route path="/kategori/:slug" element={<CategoryProducts />} />
                <Route path="/catalog/:id" element={<CatalogDetail />} />
                <Route path="/catalog/:id/kategori/:slug" element={<CatalogCategoryProducts />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/confirm/:invoiceNumber" element={<OrderConfirmation />} />
                <Route path="/bird/:id" element={<BirdDetail />} />
              </Routes>
            </Layout>
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;

