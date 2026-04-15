import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LOGO_SRC = '/brand/duesaccountant-logo.png';

const SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'faq', label: 'FAQ' },
];

const NavBrandLogo = () => (
  <img
    src={LOGO_SRC}
    alt="DuesAccountant — Dues Management Made Easy"
    className="h-auto w-auto max-h-[68px] max-w-[300px] object-contain object-left select-none"
    decoding="async"
  />
);

const MarketingNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Slightly taller bar so logo has breathing room */}
        <div className="flex h-[84px] items-center justify-between">

          {/* Brand lock-up — logo image carries the icon + name + tagline */}
          <Link
            to="/"
            className="shrink-0 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="DuesAccountant — Home"
          >
            <NavBrandLogo />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-6 md:flex">
            {SECTIONS.map(({ id, label }) =>
              isHome ? (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="min-h-[44px] inline-flex items-center rounded-md px-1 font-semibold text-slate-700 transition-colors hover:text-blue-700"
                >
                  {label}
                </button>
              ) : (
                <Link
                  key={id}
                  to={`/#${id}`}
                  className="min-h-[44px] inline-flex items-center rounded-md px-1 font-semibold text-slate-700 transition-colors hover:text-blue-700"
                >
                  {label}
                </Link>
              )
            )}

            <Link
              to="/login"
              className="min-h-[44px] inline-flex items-center rounded-lg px-3 font-bold text-blue-700 hover:underline"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 min-w-[44px] items-center justify-center text-slate-700 hover:text-blue-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-3">
            {SECTIONS.map(({ id, label }) =>
              isHome ? (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="flex min-h-[44px] w-full items-center rounded-md px-3 py-2.5 text-left font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {label}
                </button>
              ) : (
                <Link
                  key={id}
                  to={`/#${id}`}
                  className="flex min-h-[44px] w-full items-center rounded-md px-3 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              )
            )}

            <Link
              to="/login"
              className="flex min-h-[44px] items-center rounded-md px-3 py-2.5 font-bold text-blue-700 hover:bg-slate-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>

            <Link
              to="/register"
              className="mt-1 flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-3 py-2.5 font-semibold text-white hover:bg-blue-700"
              onClick={() => setMobileMenuOpen(false)}
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
