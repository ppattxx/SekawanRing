import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home.tsx";
import CategoryProducts from "./pages/CategoryProducts.tsx";
import CatalogDetail from "./pages/CatalogDetail.tsx";
import CatalogCategoryProducts from "./pages/CatalogCategoryProducts.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import OrderConfirmation from "./pages/OrderConfirmation/index";
import Navigation from "./components/layout/Navigation.tsx";
import Layout from "./components/layout/Layout.tsx";
import CartToast from "./components/layout/CartToast.tsx";
import AppDialog from "./components/layout/AppDialog.tsx";
import BirdDetail from "./pages/BirdDetail.tsx";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminProducts from "./pages/admin/AdminProducts.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import ProtectedRoute from "./components/admin/ProtectedRoute.tsx";

function AppLayout() {
  return (
    <>
      <Navigation />
      <CartToast />
      <Layout>
        <Outlet />
      </Layout>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppDialog />
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

        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/katalog" element={<Home />} />
          <Route path="/kategori/:slug" element={<CategoryProducts />} />
          <Route path="/catalog/:id" element={<CatalogDetail />} />
          <Route path="/catalog/:id/kategori/:slug" element={<CatalogCategoryProducts />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/confirm/:invoiceNumber" element={<OrderConfirmation />} />
          <Route path="/bird/:id" element={<BirdDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
