import { useState, useEffect } from 'react';
import { Phone, Menu, X, ShoppingBag, BookOpen, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  const isHome = location.pathname === '/';

  // Scroll detection — only relevant on home page
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 60);
    // Set initial state immediately
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // On non-home pages always show solidified nav
  const isTransparent = isHome && !isScrolled && !isMobileMenuOpen;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const linkClass = (path: string) => {
    const active = isActive(path);
    if (isTransparent) {
      return `flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
        active ? 'text-white bg-white/20' : 'text-white/85 hover:text-white hover:bg-white/15'
      }`;
    }
    return `flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
      active ? 'text-brand bg-brand-50 font-semibold' : 'text-sage hover:text-brand hover:bg-brand-50/60'
    }`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent border-b border-transparent'
          : 'glass-card border-b border-white/50 shadow-glass'
      }`}
      aria-label="Main navigation"
    >
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left group"
            aria-label="Nicmah Agrovet — go to homepage"
          >
            <div className={`relative flex-shrink-0 ${isTransparent ? '' : ''}`}>
              <img
                src="/logo.png"
                alt="Nicmah Agrovet logo"
                className={`h-10 w-10 rounded-xl object-contain flex-shrink-0 transition-all duration-200 group-hover:scale-105 ${
                  isTransparent ? 'ring-2 ring-white/30' : 'ring-2 ring-brand/20'
                }`}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className={`font-bold text-base tracking-tight transition-colors duration-200 ${
                isTransparent ? 'text-white' : 'text-brand'
              }`}>
                Nicmah Agrovet
              </span>
              <span className={`text-[11px] font-normal transition-colors duration-200 ${
                isTransparent ? 'text-white/60' : 'text-sage'
              }`}>
                Naromoru, Nyeri County
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            <button
              onClick={() => navigate('/catalog')}
              className={linkClass('/catalog')}
              aria-current={isActive('/catalog') ? 'page' : undefined}
            >
              <ShoppingBag aria-hidden="true" className="w-4 h-4" />
              Shop
            </button>
            <button
              onClick={() => navigate('/articles')}
              className={linkClass('/articles')}
              aria-current={isActive('/articles') ? 'page' : undefined}
            >
              <BookOpen aria-hidden="true" className="w-4 h-4" />
              Learn
            </button>

            <div className={`w-px h-5 mx-2 ${isTransparent ? 'bg-white/25' : 'bg-border'}`} aria-hidden="true" />

            <a
              href="tel:+254726476128"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                isTransparent
                  ? 'text-white/80 hover:text-white hover:bg-white/15'
                  : 'text-sage hover:text-brand hover:bg-brand-50/60'
              }`}
            >
              <Phone aria-hidden="true" className="w-4 h-4" />
              Call Us
            </a>

            {/* Cart */}
            <button
              onClick={() => navigate('/cart')}
              className={`relative p-2 rounded-lg transition-all duration-200 ${
                isTransparent
                  ? 'text-white/80 hover:text-white hover:bg-white/15'
                  : 'text-sage hover:text-brand hover:bg-brand-50/60'
              }`}
              aria-label={totalItems > 0 ? `View cart — ${totalItems} item${totalItems !== 1 ? 's' : ''}` : 'View cart'}
            >
              <ShoppingCart aria-hidden="true" className="w-5 h-5" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 bg-gold text-brand-900 text-[9px] font-bold rounded-full h-4.5 w-4.5 min-w-[18px] flex items-center justify-center leading-none ring-2 ring-white animate-scale-in px-0.5"
                  aria-hidden="true"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/login')}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ml-1 ${
                isTransparent
                  ? 'glass text-white hover:bg-white/25 border-white/30'
                  : 'bg-brand text-white hover:bg-brand-600 shadow-brand hover:shadow-brand-lg'
              }`}
            >
              Login
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
              isTransparent ? 'text-white hover:bg-white/15' : 'text-sage hover:text-brand hover:bg-brand-50/60'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen
              ? <X aria-hidden="true" className="w-6 h-6" />
              : <Menu aria-hidden="true" className="w-6 h-6" />
            }
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-border/50 py-3 flex flex-col gap-0.5 pb-4">
            <button
              onClick={() => { navigate('/catalog'); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 text-sm text-foreground px-3 py-2.5 rounded-lg hover:bg-brand-50 hover:text-brand font-medium transition-colors"
            >
              <ShoppingBag aria-hidden="true" className="w-4 h-4 text-brand" />
              Shop
            </button>
            <button
              onClick={() => { navigate('/articles'); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 text-sm text-foreground px-3 py-2.5 rounded-lg hover:bg-brand-50 hover:text-brand font-medium transition-colors"
            >
              <BookOpen aria-hidden="true" className="w-4 h-4 text-brand" />
              Learn
            </button>
            <a
              href="tel:+254726476128"
              className="flex items-center gap-2.5 text-sm text-foreground px-3 py-2.5 rounded-lg hover:bg-brand-50 hover:text-brand transition-colors"
            >
              <Phone aria-hidden="true" className="w-4 h-4 text-brand" />
              Call Us
            </a>
            <button
              onClick={() => { navigate('/cart'); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 text-sm text-foreground px-3 py-2.5 rounded-lg hover:bg-brand-50 hover:text-brand font-medium transition-colors"
            >
              <ShoppingCart aria-hidden="true" className="w-4 h-4 text-brand" />
              Cart
              {totalItems > 0 && (
                <span className="ml-auto bg-gold text-brand-900 text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center" aria-hidden="true">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
            <div className="border-t border-border/50 pt-2 mt-1">
              <button
                onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                className="w-full text-sm font-semibold bg-brand text-white px-4 py-2.5 rounded-xl hover:bg-brand-600 transition-colors"
              >
                Login to Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
