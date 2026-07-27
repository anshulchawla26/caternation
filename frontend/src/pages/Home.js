import { useEffect } from "react";
import Lenis from "lenis";
import { useContent } from "@/context/ContentContext";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import About from "@/components/site/About";
import Services from "@/components/site/Services";
import SignatureDishes from "@/components/site/SignatureDishes";
import LiveCounters from "@/components/site/LiveCounters";
import Gallery from "@/components/site/Gallery";
import Testimonials from "@/components/site/Testimonials";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";
import FloatingButtons from "@/components/site/FloatingButtons";
import SiteHead from "@/components/site/SiteHead";

const MAP = {
  hero: Hero,
  marquee: Marquee,
  about: About,
  services: Services,
  dishes: SignatureDishes,
  counters: LiveCounters,
  gallery: Gallery,
  testimonials: Testimonials,
  contact: Contact,
};

export default function Home() {
  const { content, loading } = useContent();

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  if (loading || !content) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <p className="font-head text-3xl animate-pulse">CaterNation<span className="text-gold">.</span></p>
      </div>
    );
  }

  const sections = (content.sections || []).filter((x) => x.visible);

  return (
    <div className="relative bg-white overflow-x-hidden">
      <SiteHead />
      <Header />
      <main>
        {sections.map((sec) => {
          const Comp = MAP[sec.id];
          return Comp ? <Comp key={sec.id} /> : null;
        })}
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
