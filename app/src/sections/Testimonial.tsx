import { useEffect, useRef } from 'react';
import { Quote } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Testimonial() {
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        quoteRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
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
        authorRef.current,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
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
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Decorative Quote Mark */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-[0.06]">
            <Quote className="w-32 h-32 text-[#0B3A2C]" />
          </div>

          {/* Quote */}
          <div ref={quoteRef} className="relative z-10">
            <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#111915] leading-relaxed mb-10">
              "Nicmah doesn't just supply—they follow up. When we switched feeds,
              they visited, checked growth, and adjusted the ration. That's
              partnership."
            </blockquote>
          </div>

          {/* Author */}
          <div ref={authorRef} className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src="/images/testimonial_customer.jpg"
                alt="Grace Muthoni"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#111915]">Grace Muthoni</p>
              <p className="text-sm text-[#6B7A72]">
                Poultry Farmer, Nanyuki
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
