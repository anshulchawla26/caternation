import { motion } from "framer-motion";
import { Phone, MessageCircle } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { telHref, waHref } from "@/lib/api";

export default function FloatingButtons() {
  const { content } = useContent();
  if (!content) return null;
  const c = content.contact || {};

  return (
    <motion.div
      data-testid="floating-buttons"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.8 }}
      className="fixed z-50 bottom-5 right-4 md:bottom-8 md:right-8 flex flex-col sm:flex-row gap-3"
    >
      <a
        data-testid="floating-call-btn"
        href={telHref(c.primary_phone)}
        className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--cn-ink)] text-white pl-4 pr-5 py-3 shadow-xl shadow-black/20 hover:bg-gold transition-colors duration-300"
      >
        <Phone size={18} className="shrink-0" />
        <span className="text-sm font-medium tracking-wide">Call</span>
      </a>
      <a
        data-testid="floating-whatsapp-btn"
        href={waHref(c.primary_whatsapp, "Hello CaterNation, I would like to know more about your catering services.")}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white pl-4 pr-5 py-3 shadow-xl shadow-black/20 hover:brightness-105 transition-all duration-300"
      >
        <MessageCircle size={18} className="shrink-0" />
        <span className="text-sm font-medium tracking-wide">WhatsApp</span>
      </a>
    </motion.div>
  );
}
