import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import CatalogDetail from './pages/CatalogDetail.tsx';
import Cart from './pages/Cart.tsx';
import Navigation from './components/layout/Navigation.tsx';
import Layout from './components/layout/Layout.tsx';
import BirdDetail from './pages/BirdDetail';

function App() {
  return (
    <Router>
      <Navigation />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog/:id" element={<CatalogDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/bird/:id" element={<BirdDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;