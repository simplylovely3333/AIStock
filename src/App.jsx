import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProviders } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import AssetDetailPage from './pages/AssetDetailPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import CreatorsPage from './pages/CreatorsPage';
import TopUpPage from './pages/TopUpPage';
import PricingPage from './pages/PricingPage';
import AISupportWidget from './components/AISupportWidget';

export default function App() {
  return (
    <GoogleOAuthProvider clientId="991882570902-4762bnnipn9fl9445sfggq2va0jr4fff.apps.googleusercontent.com">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProviders>
          <Header />
          <CartSidebar />
          <main>
            <Routes>
              <Route path="/"          element={<HomePage />} />
              <Route path="/browse"    element={<BrowsePage />} />
              <Route path="/asset/:id" element={<AssetDetailPage />} />
              <Route path="/upload"    element={<UploadPage />} />
              <Route path="/creators"  element={<CreatorsPage />} />
              <Route path="/auth"      element={<AuthPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
              <Route path="/topup"     element={<TopUpPage />} />
              <Route path="/pricing"   element={<PricingPage />} />
              <Route path="*"          element={<HomePage />} />
            </Routes>
          </main>
          <AISupportWidget />
          <Footer />
        </AppProviders>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

