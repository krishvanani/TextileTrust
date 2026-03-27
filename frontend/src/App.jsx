import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Search from './pages/Search';
import CompanyProfile from './pages/CompanyProfile';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';
// import RegisterCompany from './pages/RegisterCompany';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { Toaster } from 'react-hot-toast';

import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <Router>
          <ScrollToTop />
          <ErrorBoundary>
            <Layout>
              <Toaster position="top-right" />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/search" element={<Search />} />
                <Route path="/subscription" element={<Subscription />} />
                {/* <Route path="/register-company" element={<RegisterCompany />} /> */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/company/:id" element={<CompanyProfile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </ErrorBoundary>
        </Router>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;

