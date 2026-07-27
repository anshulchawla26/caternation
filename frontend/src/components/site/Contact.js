import { useContent } from "@/context/ContentContext";
import { Reveal } from "./Reveal";
import { telHref, waHref } from "@/lib/api";
import { Phone, MessageCircle, MapPin, Clock, Instagram } from "lucide-react";

export default function Contact() {
  const { content } = useContent();
  if (!content) return null;
  const c = content.contact || {};
  const s = content.settings || {};
  const owners = c.owners || [];

  return (
    <section id="contact" data-testid="contact-section" className="bg-white py-24 md:py-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl mb-16 md:mb-20">
          <Reveal>
            <p className="overline text-gold mb-6">Get in Touch</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-head text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Let&rsquo;s plan something unforgettable.
            </h2>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: owners + info */}
          <div>
            <div className="grid sm:grid-cols-2 gap-6">
              {owners.map((o) => (
                <Reveal key={o.id} y={40}>
                  <div data-testid={`owner-card-${o.id}`} className="bg-beige rounded-sm p-7 border border-black/5 h-full">
                    <p className="overline text-gold mb-4">{o.role}</p>
                    <h3 className="font-head text-2xl">{o.name}</h3>
                    <div className="mt-6 flex flex-col gap-3">
                      <a href={telHref(o.phone)} data-testid={`owner-call-${o.id}`} className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-gold transition-colors">
                        <Phone size={16} className="text-gold" /> {o.phone}
                      </a>
                      <a href={waHref(o.phone, `Hello ${o.name}, I would like to enquire about CaterNation.`)} target="_blank" rel="noopener noreferrer" data-testid={`owner-whatsapp-${o.id}`} className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-gold transition-colors">
                        <MessageCircle size={16} className="text-gold" /> WhatsApp
                      </a>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal y={40} delay={0.1}>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <MapPin size={20} className="text-gold shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Visit us</p>
                    <p className="text-neutral-600 text-sm mt-1 leading-relaxed">{c.address}<br />{c.city}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock size={20} className="text-gold shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Business hours</p>
                    <p className="text-neutral-600 text-sm mt-1">{c.hours}</p>
                  </div>
                </div>
                {s.instagram_url && (
                  <a data-testid="contact-instagram" href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-sm hover:text-gold transition-colors">
                    <Instagram size={20} className="text-gold" /> Follow us on Instagram
                  </a>
                )}
              </div>
            </Reveal>
          </div>

          {/* Right: map */}
          <Reveal y={40} delay={0.1}>
            <div className="relative h-[420px] lg:h-full min-h-[420px] rounded-sm overflow-hidden border border-black/5">
              <iframe
                data-testid="contact-map"
                title="CaterNation location"
                src={c.map_embed_url}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
