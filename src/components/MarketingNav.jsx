import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const MarketingNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Dues Accountant
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('analytics')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              FAQ
            </button>
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-[44px] items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 min-w-[44px] items-center justify-center text-gray-700 hover:text-blue-600"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <button
              onClick={() => scrollToSection('features')}
              className="flex min-h-[44px] w-full items-center text-left px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('analytics')}
              className="flex min-h-[44px] w-full items-center text-left px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Analytics
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="flex min-h-[44px] w-full items-center text-left px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
            >
              FAQ
            </button>
            <Link
              to="/login"
              className="flex min-h-[44px] items-center px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="flex min-h-[44px] items-center justify-center px-3 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MarketingNav;

