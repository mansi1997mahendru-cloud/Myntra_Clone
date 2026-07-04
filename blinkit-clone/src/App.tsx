import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Categories } from './pages/Categories';
import { Search } from './pages/Search';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Splash } from './pages/Splash';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Otp } from './pages/Otp';
import { CompleteProfile } from './pages/CompleteProfile';
import { Orders } from './pages/Orders';
import { ProductDetails } from './pages/ProductDetails';
import { Checkout } from './pages/Checkout';
import { ResetPassword } from './pages/ResetPassword';
import { Wishlist } from './pages/Wishlist';
import { Offers } from './pages/Offers';
import { Admin } from './pages/Admin';
import { TrackOrder } from './pages/TrackOrder';
import { BlinkAI } from './pages/BlinkAI';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
        <Routes>
          {/* Main Entry Splash and Onboarding */}
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Core App Layout & Tabs */}
          <Route element={<Layout />}>
            <Route path="home" element={<Home />} />
            <Route path="categories" element={<Categories />} />
            <Route path="search" element={<Search />} />
            <Route path="cart" element={<Cart />} />
            <Route path="orders" element={<Orders />} />
            <Route path="profile" element={<Profile />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="offers" element={<Offers />} />
            <Route path="admin" element={<Admin />} />
            <Route path="track-order/:id" element={<TrackOrder />} />
            <Route path="blinkai" element={<BlinkAI />} />
          </Route>

          {/* Catch-all redirect to Splash */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
