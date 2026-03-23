import { MapPin, Phone, MessageCircle, ArrowUp, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '254740368581';

const QUICK_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/catalog' },
  { label: 'Learn', path: '/articles' },
  { label: 'Cart', path: '/cart' },
  { label: 'Login', path: '/login' },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-gold font-bold text-xs uppercase tracking-[0.12em] mb-5 flex items-center gap-2">
      {children}
      <span className="flex-1 h-px bg-gold/20" aria-hidden="true" />
    </h3>
  );
}

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      className="w-full"
      style={{
        background: 'linear-gradient(145deg, #093025 0%, #0B3A2C 50%, #0d4a38 100%)',
      }}
    >
      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1 — Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Nicmah Agrovet"
                className="h-12 w-12 rounded-xl object-contain flex-shrink-0 ring-2 ring-white/15"
              />
              <div>
                <h3 className="text-white font-bold text-base leading-tight">Nicmah Agrovet</h3>
                <p className="text-white/45 text-xs">Naromoru, Nyeri County</p>
              </div>
            </div>
            <p className="text-white/65 text-sm leading-relaxed max-w-xs">
              Farmers-focused agrovet with over two decades of experience. We walk the journey with you — livestock health, AI breeding, and crop farming solutions.
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <Leaf className="w-3.5 h-3.5 text-gold/70" aria-hidden="true" />
              <p className="text-white/40 text-xs">nicmahagrovet@gmail.com</p>
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <FooterHeading>Quick Links</FooterHeading>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ label, path }) => (
                <li key={path}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-white/65 text-sm hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact */}
          <div>
            <FooterHeading>Contact Us</FooterHeading>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5 text-white/65 text-sm">
                <MapPin aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-gold/60" />
                <span className="leading-relaxed">
                  Timberland Building, Naromoru Town<br />
                  (Near KFA), Nyeri County, Kenya
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-white/65 text-sm">
                <Phone aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-gold/60" />
                <span>
                  <a href="tel:+254721908023" className="hover:text-white transition-colors block leading-relaxed">
                    Vet: +254 721 908 023
                  </a>
                  <a href="tel:+254726476128" className="hover:text-white transition-colors block leading-relaxed">
                    Shop: +254 726 476 128
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-white/65 text-sm">
                <MessageCircle aria-hidden="true" className="w-4 h-4 shrink-0 text-gold/60" />
                <a
                  href={`https://wa.me/${WHATSAPP_PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 — Follow Us */}
          <div>
            <FooterHeading>Follow Us</FooterHeading>
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <a
                href="#"
                aria-label="Nicmah Agrovet on Facebook (coming soon)"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gold hover:scale-110 hover:shadow-gold flex items-center justify-center transition-all duration-200 group"
              >
                <svg aria-hidden="true" className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="#"
                aria-label="Nicmah Agrovet on TikTok (coming soon)"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gold hover:scale-110 hover:shadow-gold flex items-center justify-center transition-all duration-200"
              >
                <svg aria-hidden="true" className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.36a8.16 8.16 0 004.77 1.52V7.43a4.85 4.85 0 01-1.01-.74z" />
                </svg>
              </a>
            </div>
            <p className="text-white/35 text-xs mt-4">Social pages coming soon</p>

            {/* Business hours */}
            <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gold/80 text-xs font-semibold mb-2 uppercase tracking-wide">Hours</p>
              <p className="text-white/55 text-xs leading-relaxed">
                Mon–Fri: 8:00 AM – 6:00 PM<br />
                Saturday: 8:00 AM – 4:00 PM
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 px-4 sm:px-6 lg:px-8 xl:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-white/35 text-sm">
          © 2026 Nicmah Agrovet. All rights reserved.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-1.5 text-white/35 hover:text-gold text-xs transition-colors group"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
          Back to top
        </button>
      </div>
    </footer>
  );
}
