import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  LogOut, Save, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink,
  Palette, Phone, Image as ImageIcon, Type, Layers, GripVertical,
} from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- small field helpers ---------- */
const Field = ({ label, value, onChange, placeholder, testid }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-neutral-500">{label}</Label>
    <Input data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const AreaField = ({ label, value, onChange, testid }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-neutral-500">{label}</Label>
    <Textarea data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} />
  </div>
);

const ImageField = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-neutral-500">{label}</Label>
    <div className="flex gap-3">
      {value ? <img src={value} alt="" className="h-16 w-16 rounded object-cover border" /> : <div className="h-16 w-16 rounded bg-neutral-100 border grid place-items-center text-neutral-300"><ImageIcon size={20} /></div>}
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://image-url" className="flex-1" />
    </div>
  </div>
);

const StringList = ({ label, items, onChange }) => (
  <div className="space-y-2">
    <Label className="text-xs text-neutral-500">{label}</Label>
    {(items || []).map((s, i) => (
      <div key={i} className="flex gap-2">
        <Input value={s} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} />
        <Button variant="outline" size="icon" onClick={() => onChange(items.filter((_, x) => x !== i))}><Trash2 size={15} /></Button>
      </div>
    ))}
    <Button variant="outline" size="sm" onClick={() => onChange([...(items || []), ""])}><Plus size={14} className="mr-1" /> Add</Button>
  </div>
);

const CardBlock = ({ children, onRemove, onUp, onDown }) => (
  <div className="rounded-lg border bg-white p-4 space-y-3 relative">
    <div className="absolute top-3 right-3 flex gap-1">
      {onUp && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUp}><ArrowUp size={14} /></Button>}
      {onDown && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDown}><ArrowDown size={14} /></Button>}
      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={onRemove}><Trash2 size={14} /></Button>
    </div>
    {children}
  </div>
);

/* generic list editor for {title, description, image_url} */
const MediaItems = ({ items, onChange, testidPrefix }) => {
  const upd = (i, key, val) => { const n = [...items]; n[i] = { ...n[i], [key]: val }; onChange(n); };
  const move = (i, d) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <CardBlock key={it.id} onRemove={() => onChange(items.filter((_, x) => x !== i))} onUp={() => move(i, -1)} onDown={() => move(i, 1)}>
          <Field label="Title" value={it.title} onChange={(v) => upd(i, "title", v)} testid={`${testidPrefix}-title-${i}`} />
          <AreaField label="Description" value={it.description} onChange={(v) => upd(i, "description", v)} />
          <ImageField label="Image URL" value={it.image_url} onChange={(v) => upd(i, "image_url", v)} />
        </CardBlock>
      ))}
      <Button variant="outline" onClick={() => onChange([...items, { id: uid(), title: "New item", description: "", image_url: "" }])}><Plus size={15} className="mr-1" /> Add</Button>
    </div>
  );
};

const TABS = [
  { id: "brand", label: "Brand & Style", icon: Palette },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "hero", label: "Hero", icon: ImageIcon },
  { id: "marquee", label: "Marquee", icon: Type },
  { id: "about", label: "About", icon: Type },
  { id: "services", label: "Services", icon: Layers },
  { id: "dishes", label: "Signature Dishes", icon: Layers },
  { id: "counters", label: "Live Counters", icon: Layers },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "testimonials", label: "Testimonials", icon: Type },
  { id: "sections", label: "Sections & Order", icon: GripVertical },
];

export default function AdminDashboard() {
  const { user, ready, logout } = useAuth();
  const { content, refetch } = useContent();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState("brand");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate("/admin/login");
  }, [ready, user, navigate]);

  useEffect(() => {
    if (content && !draft) setDraft(structuredClone(content));
  }, [content, draft]);

  if (!draft) return <div className="min-h-screen grid place-items-center text-neutral-400">Loading studio…</div>;

  const set = (path, value) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/content", { content: draft });
      await refetch();
      toast.success("Changes published successfully");
    } catch (e) {
      toast.error("Failed to save. " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm("Reset all content to defaults? This cannot be undone.")) return;
    const { data } = await api.post("/content/reset");
    setDraft(structuredClone(data.content));
    await refetch();
    toast.success("Content reset to defaults");
  };

  const s = draft.settings;
  const c = draft.contact;

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col fixed inset-y-0">
        <div className="p-5 border-b">
          <p className="font-head text-2xl">CaterNation<span className="text-gold">.</span></p>
          <p className="text-xs text-neutral-400 mt-0.5">Content Studio</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${tab === t.id ? "bg-[color:var(--cn-ink)] text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 px-3 py-2"><ExternalLink size={15} /> View site</a>
          <Button variant="ghost" onClick={() => { logout(); navigate("/admin/login"); }} className="w-full justify-start text-neutral-600" data-testid="logout-btn"><LogOut size={15} className="mr-2" /> Logout</Button>
        </div>
      </aside>

      {/* main */}
      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-8 py-4 flex items-center justify-between">
          <h1 className="font-medium text-lg">{TABS.find((t) => t.id === tab)?.label}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} data-testid="reset-btn"><RotateCcw size={15} className="mr-1.5" /> Reset</Button>
            <Button onClick={save} disabled={saving} data-testid="save-btn" className="bg-gold hover:opacity-90 text-white">
              <Save size={15} className="mr-1.5" /> {saving ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-3xl space-y-5">
          {tab === "brand" && (
            <>
              <Field label="Brand name" value={s.brand_name} onChange={(v) => set(["settings", "brand_name"], v)} testid="brand-name" />
              <Field label="Logo text" value={s.logo_text} onChange={(v) => set(["settings", "logo_text"], v)} />
              <ImageField label="Logo image URL (optional)" value={s.logo_url} onChange={(v) => set(["settings", "logo_url"], v)} />
              <Field label="Instagram URL" value={s.instagram_url} onChange={(v) => set(["settings", "instagram_url"], v)} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[["background", "Background"], ["beige", "Beige sections"], ["text", "Text"], ["gold", "Gold accent"]].map(([k, lbl]) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="text-xs text-neutral-500">{lbl}</Label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={s.colors?.[k] || "#000000"} onChange={(e) => set(["settings", "colors", k], e.target.value)} className="h-9 w-12 rounded border" />
                      <Input value={s.colors?.[k] || ""} onChange={(e) => set(["settings", "colors", k], e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Heading font" value={s.fonts?.heading} onChange={(v) => set(["settings", "fonts", "heading"], v)} />
                <Field label="Body font" value={s.fonts?.body} onChange={(v) => set(["settings", "fonts", "body"], v)} />
              </div>
            </>
          )}

          {tab === "contact" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary phone (floating Call)" value={c.primary_phone} onChange={(v) => set(["contact", "primary_phone"], v)} testid="contact-phone" />
                <Field label="Primary WhatsApp" value={c.primary_whatsapp} onChange={(v) => set(["contact", "primary_whatsapp"], v)} />
              </div>
              <AreaField label="Address" value={c.address} onChange={(v) => set(["contact", "address"], v)} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" value={c.city} onChange={(v) => set(["contact", "city"], v)} />
                <Field label="Business hours" value={c.hours} onChange={(v) => set(["contact", "hours"], v)} />
              </div>
              <AreaField label="Google Maps embed URL" value={c.map_embed_url} onChange={(v) => set(["contact", "map_embed_url"], v)} />
              <div className="pt-2">
                <Label className="text-sm font-medium">Owner cards</Label>
                <div className="space-y-4 mt-2">
                  {c.owners.map((o, i) => (
                    <CardBlock key={o.id} onRemove={() => set(["contact", "owners"], c.owners.filter((_, x) => x !== i))}>
                      <Field label="Name" value={o.name} onChange={(v) => { const n = [...c.owners]; n[i] = { ...o, name: v }; set(["contact", "owners"], n); }} />
                      <Field label="Role" value={o.role} onChange={(v) => { const n = [...c.owners]; n[i] = { ...o, role: v }; set(["contact", "owners"], n); }} />
                      <Field label="Phone" value={o.phone} onChange={(v) => { const n = [...c.owners]; n[i] = { ...o, phone: v }; set(["contact", "owners"], n); }} />
                    </CardBlock>
                  ))}
                  <Button variant="outline" onClick={() => set(["contact", "owners"], [...c.owners, { id: uid(), name: "", role: "", phone: "" }])}><Plus size={15} className="mr-1" /> Add owner</Button>
                </div>
              </div>
            </>
          )}

          {tab === "hero" && (
            <>
              <Field label="Overline" value={draft.hero.overline} onChange={(v) => set(["hero", "overline"], v)} />
              <StringList label="Heading lines" items={draft.hero.heading_lines} onChange={(v) => set(["hero", "heading_lines"], v)} />
              <AreaField label="Subheading" value={draft.hero.subheading} onChange={(v) => set(["hero", "subheading"], v)} />
              <ImageField label="Hero image URL" value={draft.hero.image_url} onChange={(v) => set(["hero", "image_url"], v)} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Call button label" value={draft.hero.cta_call_label} onChange={(v) => set(["hero", "cta_call_label"], v)} />
                <Field label="WhatsApp button label" value={draft.hero.cta_whatsapp_label} onChange={(v) => set(["hero", "cta_whatsapp_label"], v)} />
              </div>
            </>
          )}

          {tab === "marquee" && (
            <StringList label="Marquee words" items={draft.marquee.words} onChange={(v) => set(["marquee", "words"], v)} />
          )}

          {tab === "about" && (
            <>
              <Field label="Overline" value={draft.about.overline} onChange={(v) => set(["about", "overline"], v)} />
              <AreaField label="Heading" value={draft.about.heading} onChange={(v) => set(["about", "heading"], v)} />
              <Label className="text-sm font-medium">Chapters</Label>
              <div className="space-y-4">
                {draft.about.chapters.map((ch, i) => {
                  const upd = (key, val) => { const n = [...draft.about.chapters]; n[i] = { ...ch, [key]: val }; set(["about", "chapters"], n); };
                  const move = (d) => { const n = [...draft.about.chapters]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; set(["about", "chapters"], n); };
                  return (
                    <CardBlock key={ch.id} onRemove={() => set(["about", "chapters"], draft.about.chapters.filter((_, x) => x !== i))} onUp={() => move(-1)} onDown={() => move(1)}>
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="Number" value={ch.number} onChange={(v) => upd("number", v)} />
                        <div className="col-span-2"><Field label="Title" value={ch.title} onChange={(v) => upd("title", v)} /></div>
                      </div>
                      <AreaField label="Body" value={ch.body} onChange={(v) => upd("body", v)} />
                      <ImageField label="Image URL" value={ch.image_url} onChange={(v) => upd("image_url", v)} />
                    </CardBlock>
                  );
                })}
                <Button variant="outline" onClick={() => set(["about", "chapters"], [...draft.about.chapters, { id: uid(), number: "0" + (draft.about.chapters.length + 1), title: "", body: "", image_url: "" }])}><Plus size={15} className="mr-1" /> Add chapter</Button>
              </div>
            </>
          )}

          {["services", "dishes", "counters"].includes(tab) && (
            <>
              <Field label="Overline" value={draft[tab].overline} onChange={(v) => set([tab, "overline"], v)} />
              <AreaField label="Heading" value={draft[tab].heading} onChange={(v) => set([tab, "heading"], v)} />
              <MediaItems items={draft[tab].items} onChange={(v) => set([tab, "items"], v)} testidPrefix={tab} />
            </>
          )}

          {tab === "gallery" && (
            <>
              <Field label="Overline" value={draft.gallery.overline} onChange={(v) => set(["gallery", "overline"], v)} />
              <AreaField label="Heading" value={draft.gallery.heading} onChange={(v) => set(["gallery", "heading"], v)} />
              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-500">Columns</Label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <button key={n} onClick={() => set(["gallery", "columns"], n)} data-testid={`gallery-cols-${n}`} className={`px-4 py-2 rounded border text-sm ${draft.gallery.columns === n ? "bg-[color:var(--cn-ink)] text-white" : "bg-white"}`}>{n}</button>
                  ))}
                </div>
              </div>
              <StringList label="Categories" items={draft.gallery.categories} onChange={(v) => set(["gallery", "categories"], v)} />
              <Label className="text-sm font-medium">Images</Label>
              <div className="space-y-4">
                {draft.gallery.items.map((it, i) => {
                  const upd = (key, val) => { const n = [...draft.gallery.items]; n[i] = { ...it, [key]: val }; set(["gallery", "items"], n); };
                  const move = (d) => { const n = [...draft.gallery.items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; set(["gallery", "items"], n); };
                  return (
                    <CardBlock key={it.id} onRemove={() => set(["gallery", "items"], draft.gallery.items.filter((_, x) => x !== i))} onUp={() => move(-1)} onDown={() => move(1)}>
                      <ImageField label="Image URL" value={it.image_url} onChange={(v) => upd("image_url", v)} />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Category" value={it.category} onChange={(v) => upd("category", v)} />
                        <Field label="Caption" value={it.caption} onChange={(v) => upd("caption", v)} />
                      </div>
                    </CardBlock>
                  );
                })}
                <Button variant="outline" onClick={() => set(["gallery", "items"], [...draft.gallery.items, { id: uid(), image_url: "", category: draft.gallery.categories[1] || "All", caption: "" }])}><Plus size={15} className="mr-1" /> Add image</Button>
              </div>
            </>
          )}

          {tab === "testimonials" && (
            <>
              <Field label="Overline" value={draft.testimonials.overline} onChange={(v) => set(["testimonials", "overline"], v)} />
              <AreaField label="Heading" value={draft.testimonials.heading} onChange={(v) => set(["testimonials", "heading"], v)} />
              <div className="space-y-4">
                {draft.testimonials.items.map((it, i) => {
                  const upd = (key, val) => { const n = [...draft.testimonials.items]; n[i] = { ...it, [key]: val }; set(["testimonials", "items"], n); };
                  return (
                    <CardBlock key={it.id} onRemove={() => set(["testimonials", "items"], draft.testimonials.items.filter((_, x) => x !== i))}>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Name" value={it.name} onChange={(v) => upd("name", v)} />
                        <Field label="Role / Event" value={it.role} onChange={(v) => upd("role", v)} />
                      </div>
                      <AreaField label="Quote" value={it.quote} onChange={(v) => upd("quote", v)} />
                    </CardBlock>
                  );
                })}
                <Button variant="outline" onClick={() => set(["testimonials", "items"], [...draft.testimonials.items, { id: uid(), name: "", role: "", quote: "" }])}><Plus size={15} className="mr-1" /> Add testimonial</Button>
              </div>
            </>
          )}

          {tab === "sections" && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-500">Reorder sections and toggle visibility. Hero, Contact are always recommended on.</p>
              {draft.sections.map((sec, i) => {
                const move = (d) => { const n = [...draft.sections]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; set(["sections"], n); };
                return (
                  <div key={sec.id} data-testid={`section-row-${sec.id}`} className="flex items-center gap-3 bg-white border rounded-lg px-4 py-3">
                    <GripVertical size={16} className="text-neutral-300" />
                    <span className="flex-1 text-sm font-medium">{sec.label}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(-1)}><ArrowUp size={15} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(1)}><ArrowDown size={15} /></Button>
                    <Switch data-testid={`section-toggle-${sec.id}`} checked={sec.visible} onCheckedChange={(v) => { const n = [...draft.sections]; n[i] = { ...sec, visible: v }; set(["sections"], n); }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
