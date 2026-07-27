import { useContent } from "@/context/ContentContext";

export default function Marquee() {
  const { content } = useContent();
  if (!content) return null;
  const words = content.marquee?.words || [];
  if (!words.length) return null;
  const loop = [...words, ...words];

  return (
    <section data-testid="marquee-section" className="bg-beige py-10 md:py-14 overflow-hidden border-y border-black/5">
      <div className="cn-marquee-track">
        {loop.map((w, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="font-head italic text-3xl md:text-5xl text-[color:var(--cn-ink)] px-10 md:px-16">
              {w}
            </span>
            <span className="text-gold text-2xl md:text-4xl">&#10022;</span>
          </span>
        ))}
      </div>
    </section>
  );
}
