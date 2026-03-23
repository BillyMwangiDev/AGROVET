import Navigation from '@/sections/Navigation';
import Hero from '@/sections/Hero';
import Services from '@/sections/Services';
import Products from '@/sections/Products';
import WhyChooseUs from '@/sections/WhyChooseUs';
import FeaturedStory from '@/sections/FeaturedStory';
import AIBreeding from '@/sections/AIBreeding';
import SeasonalAdvisory from '@/sections/SeasonalAdvisory';
import Testimonial from '@/sections/Testimonial';
import CTABanner from '@/sections/CTABanner';
import Location from '@/sections/Location';
import Contact from '@/sections/Contact';
import Footer from '@/sections/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <title>Nicmah Agrovet – Livestock Feeds, AI Semen &amp; Agro Supplies | Naromoru</title>
      <meta name="description" content="Nicmah Agrovet in Naromoru, Nyeri County — premium livestock feeds, AI semen (Friesian, Jersey, Holstein), veterinary medicines, crop solutions, and expert farming guidance. Over 20 years walking the farming journey with you." />
      <Navigation />
      <main id="main-content">
        <Hero />
        <Services />
        <Products />
        <WhyChooseUs />
        <FeaturedStory />
        <AIBreeding />
        <SeasonalAdvisory />
        <Testimonial />
        <CTABanner />
        <Location />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
