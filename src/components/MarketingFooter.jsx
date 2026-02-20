import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const MarketingFooter = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">Dues Accountant</h3>
            <p className="text-gray-400 mb-4">
              Streamline your organization's dues management with powerful analytics and automation.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:winswardtech@gmail.com"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <Mail size={18} />
                <span>winswardtech@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-1">
              <li>
                <Link to="/login" className="inline-flex min-h-[44px] items-center py-2 hover:text-white transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="inline-flex min-h-[44px] items-center py-2 hover:text-white transition-colors">
                  Register Organization
                </Link>
              </li>
              <li>
                <a href="#features" className="inline-flex min-h-[44px] items-center py-2 hover:text-white transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-1">
              <li>
                <a href="#faq" className="inline-flex min-h-[44px] items-center py-2 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="mailto:winswardtech@gmail.com" className="inline-flex min-h-[44px] items-center py-2 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Dues Accountant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;

