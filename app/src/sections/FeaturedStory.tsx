import { useEffect, useRef } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  'Vaccines, dewormers & acaricides for healthy herds',
  'Quality seeds, foliar fertilizers & crop pest solutions',
  'Supporting thousands of farmers across our region',
];

export default function FeaturedStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bulletsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image animation
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

      // Content animation
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

      // Bullets stagger
      bulletsRef.current.forEach((bullet, index) => {
        if (bullet) {
          gsap.fromTo(
            bullet,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: 0.3 + index * 0.1,
              ease: 'power2.out',
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
    <section ref={sectionRef} className="w-full py-20 lg:py-28 bg-[#F6F7F6]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Card */}
          <div
            ref={imageRef}
            className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-[28px] overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.1)]"
          >
            <img
              src="/images/featured_produce_basket.jpg"
              alt="Fresh produce basket"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Content Card */}
          <div ref={contentRef} className="lg:pl-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-[3px] bg-[#E4B83A]" />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase text-[#6B7A72]">
                Our Mission
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111915] mb-6 leading-tight">
              More than a shop — your farming partner.
            </h2>

            {/* Body */}
            <p className="text-lg text-[#6B7A72] mb-8 leading-relaxed">
              For over two decades, Nicmah Agrovet has helped thousands of
              livestock and crop farmers achieve their goals. We offer solutions
              to animal diseases, nutrition, breeding and crop production —
              educating farmers and ensuring the prosperity of their journey.
            </p>

            {/* Benefits List */}
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <li
                  key={benefit}
                  ref={(el) => { bulletsRef.current[index] = el; }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 bg-[#0B3A2C] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#111915] font-medium">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              variant="outline"
              className="border-[#0B3A2C] text-[#0B3A2C] hover:bg-[#0B3A2C] hover:text-white font-semibold px-6"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get in touch
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
