import { useContent } from "@/context/ContentContext";
import { telHref, waHref } from "@/lib/api";
import { Instagram, Phone, MessageCircle } from "lucide-react";

export default function Footer() {
  const { content } = useContent();
  if (!content) return null;
  const s = content.settings || {};
  const c = content.contact || {};

  return (
    <footer data-testid="site-footer" className="bg-[color:var(--cn-ink)] text-white">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <p className="font-head text-3xl">{s.brand_name}<span className="text-gold">.</span></p>
            <p className="mt-4 text-white/50 text-sm max-w-xs leading-relaxed">
              Luxury catering crafted in Amritsar for life&rsquo;s most treasured celebrations.
            </p>
          </div>
          <div className="text-sm text-white/60 space-y-2">
            <p className="text-white/40 uppercase tracking-widest text-xs mb-4">Visit</p>
            <p>{c.address}</p>
            <p>{c.city}</p>
            <p className="pt-2">{c.hours}</p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-white/40 uppercase tracking-widest text-xs">Reach us</p>
            <a href={telHref(c.primary_phone)} className="inline-flex items-center gap-2 hover:text-gold transition-colors"><Phone size={16} /> {c.primary_phone}</a>
            <a href={waHref(c.primary_whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gold transition-colors"><MessageCircle size={16} /> WhatsApp</a>
            {s.instagram_url && (
              <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gold transition-colors"><Instagram size={16} /> Instagram</a>
            )}
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} {s.brand_name}. All rights reserved.</p>
          <a href="/admin/login" data-testid="footer-admin-link" className="hover:text-white/70 transition-colors">Admin</a>
        </div>
      </div>
    </footer>
  );
}
