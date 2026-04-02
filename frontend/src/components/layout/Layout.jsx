import React from 'react';
import Navbar from './Navbar';
import ScrollToTopButton from '../ui/ScrollToTopButton';
import Footer from './Footer';
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-300">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <ScrollToTopButton />
      <Footer />
    </div>
  );
};

export default Layout;
