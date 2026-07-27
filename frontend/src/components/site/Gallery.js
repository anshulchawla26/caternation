import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { Reveal } from "./Reveal";

export default function Gallery() {
  const { content } = useContent();
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState(null); // index within filtered

  const g = content?.gallery || {};
  const categories = g.categories || ["All"];
  const columns = g.columns || 3;
  const items = useMemo(() => g.items || [], [g.items]);

  const filtered = useMemo(
    () => (active === "All" ? items : items.filter((x) => x.category === active)),
    [active, items]
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((p) => (p + 1) % filtered.length);
      if (e.key === "ArrowLeft") setLightbox((p) => (p - 1 + filtered.length) % filtered.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, filtered.length]);

  if (!content) return null;
  const colClass = { 2: "sm:columns-2", 3: "sm:columns-2 lg:columns-3", 4: "sm:columns-2 lg:columns-4" }[columns] || "sm:columns-2 lg:columns-3";

  return (
    <section id="gallery" data-testid="gallery-section" className="bg-white py-24 md:py-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl mb-12 md:mb-16">
          <Reveal>
            <p className="overline text-gold mb-6">{g.overline}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">{g.heading}</h2>
          </Reveal>
        </div>

        <div data-testid="gallery-filters" className="flex flex-wrap gap-2 md:gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid={`gallery-filter-${cat}`}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full text-sm tracking-wide border transition-all duration-300 ${
                active === cat
                  ? "bg-[color:var(--cn-ink)] text-white border-transparent"
                  : "bg-transparent text-neutral-600 border-black/15 hover:border-gold hover:text-gold"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div layout className={`columns-1 ${colClass} gap-4 md:gap-6 [column-fill:_balance]`}>
          <AnimatePresence>
            {filtered.map((it, idx) => (
              <motion.figure
                key={it.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                data-testid={`gallery-item-${it.id}`}
                onClick={() => setLightbox(idx)}
                className="group mb-4 md:mb-6 break-inside-avoid overflow-hidden rounded-sm cursor-pointer relative"
              >
                <img
                  src={it.image_url}
                  alt={it.caption || "Gallery"}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500 flex items-end p-5">
                  <figcaption className="text-white text-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    {it.caption}
                  </figcaption>
                </div>
              </motion.figure>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {lightbox !== null && filtered[lightbox] && (
          <motion.div
            data-testid="gallery-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button data-testid="lightbox-close" className="absolute top-5 right-5 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
              <X size={30} />
            </button>
            <button
              data-testid="lightbox-prev"
              className="absolute left-4 md:left-8 text-white/70 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p - 1 + filtered.length) % filtered.length); }}
            >
              <ChevronLeft size={40} />
            </button>
            <motion.img
              key={filtered[lightbox].id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              src={filtered[lightbox].image_url}
              alt={filtered[lightbox].caption || "Gallery"}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              data-testid="lightbox-next"
              className="absolute right-4 md:right-8 text-white/70 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p + 1) % filtered.length); }}
            >
              <ChevronRight size={40} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
