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
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/35" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120% 80% at 50% 40%, transparent 45%, rgba(0,0,0,0.45) 100%)" }} />

      <div className="relative z-10 h-full max-w-screen-2xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-28 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: easeLux }}
          className="flex items-center gap-4 mb-7"
        >
          <span className="h-px w-10 bg-gold/80" />
          <p className="overline text-gold">{h.overline}</p>
        </motion.div>

        <h1 className="font-head text-white font-medium tracking-[-0.02em] leading-[0.92] text-[3.25rem] sm:text-7xl lg:text-[7.8vw]">
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
          className="mt-8 max-w-lg text-white/75 text-base md:text-[1.075rem] leading-relaxed font-body font-light"
        >
          {h.subheading}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.9, ease: easeLux }}
          className="mt-11 flex flex-wrap gap-4"
        >
          <a
            data-testid="hero-call-btn"
            href={telHref(c.primary_phone)}
            className="btn-lux inline-flex items-center gap-2.5 rounded-full bg-gold px-9 py-4 text-white font-medium tracking-wide before:bg-white hover:!text-[color:var(--cn-ink)] shadow-lg shadow-black/20 hover:-translate-y-0.5"
          >
            <Phone size={18} /> {h.cta_call_label || "Call Us"}
          </a>
          <a
            data-testid="hero-whatsapp-btn"
            href={waHref(c.primary_whatsapp, "Hello CaterNation, I would like to know more about your catering services.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-lux inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-white/5 backdrop-blur-md px-9 py-4 text-white font-medium tracking-wide before:bg-white hover:!text-[color:var(--cn-ink)] hover:-translate-y-0.5"
          >
            <MessageCircle size={18} /> {h.cta_whatsapp_label || "WhatsApp"}
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <ArrowDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  );
}
