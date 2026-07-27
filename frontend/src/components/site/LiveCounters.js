import { useContent } from "@/context/ContentContext";
import { Reveal } from "./Reveal";

export default function LiveCounters() {
  const { content } = useContent();
  if (!content) return null;
  const lc = content.counters || {};
  const items = lc.items || [];

  return (
    <section id="counters" data-testid="counters-section" className="bg-[color:var(--cn-ink)] text-white py-24 md:py-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl mb-16 md:mb-24">
          <Reveal>
            <p className="overline text-gold mb-6">{lc.overline}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-white">{lc.heading}</h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {items.map((it, i) => (
            <Reveal key={it.id} delay={i * 0.1} y={50}>
              <article data-testid={`counter-${it.id}`} className="group">
                <div className="relative overflow-hidden rounded-sm aspect-[3/4]">
                  <img
                    src={it.image_url}
                    alt={it.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="mt-6 flex items-baseline gap-4 border-t border-white/15 pt-5">
                  <span className="font-head text-gold text-lg">0{i + 1}</span>
                  <div>
                    <h3 className="font-head text-2xl leading-tight">{it.title}</h3>
                    <p className="mt-2 text-white/60 text-sm leading-relaxed">{it.description}</p>
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
