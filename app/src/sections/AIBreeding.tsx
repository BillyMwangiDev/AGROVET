import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '254740368581';

const features = [
  'Local & international semen',
  'Hardy, resistant breeds',
  'Improved milk & meat yield',
];

export default function AIBreeding() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image animation
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: '12vw', scale: 0.98 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Content animation
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: '-10vw' },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Chips pop-in
      chipsRef.current.forEach((chip, index) => {
        if (chip) {
          gsap.fromTo(
            chip,
            { opacity: 0, scale: 0.92 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.4,
              delay: 0.4 + index * 0.06,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="ai-breeding"
      ref={sectionRef}
      className="w-full py-20 lg:py-28 bg-[#F6F7F6]"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Card */}
          <div ref={contentRef} className="order-2 lg:order-1">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-[3px] bg-[#E4B83A]" />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase text-[#6B7A72]">
                Artificial Insemination
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111915] mb-6 leading-tight">
              Quality genetics,
              <br />
              stronger herds.
            </h2>

            {/* Body */}
            <p className="text-lg text-[#6B7A72] mb-8 leading-relaxed">
              Our AI team has administered semen to thousands of cattle across
              the region, sourcing the best genetics from local and international
              breeders. The result: hardy, disease-resistant breeds with
              increased milk and meat production for our farmers.
            </p>

            {/* Feature Chips */}
            <div className="flex flex-wrap gap-3 mb-8">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  ref={(el) => { chipsRef.current[index] = el; }}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm"
                >
                  <Check className="w-4 h-4 text-[#0B3A2C]" />
                  <span className="text-sm font-medium text-[#111915]">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}?text=Hello%2C%20I%20would%20like%20to%20book%20AI%20services`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-[#0B3A2C] hover:bg-[#0d4534] text-white font-semibold px-8">
                Book a service
              </Button>
            </a>
          </div>

          {/* Image Card */}
          <div
            ref={imageRef}
            className="order-1 lg:order-2 relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-[28px] overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.1)]"
          >
            <img
              src="/images/product_ai_cow.jpg"
              alt="AI Breeding Services"
              className="w-full h-full object-cover"
            />
            {/* Overlay with stats */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-[#0B3A2C]">1000s</p>
                  <p className="text-xs text-[#6B7A72]">Cattle Served</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0B3A2C]">20+</p>
                  <p className="text-xs text-[#6B7A72]">Years of AI</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0B3A2C]">Intl</p>
                  <p className="text-xs text-[#6B7A72]">Genetics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
