import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, uploadImage, listMedia, deleteMedia } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LogOut, Save, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink,
  Palette, Phone, Image as ImageIcon, Type, Layers, GripVertical,
  Upload, Link as LinkIcon, Search, User, Layout, Images, Check,
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

function MediaPicker({ open, onOpenChange, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listMedia().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-neutral-400 py-10 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-400 py-10 text-center">No uploads yet. Upload an image from any field to reuse it here.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {items.map((m) => (
              <button
                key={m.id}
                data-testid={`picker-media-${m.id}`}
                onClick={() => { onSelect(m.url); onOpenChange(false); }}
                className="group relative aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-gold"
              >
                <img src={m.url} alt={m.filename} className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Check size={22} className="text-white opacity-0 group-hover:opacity-100" />
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const ImageField = ({ label, value, onChange, hint }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error("Upload failed. " + (err.response?.data?.detail || err.message));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-neutral-500">{label}</Label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} data-testid={`upload-input-${(label || "").toLowerCase().replace(/\s+/g, "-")}`} />
      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onChange} />
      <div className="flex gap-3 items-start">
        <div className="relative group">
          {value ? (
            <img src={value} alt="" className="h-20 w-20 rounded object-cover border bg-neutral-50" />
          ) : (
            <div className="h-20 w-20 rounded bg-neutral-100 border grid place-items-center text-neutral-300"><ImageIcon size={22} /></div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={pick} disabled={busy} data-testid="upload-btn">
              <Upload size={14} className="mr-1.5" /> {busy ? "Uploading…" : value ? "Replace" : "Upload"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)} data-testid="library-btn">
              <Images size={14} className="mr-1.5" /> Library
            </Button>
            {value && (
              <Button type="button" variant="outline" size="sm" className="text-red-500" onClick={() => onChange("")} data-testid="remove-image-btn">
                <Trash2 size={14} className="mr-1.5" /> Remove
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" className="text-neutral-500" onClick={() => setShowUrl((v) => !v)}>
              <LinkIcon size={14} className="mr-1.5" /> URL
            </Button>
          </div>
          {showUrl && (
            <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://image-url or paste link" />
          )}
          {hint && <p className="text-[11px] text-neutral-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, testid }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-neutral-500">{label}</Label>
    <select
      data-testid={testid}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
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
  { id: "media", label: "Media Library", icon: Images },
  { id: "seo", label: "Site Settings", icon: Search },
  { id: "account", label: "Account", icon: User },
  { id: "sections", label: "Sections & Order", icon: GripVertical },
];

// defaults for keys that may be missing from older saved content
const CONTENT_DEFAULTS = {
  seo: {
    title: "", description: "", og_title: "", og_description: "",
    og_image: "", canonical_url: "", ga_id: "", gsc_verification: "", favicon: "",
  },
  typography: {
    hero_heading_size: "", section_heading_size: "", body_size: "",
    heading: { weight: "", letter_spacing: "", line_height: "", transform: "none" },
    body: { weight: "", letter_spacing: "", line_height: "", transform: "none" },
  },
  heroLayout: { text_align: "left", vertical: "bottom", content_width: "default", pad_bottom: "", overlay: 45 },
};

function withDefaults(content) {
  const c = structuredClone(content);
  c.seo = { ...CONTENT_DEFAULTS.seo, ...(c.seo || {}) };
  c.settings = c.settings || {};
  c.settings.typography = {
    hero_heading_size: c.settings.typography?.hero_heading_size ?? "",
    section_heading_size: c.settings.typography?.section_heading_size ?? "",
    body_size: c.settings.typography?.body_size ?? "",
    heading: { ...CONTENT_DEFAULTS.typography.heading, ...(c.settings.typography?.heading || {}) },
    body: { ...CONTENT_DEFAULTS.typography.body, ...(c.settings.typography?.body || {}) },
  };
  c.hero = c.hero || {};
  c.hero.layout = { ...CONTENT_DEFAULTS.heroLayout, ...(c.hero.layout || {}) };
  return c;
}

function MediaLibraryPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const load = () => {
    setLoading(true);
    listMedia().then(setItems).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        if (f.type.startsWith("image/")) await uploadImage(f);
      }
      toast.success("Uploaded");
      load();
    } catch (err) {
      toast.error("Upload failed. " + (err.response?.data?.detail || err.message));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this image? Sections still using it will show a broken image.")) return;
    try {
      await deleteMedia(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const copy = (url) => {
    navigator.clipboard?.writeText(url);
    toast.success("URL copied");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Upload once, reuse anywhere. Use the <span className="font-medium">Library</span> button on any image field to insert these.</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} data-testid="library-upload-input" />
        <Button onClick={() => inputRef.current?.click()} disabled={busy} data-testid="library-upload-btn" className="bg-[color:var(--cn-ink)] hover:bg-neutral-800">
          <Upload size={15} className="mr-1.5" /> {busy ? "Uploading…" : "Upload images"}
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-neutral-400 py-10 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed rounded-lg py-16 text-center text-neutral-400">
          <Images size={28} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No images yet. Upload your first images to build your library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((m) => (
            <div key={m.id} data-testid={`library-item-${m.id}`} className="group relative aspect-square rounded-lg overflow-hidden border bg-neutral-50">
              <img src={m.url} alt={m.filename} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button size="icon" variant="secondary" className="h-9 w-9" onClick={() => copy(m.url)} title="Copy URL"><LinkIcon size={15} /></Button>
                <Button size="icon" variant="secondary" className="h-9 w-9 text-red-600" onClick={() => remove(m.id)} data-testid={`library-delete-${m.id}`} title="Delete"><Trash2 size={15} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountPanel({ user }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put("/auth/account", { name, email });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (nw !== confirm) { toast.error("New passwords do not match"); return; }
    if (nw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setSavingPw(true);
    try {
      await api.put("/auth/password", { current_password: cur, new_password: nw });
      toast.success("Password changed");
      setCur(""); setNw(""); setConfirm("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Change failed");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 bg-white border rounded-lg p-6">
        <p className="font-medium">Profile</p>
        <Field label="Display name" value={name} onChange={setName} testid="account-name" />
        <Field label="Email" value={email} onChange={setEmail} testid="account-email" />
        <Button onClick={saveProfile} disabled={savingProfile} data-testid="save-profile-btn" className="bg-[color:var(--cn-ink)] hover:bg-neutral-800">
          {savingProfile ? "Saving…" : "Save profile"}
        </Button>
      </div>
      <div className="space-y-4 bg-white border rounded-lg p-6">
        <p className="font-medium">Change password</p>
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">Current password</Label>
          <Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} data-testid="current-password" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-500">New password</Label>
            <Input type="password" value={nw} onChange={(e) => setNw(e.target.value)} data-testid="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-500">Confirm new password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} data-testid="confirm-password" />
          </div>
        </div>
        <Button onClick={savePassword} disabled={savingPw} data-testid="save-password-btn" className="bg-[color:var(--cn-ink)] hover:bg-neutral-800">
          {savingPw ? "Updating…" : "Update password"}
        </Button>
      </div>
    </div>
  );
}

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
    if (content && !draft) setDraft(withDefaults(content));
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
    setDraft(withDefaults(data.content));
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
              <ImageField label="Logo" hint="Upload a transparent PNG for best results. Leave empty to use the text logo." value={s.logo_url} onChange={(v) => set(["settings", "logo_url"], v)} />
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

              <div className="pt-4 mt-2 border-t">
                <p className="text-sm font-medium mb-1">Typography fine-tuning</p>
                <p className="text-xs text-neutral-400 mb-4">Optional overrides applied site-wide. Leave any field blank to keep the current premium defaults (and full responsiveness).</p>

                <div className="mb-6 space-y-4">
                  <p className="text-xs font-medium text-neutral-600">Global font sizes</p>
                  <div>
                    <Field label="Hero heading font size (e.g. 6rem, 90px)" value={s.typography?.hero_heading_size} onChange={(v) => set(["settings", "typography", "hero_heading_size"], v)} testid="type-hero-size" />
                    <p className="text-[11px] text-neutral-400 mt-1">Applies only to the hero heading.</p>
                  </div>
                  <div>
                    <Field label="Section heading font size (e.g. 3.5rem, 48px)" value={s.typography?.section_heading_size} onChange={(v) => set(["settings", "typography", "section_heading_size"], v)} testid="type-section-size" />
                    <p className="text-[11px] text-neutral-400 mt-1">Applies to all section headings (About, Services, Signature Dishes, Live Counters, Gallery, Testimonials, Contact, etc.).</p>
                  </div>
                  <div>
                    <Field label="Body font size (e.g. 1.05rem, 17px)" value={s.typography?.body_size} onChange={(v) => set(["settings", "typography", "body_size"], v)} testid="type-body-size" />
                    <p className="text-[11px] text-neutral-400 mt-1">Applies to all paragraphs, descriptions, testimonials and other body text (excludes small uppercase labels).</p>
                  </div>
                </div>

                {[["heading", "Headings", "Affects the hero heading and every section heading."], ["body", "Body text", "Affects paragraphs, descriptions and testimonial quotes."]].map(([g, gl, desc]) => (
                  <div key={g} className="mb-5">
                    <Label className="text-xs font-medium text-neutral-600">{gl}</Label>
                    <p className="text-[11px] text-neutral-400 mb-2">{desc}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <SelectField label="Font weight" value={s.typography?.[g]?.weight} onChange={(v) => set(["settings", "typography", g, "weight"], v)}
                          options={[{value:"",label:"Default"},{value:"300",label:"Light (300)"},{value:"400",label:"Regular (400)"},{value:"500",label:"Medium (500)"},{value:"600",label:"Semibold (600)"},{value:"700",label:"Bold (700)"},{value:"800",label:"Extra Bold (800)"}]} />
                        <p className="text-[11px] text-neutral-400 mt-1">Thickness of the {g === "heading" ? "headings" : "body text"}.</p>
                      </div>
                      <div>
                        <Field label="Letter spacing (e.g. -0.02em)" value={s.typography?.[g]?.letter_spacing} onChange={(v) => set(["settings", "typography", g, "letter_spacing"], v)} />
                        <p className="text-[11px] text-neutral-400 mt-1">Space between letters.</p>
                      </div>
                      <div>
                        <Field label="Line height (e.g. 1.1)" value={s.typography?.[g]?.line_height} onChange={(v) => set(["settings", "typography", g, "line_height"], v)} />
                        <p className="text-[11px] text-neutral-400 mt-1">Vertical space between lines.</p>
                      </div>
                      <div>
                        <SelectField label="Text transform" value={s.typography?.[g]?.transform} onChange={(v) => set(["settings", "typography", g, "transform"], v)}
                          options={[{value:"none",label:"Default"},{value:"uppercase",label:"UPPERCASE"},{value:"lowercase",label:"lowercase"},{value:"capitalize",label:"Capitalize"}]} />
                        <p className="text-[11px] text-neutral-400 mt-1">Letter casing.</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              <ImageField label="Hero image" value={draft.hero.image_url} onChange={(v) => set(["hero", "image_url"], v)} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Call button label" value={draft.hero.cta_call_label} onChange={(v) => set(["hero", "cta_call_label"], v)} />
                <Field label="WhatsApp button label" value={draft.hero.cta_whatsapp_label} onChange={(v) => set(["hero", "cta_whatsapp_label"], v)} />
              </div>

              <div className="pt-4 mt-2 border-t">
                <p className="text-sm font-medium mb-1 flex items-center gap-2"><Layout size={15} /> Hero layout</p>
                <p className="text-xs text-neutral-400 mb-4">Fine-tune positioning. Defaults match the current design.</p>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Text alignment" testid="hero-text-align" value={draft.hero.layout?.text_align} onChange={(v) => set(["hero", "layout", "text_align"], v)}
                    options={[{value:"left",label:"Left"},{value:"center",label:"Center"},{value:"right",label:"Right"}]} />
                  <SelectField label="Vertical position" value={draft.hero.layout?.vertical} onChange={(v) => set(["hero", "layout", "vertical"], v)}
                    options={[{value:"top",label:"Top"},{value:"center",label:"Center"},{value:"bottom",label:"Bottom"}]} />
                  <SelectField label="Content width" value={draft.hero.layout?.content_width} onChange={(v) => set(["hero", "layout", "content_width"], v)}
                    options={[{value:"narrow",label:"Narrow"},{value:"default",label:"Default"},{value:"wide",label:"Wide"},{value:"full",label:"Full"}]} />
                  <Field label="Bottom spacing (e.g. 7rem)" value={draft.hero.layout?.pad_bottom} onChange={(v) => set(["hero", "layout", "pad_bottom"], v)} />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label className="text-xs text-neutral-500">Image darkness (overlay {draft.hero.layout?.overlay ?? 45}%)</Label>
                  <input type="range" min="0" max="90" value={draft.hero.layout?.overlay ?? 45} onChange={(e) => set(["hero", "layout", "overlay"], Number(e.target.value))} className="w-full" data-testid="hero-overlay" />
                </div>
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

          {tab === "media" && <MediaLibraryPanel />}

          {tab === "seo" && (
            <>
              <p className="text-sm text-neutral-500 -mt-1">Search engine & social sharing settings for the whole site.</p>
              <ImageField label="Favicon" hint="Square PNG recommended (e.g. 512×512)." value={draft.seo.favicon} onChange={(v) => set(["seo", "favicon"], v)} />
              <Field label="SEO title" value={draft.seo.title} onChange={(v) => set(["seo", "title"], v)} testid="seo-title" />
              <AreaField label="Meta description" value={draft.seo.description} onChange={(v) => set(["seo", "description"], v)} />
              <Field label="Open Graph title" value={draft.seo.og_title} onChange={(v) => set(["seo", "og_title"], v)} />
              <AreaField label="Open Graph description" value={draft.seo.og_description} onChange={(v) => set(["seo", "og_description"], v)} />
              <ImageField label="Social sharing image (OG image)" hint="Recommended 1200×630." value={draft.seo.og_image} onChange={(v) => set(["seo", "og_image"], v)} />
              <Field label="Canonical URL" value={draft.seo.canonical_url} onChange={(v) => set(["seo", "canonical_url"], v)} placeholder="https://caternation.com" />
              <Field label="Google Analytics ID (optional)" value={draft.seo.ga_id} onChange={(v) => set(["seo", "ga_id"], v)} placeholder="G-XXXXXXXXXX" />
              <Field label="Google Search Console verification (optional)" value={draft.seo.gsc_verification} onChange={(v) => set(["seo", "gsc_verification"], v)} placeholder="content value of the meta tag" />
            </>
          )}

          {tab === "account" && <AccountPanel user={user} />}

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
