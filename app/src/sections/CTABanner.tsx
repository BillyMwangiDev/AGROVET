import { useEffect, useRef } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '254740368581';

export default function CTABanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const buttons = buttonsRef.current?.children;
      if (buttons) {
        gsap.fromTo(
          buttons,
          { opacity: 0, scale: 0.96 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full py-16 lg:py-24 bg-[#0B3A2C]"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div ref={contentRef}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Ready to grow?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Order feeds, book an AI service, or ask about your animals — our vet team and shop are here for you.
            </p>
          </div>

          <div ref={buttonsRef} className="flex flex-wrap justify-center gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-[#E4B83A] hover:bg-[#d4a82a] text-[#111915] font-semibold px-8 py-6 text-base">
                <MessageCircle className="w-5 h-5 mr-2" />
                Order on WhatsApp
              </Button>
            </a>
            <a href="tel:+254726476128">
              <Button
                variant="outline"
                className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-[#0B3A2C] font-semibold px-8 py-6 text-base"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call the shop
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
