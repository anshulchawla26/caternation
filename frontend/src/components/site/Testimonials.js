import { useContent } from "@/context/ContentContext";
import { Reveal } from "./Reveal";
import { Quote } from "lucide-react";

export default function Testimonials() {
  const { content } = useContent();
  if (!content) return null;
  const t = content.testimonials || {};
  const items = t.items || [];

  return (
    <section id="testimonials" data-testid="testimonials-section" className="bg-beige py-24 md:py-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <Reveal>
            <p className="overline text-gold mb-6">{t.overline}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">{t.heading}</h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {items.map((it, i) => (
            <Reveal key={it.id} delay={i * 0.1} y={50}>
              <figure data-testid={`testimonial-${it.id}`} className="h-full bg-white rounded-sm p-8 md:p-10 border border-black/5 flex flex-col">
                <Quote size={30} className="text-gold mb-6" />
                <blockquote className="font-head text-xl md:text-[1.4rem] leading-relaxed text-neutral-800 flex-1">
                  &ldquo;{it.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8 pt-6 border-t border-black/5">
                  <p className="font-medium text-[color:var(--cn-ink)]">{it.name}</p>
                  <p className="text-sm text-neutral-500 mt-1">{it.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
