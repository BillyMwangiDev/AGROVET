import { useEffect, useRef } from 'react';
import { MessageCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '254740368581';

const TRUST_ITEMS = [
  '20+ Years Experience',
  'Trusted by 500+ Farmers',
  'Naromoru, Nyeri County',
];

const STAT_CARDS = [
  { value: '20+', label: 'Years of Service' },
  { value: '500+', label: 'Farmers Served' },
  { value: '4', label: 'Service Lines' },
];

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const scrollToProducts = () => {
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      tlRef.current = gsap
        .timeline({ delay: 0.15 })
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 36, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' },
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' },
          '-=0.45',
        )
        .fromTo(
          buttonsRef.current ? Array.from(buttonsRef.current.children) : [],
          { opacity: 0, scale: 0.92, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' },
          '-=0.35',
        )
        .fromTo(
          stripRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          '-=0.2',
        )
        .fromTo(
          statsRef.current ? Array.from(statsRef.current.children) : [],
          { opacity: 0, y: 18, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out' },
          '-=0.3',
        );
    });
    return () => {
      tlRef.current?.kill();
      ctx.revert();
    };
  }, []);

  return (
    <section className="relative w-full min-h-[82vh] flex items-end pt-16 overflow-hidden">
      {/* Background — fetchpriority=high for best LCP */}
      <img
        src="/images/hero_card_b_cow.jpg"
        alt="Cows grazing in green fields at a Kenyan farm"
        className="absolute inset-0 w-full h-full object-cover object-center"
        fetchPriority="high"
        loading="eager"
      />

      {/* Layered gradient overlay — more atmospheric */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(105deg, rgba(11,58,44,0.82) 0%, rgba(11,58,44,0.55) 45%, rgba(0,0,0,0.15) 100%)',
        }}
        aria-hidden="true"
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to top, rgba(11,58,44,0.5), transparent)' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-20 pt-24">
        <div className="max-w-2xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 glass rounded-full px-3.5 py-1.5 mb-5 text-xs font-semibold text-white/90 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Kenya's Trusted Agrovet Partner
          </div>

          <h1
            ref={headlineRef}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.06] tracking-tight mb-5 drop-shadow"
            style={{ opacity: 0 }}
          >
            Walking the Farming<br />
            <span className="gradient-text-gold">Journey</span> with You
          </h1>

          <p
            ref={subRef}
            className="text-lg sm:text-xl text-white/80 mb-8 font-normal leading-relaxed max-w-xl"
            style={{ opacity: 0 }}
          >
            Livestock Health, Quality Genetics &amp; Crop Solutions —{' '}
            Over Two Decades Serving Farmers Across Nyeri County
          </p>

          <div ref={buttonsRef} className="flex flex-wrap items-center gap-3">
            <button
              onClick={scrollToProducts}
              className="flex items-center gap-2 px-7 py-3.5 bg-brand text-white font-semibold rounded-xl transition-all shadow-brand hover:shadow-brand-lg hover:bg-brand-600 hover:-translate-y-0.5 text-sm tracking-wide"
              style={{ opacity: 0 }}
            >
              Browse Products
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 glass text-white font-semibold rounded-xl transition-all hover:bg-white/20 text-sm"
              style={{ opacity: 0 }}
            >
              <MessageCircle aria-hidden="true" className="w-4 h-4" />
              Order via WhatsApp
            </a>
          </div>

          {/* Trust strip — glassmorphism pills */}
          <div
            ref={stripRef}
            className="flex flex-wrap items-center gap-2 mt-7"
            aria-label="Trust indicators"
            style={{ opacity: 0 }}
          >
            {TRUST_ITEMS.map((item) => (
              <div
                key={item}
                className="flex items-center gap-1.5 glass rounded-full px-4 py-1.5 text-xs font-medium text-white/90"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating stat cards — bottom-right, desktop only */}
      <div
        ref={statsRef}
        className="absolute bottom-10 right-6 lg:right-10 xl:right-14 hidden lg:flex flex-col gap-3 z-10"
        aria-label="Key statistics"
      >
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-2xl px-5 py-3.5 flex items-center gap-3.5 min-w-[170px] shadow-glass"
            style={{ opacity: 0 }}
          >
            <span className="text-2xl font-extrabold text-gold font-mono leading-none">{stat.value}</span>
            <span className="text-sm text-white/75 font-medium leading-tight">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
