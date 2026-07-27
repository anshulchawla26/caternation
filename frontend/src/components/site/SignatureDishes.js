import { motion } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { Reveal } from "./Reveal";

export default function SignatureDishes() {
  const { content } = useContent();
  if (!content) return null;
  const d = content.dishes || {};
  const items = d.items || [];

  return (
    <section id="dishes" data-testid="dishes-section" className="bg-white py-24 md:py-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-20 md:mb-28">
          <Reveal>
            <p className="overline text-gold mb-6">{d.overline}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">{d.heading}</h2>
          </Reveal>
        </div>

        <div className="space-y-24 md:space-y-36">
          {items.map((it, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={it.id} data-testid={`dish-${it.id}`} className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
                <Reveal y={60} className={`md:col-span-7 ${flip ? "md:order-2" : ""}`}>
                  <div className="relative overflow-hidden rounded-sm aspect-[16/11]">
                    <motion.img
                      src={it.image_url}
                      alt={it.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      initial={{ scale: 1.15 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </Reveal>
                <Reveal y={40} delay={0.1} className={`md:col-span-5 ${flip ? "md:order-1 md:text-right" : ""}`}>
                  <span className="font-head text-gold text-xl">0{i + 1}</span>
                  <h3 className="font-head text-3xl md:text-5xl mt-3 leading-tight">{it.title}</h3>
                  <p className={`mt-5 text-neutral-600 text-base md:text-lg leading-relaxed ${flip ? "md:ml-auto" : ""} max-w-md`}>
                    {it.description}
                  </p>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
