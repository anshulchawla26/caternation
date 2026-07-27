import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Phone, MessageCircle, ArrowDown } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { telHref, waHref } from "@/lib/api";
import { MaskLine, easeLux } from "./Reveal";

export default function Hero() {
  const { content } = useContent();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const overlay = useTransform(scrollYProgress, [0, 1], [0.45, 0.75]);

  if (!content) return null;
  const h = content.hero || {};
  const c = content.contact || {};
  const lines = h.heading_lines || ["The Art of", "Fine Catering"];

  return (
    <section id="home" ref={ref} data-testid="hero-section" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-black">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img src={h.image_url} alt="CaterNation signature plating" className="h-full w-full object-cover" />
      </motion.div>
      <motion.div style={{ opacity: overlay }} className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      <div className="relative z-10 h-full max-w-screen-2xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-24 md:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: easeLux }}
          className="overline text-gold mb-6"
        >
          {h.overline}
        </motion.p>

        <h1 className="font-head text-white font-medium tracking-tight leading-[0.95] text-5xl sm:text-7xl lg:text-[7.5vw]">
          {lines.map((line, i) => (
            <MaskLine key={i} delay={0.5 + i * 0.18}>
              {line}
            </MaskLine>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.9, ease: easeLux }}
          className="mt-8 max-w-xl text-white/80 text-base md:text-lg leading-relaxed font-body"
        >
          {h.subheading}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.9, ease: easeLux }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <a
            data-testid="hero-call-btn"
            href={telHref(c.primary_phone)}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-white font-medium tracking-wide hover:opacity-90 transition-opacity"
          >
            <Phone size={18} /> {h.cta_call_label || "Call Us"}
          </a>
          <a
            data-testid="hero-whatsapp-btn"
            href={waHref(c.primary_whatsapp, "Hello CaterNation, I would like to know more about your catering services.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/50 px-8 py-4 text-white font-medium tracking-wide hover:bg-white hover:text-black transition-colors duration-300"
          >
            <MessageCircle size={18} /> {h.cta_whatsapp_label || "WhatsApp"}
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/70"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ArrowDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  );
}
