import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Catalog from "./pages/Catalog.tsx";
import CategoryProducts from "./pages/CategoryProducts.tsx";
import CatalogDetail from "./pages/CatalogDetail.tsx";
import CatalogCategoryProducts from "./pages/CatalogCategoryProducts.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import Navigation from "./components/layout/Navigation.tsx";
import Layout from "./components/layout/Layout.tsx";
import BirdDetail from "./pages/BirdDetail";

function App() {
  return (
    <Router>
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
          <Route path="/bird/:id" element={<BirdDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
