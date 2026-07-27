import { motion } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { Reveal } from "./Reveal";

export default function About() {
  const { content } = useContent();
  if (!content) return null;
  const a = content.about || {};
  const chapters = a.chapters || [];

  return (
    <section id="about" data-testid="about-section" className="bg-white py-24 md:py-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="max-w-4xl">
          <Reveal>
            <p className="overline text-gold mb-6">{a.overline}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              {a.heading}
            </h2>
          </Reveal>
        </div>

        <div className="mt-20 md:mt-28 space-y-24 md:space-y-40">
          {chapters.map((ch, i) => (
            <div
              key={ch.id}
              className={`grid md:grid-cols-2 gap-10 md:gap-20 items-center ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <Reveal y={60}>
                <div className="relative">
                  <span className="font-head text-gold/80 text-7xl md:text-8xl leading-none">{ch.number}</span>
                  <h3 className="font-head text-3xl md:text-4xl mt-4 leading-tight">{ch.title}</h3>
                  <p className="mt-6 text-neutral-600 text-base md:text-lg leading-relaxed max-w-md">{ch.body}</p>
                </div>
              </Reveal>
              <Reveal y={60} delay={0.1}>
                <div className="relative overflow-hidden rounded-sm aspect-[4/5]">
                  <motion.img
                    src={ch.image_url}
                    alt={ch.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    initial={{ scale: 1.15 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
