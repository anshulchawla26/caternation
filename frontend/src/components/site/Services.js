import { useContent } from "@/context/ContentContext";
import { Reveal } from "./Reveal";
import { ArrowUpRight } from "lucide-react";

export default function Services() {
  const { content } = useContent();
  if (!content) return null;
  const s = content.services || {};
  const items = s.items || [];

  return (
    <section id="services" data-testid="services-section" className="bg-beige py-24 md:py-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-24">
          <div className="max-w-2xl">
            <Reveal>
              <p className="overline text-gold mb-6">{s.overline}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">{s.heading}</h2>
            </Reveal>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((it, i) => (
            <Reveal key={it.id} delay={(i % 3) * 0.08} y={50}>
              <article data-testid={`service-card-${it.id}`} className="lux-card group relative overflow-hidden rounded-md bg-white shadow-[0_10px_40px_-20px_rgba(0,0,0,0.25)]">
                <div className="relative overflow-hidden aspect-[4/5]">
                  <img
                    src={it.image_url}
                    alt={it.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <ArrowUpRight
                    size={22}
                    className="absolute top-5 right-5 text-white opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
                  />
                  <div className="absolute bottom-0 left-0 p-6 md:p-7">
                    <h3 className="font-head text-2xl md:text-[1.7rem] text-white leading-tight">{it.title}</h3>
                    <p className="mt-2 text-white/80 text-sm max-w-xs">{it.description}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
