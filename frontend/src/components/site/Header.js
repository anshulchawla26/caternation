import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Instagram, Phone, MessageCircle } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { telHref, waHref } from "@/lib/api";

const NAV = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "dishes", label: "Signature Dishes" },
  { id: "counters", label: "Live Counters" },
  { id: "gallery", label: "Gallery" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const { content } = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!content) return null;
  const s = content.settings || {};
  const contact = content.contact || {};
  const visible = new Set((content.sections || []).filter((x) => x.visible).map((x) => x.id));
  const links = NAV.filter((n) => n.id === "contact" || visible.has(n.id));

  const go = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <motion.header
        data-testid="site-header"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
          scrolled ? "bg-white/75 backdrop-blur-2xl border-b border-black/5 shadow-[0_1px_30px_-15px_rgba(0,0,0,0.25)]" : "bg-gradient-to-b from-black/25 to-transparent"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <button
            data-testid="logo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`font-head text-2xl tracking-tight transition-all duration-300 hover:opacity-70 ${
              scrolled ? "text-[color:var(--cn-ink)]" : "text-white"
            }`}
          >
            {s.logo_url ? (
              <img src={s.logo_url} alt={s.brand_name} className="h-9" />
            ) : (
              <span>
                {s.logo_text || s.brand_name}
                <span className="text-gold">.</span>
              </span>
            )}
          </button>

          <nav className="hidden lg:flex items-center gap-9">
            {links.map((l) => (
              <button
                key={l.id}
                data-testid={`nav-${l.id}`}
                onClick={() => go(l.id)}
                className={`nav-link text-[13px] tracking-[0.02em] transition-colors duration-300 hover:text-gold ${
                  scrolled ? "text-neutral-700" : "text-white/85"
                }`}
              >
                {l.label}
              </button>
            ))}
            {s.instagram_url && (
              <a
                data-testid="nav-instagram"
                href={s.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors duration-300 hover:text-gold hover:scale-110 ${scrolled ? "text-neutral-700" : "text-white/85"}`}
              >
                <Instagram size={18} />
              </a>
            )}
            <a
              data-testid="nav-call"
              href={telHref(contact.primary_phone)}
              className="btn-lux inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-[13px] font-medium tracking-wide text-white before:bg-[color:var(--cn-ink)] hover:text-white hover:shadow-lg hover:shadow-black/10"
            >
              <Phone size={14} /> Call
            </a>
          </nav>

          <button
            data-testid="mobile-menu-btn"
            onClick={() => setOpen(true)}
            className={`lg:hidden ${scrolled ? "text-[color:var(--cn-ink)]" : "text-white"}`}
            aria-label="Open menu"
          >
            <Menu size={26} />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[color:var(--cn-ink)] text-white flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-20">
              <span className="font-head text-2xl">
                {s.brand_name}
                <span className="text-gold">.</span>
              </span>
              <button data-testid="mobile-close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-2 px-8">
              {links.map((l, i) => (
                <motion.button
                  key={l.id}
                  data-testid={`mobile-nav-${l.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => go(l.id)}
                  className="font-head text-4xl text-left py-2 hover:text-gold transition-colors"
                >
                  {l.label}
                </motion.button>
              ))}
            </div>
            <div className="p-6 flex gap-3">
              <a href={telHref(contact.primary_phone)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold py-3 font-medium">
                <Phone size={16} /> Call
              </a>
              <a href={waHref(contact.primary_whatsapp)} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/40 py-3 font-medium">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
