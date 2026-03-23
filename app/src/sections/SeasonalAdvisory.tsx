import { useEffect, useRef } from 'react';
import { Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const tips = [
  'Soil prep checklist',
  'Fertilizer timing',
  'Pest early warning',
];

export default function SeasonalAdvisory() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: '-12vw', scale: 0.97 },
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

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: '12vw' },
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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-20 lg:py-28 bg-[#F6F7F6]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Card */}
          <div
            ref={imageRef}
            className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-[28px] overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.1)]"
          >
            <img
              src="/images/seasonal_planting.jpg"
              alt="Seasonal Planting"
              className="w-full h-full object-cover"
            />
            {/* Season Badge */}
            <div className="absolute top-6 left-6 bg-[#E4B83A] text-[#111915] px-4 py-2 rounded-full font-semibold text-sm">
              Short Rains Season
            </div>
          </div>

          {/* Content Card */}
          <div ref={contentRef} className="lg:pl-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-[3px] bg-[#E4B83A]" />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase text-[#6B7A72]">
                Seasonal Advisory
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111915] mb-6 leading-tight">
              What to plant now.
            </h2>

            {/* Body */}
            <p className="text-lg text-[#6B7A72] mb-8 leading-relaxed">
              Short rains are here. Our top picks: fast-maturing maize,
              drought-tolerant beans, and leafy vegetables with strong market
              demand.
            </p>

            {/* Tips List */}
            <ul className="space-y-4 mb-8">
              {tips.map((tip) => (
                <li key={tip} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#0B3A2C] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#111915] font-medium">{tip}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              variant="outline"
              className="border-[#0B3A2C] text-[#0B3A2C] hover:bg-[#0B3A2C] hover:text-white font-semibold px-6"
            >
              <Download className="w-5 h-5 mr-2" />
              Download planting calendar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
