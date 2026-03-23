import { useEffect, useRef } from 'react';
import { Syringe, Leaf, ShieldCheck, Stethoscope, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    icon: Syringe,
    accent: 'brand',
    title: 'Artificial Insemination',
    description:
      'Top-quality semen from local and international breeders, administered by our expert AI team to thousands of cattle across the region.',
  },
  {
    icon: Leaf,
    accent: 'gold',
    title: 'Livestock Nutrition & Health',
    description:
      'Vaccines, medicines, dewormers, acaricides, supplements and quality feeds to keep your herd healthy and thriving.',
  },
  {
    icon: ShieldCheck,
    accent: 'brand',
    title: 'Crop Farming Solutions',
    description:
      'Quality seeds, foliar fertilizers and pest control products to ensure maximum yields for crop farmers.',
  },
  {
    icon: Stethoscope,
    accent: 'gold',
    title: 'Animal Disease Solutions',
    description:
      'Expert solutions for animal diseases and nutrition — we walk the journey with you to ensure your farming goals are achieved.',
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
        },
      );
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 72%' },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="w-full py-20"
      style={{
        background:
          'linear-gradient(145deg, #e8f5ee 0%, #ffffff 50%, rgba(228,184,58,0.06) 100%)',
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12" style={{ opacity: 0 }}>
          <div className="inline-flex items-center gap-1.5 bg-brand/8 text-brand text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 border border-brand/12">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            What We Offer
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            Our{' '}
            <span className="gradient-text">Services</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Comprehensive agricultural solutions for modern Kenyan farming
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="relative glass-card rounded-2xl p-7 bento-card border border-white/70 hover:border-brand/20 flex flex-col overflow-hidden group"
              style={{ opacity: 0 }}
            >
              {/* Large faded background icon */}
              <service.icon
                className="absolute -bottom-3 -right-3 w-28 h-28 text-brand/5 group-hover:text-brand/9 transition-colors duration-300"
                aria-hidden="true"
              />

              {/* Small icon badge */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 shadow-brand group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ${
                  service.accent === 'gold'
                    ? 'bg-gold-400 shadow-gold'
                    : 'bg-brand shadow-brand'
                }`}
              >
                <service.icon
                  aria-hidden="true"
                  className={`w-5 h-5 ${service.accent === 'gold' ? 'text-brand-900' : 'text-white'}`}
                />
              </div>

              <h3 className="text-sm font-bold text-foreground mb-2 leading-snug">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
