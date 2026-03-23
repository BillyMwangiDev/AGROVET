import { useEffect, useRef } from 'react';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Location() {
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        mapRef.current,
        { opacity: 0, x: '-10vw' },
        {
          opacity: 1,
          x: 0,
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
        infoRef.current,
        { opacity: 0, x: '10vw' },
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
          {/* Map Card */}
          <div
            ref={mapRef}
            className="relative h-[350px] sm:h-[450px] rounded-[28px] overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.1)]"
          >
            <img
              src="/images/location_map.jpg"
              alt="Location Map"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Location Pin Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-12 h-12 bg-[#E4B83A] rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 text-[#111915]" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#E4B83A]" />
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div ref={infoRef}>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-[3px] bg-[#E4B83A]" />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase text-[#6B7A72]">
                Visit the Shop
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111915] mb-6 leading-tight">
              Find us in Naromoru.
            </h2>

            {/* Details */}
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0B3A2C]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#0B3A2C]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111915]">Address</p>
                  <p className="text-[#6B7A72]">
                    Timberland Building, Naromoru Town<br />
                    (Near KFA), Nyeri County, Kenya
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0B3A2C]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#0B3A2C]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111915]">Opening Hours</p>
                  <p className="text-[#6B7A72]">Mon–Sat: 07:30–18:00</p>
                  <p className="text-[#6B7A72]">Sun: 08:00–13:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0B3A2C]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#0B3A2C]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111915]">Phone</p>
                  <p className="text-[#6B7A72]">Vet: +254 721 908 023</p>
                  <p className="text-[#6B7A72]">Shop: +254 726 476 128</p>
                  <p className="text-[#6B7A72]">WhatsApp: +254 740 368 581</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href="https://maps.google.com/?q=Naromoru+Kenya"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-[#0B3A2C] hover:bg-[#0d4534] text-white font-semibold px-8">
                <Navigation className="w-5 h-5 mr-2" />
                Get directions
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
