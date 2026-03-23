import { useEffect, useRef } from 'react';
import { Shield, Truck, Users } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  {
    icon: Shield,
    title: 'Over Two Decades of Trust',
    description:
      'Since our founding, we have been the go-to partner for farmers across the Naromoru region — sourcing certified products and delivering proven results season after season.',
  },
  {
    icon: Truck,
    title: 'Local & International Genetics',
    description:
      'We source top-quality semen from both local and international breeders, bringing the best genetics to your herd to improve milk production, meat yield and disease resistance.',
  },
  {
    icon: Users,
    title: 'We Walk with Farmers',
    description:
      'We don\'t just sell products — we walk the farming journey alongside you. Our vet and AI team educates and supports farmers to ensure lasting prosperity.',
  },
];

export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(
            card,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay: index * 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );

          // Icon rotation
          const icon = card.querySelector('.icon-wrapper');
          if (icon) {
            gsap.fromTo(
              icon,
              { rotate: -8 },
              {
                rotate: 0,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-20 lg:py-28 bg-[#F6F7F6]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-[3px] bg-[#E4B83A]" />
            <span className="text-xs font-semibold tracking-[0.14em] uppercase text-[#6B7A72]">
              Why Nicmah
            </span>
            <div className="w-12 h-[3px] bg-[#E4B83A]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111915] leading-tight">
            Built for farmers.
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="group bg-white rounded-[28px] p-8 border border-gray-100 shadow-[0_18px_50px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Icon */}
              <div className="icon-wrapper w-14 h-14 bg-[#0B3A2C]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#0B3A2C] transition-colors duration-300">
                <benefit.icon className="w-7 h-7 text-[#0B3A2C] group-hover:text-white transition-colors duration-300" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-[#111915] mb-3">
                {benefit.title}
              </h3>
              <p className="text-[#6B7A72] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
