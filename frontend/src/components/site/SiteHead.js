import { useEffect } from "react";
import { useContent } from "@/context/ContentContext";

function upsertMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function upsertLink(rel, href, extra = {}) {
  let el = document.head.querySelector(`link[rel="${rel}"]${extra.id ? `#${extra.id}` : ""}`);
  if (!href) {
    if (el && extra.removable) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra.id) el.id = extra.id;
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  if (extra.type) el.setAttribute("type", extra.type);
}

export default function SiteHead() {
  const { content } = useContent();

  useEffect(() => {
    if (!content) return;
    const seo = content.seo || {};

    if (seo.title) document.title = seo.title;
    upsertMeta("name", "description", seo.description);
    upsertMeta("property", "og:title", seo.og_title || seo.title);
    upsertMeta("property", "og:description", seo.og_description || seo.description);
    upsertMeta("property", "og:image", seo.og_image);
    upsertMeta("property", "og:type", seo.og_title || seo.title ? "website" : "");
    upsertMeta("name", "twitter:card", seo.og_image ? "summary_large_image" : "");
    upsertMeta("name", "twitter:title", seo.og_title || seo.title);
    upsertMeta("name", "twitter:description", seo.og_description || seo.description);
    upsertMeta("name", "twitter:image", seo.og_image);
    upsertMeta("name", "google-site-verification", seo.gsc_verification);

    if (seo.canonical_url) upsertLink("canonical", seo.canonical_url, { id: "cn-canonical", removable: true });
    if (seo.favicon) upsertLink("icon", seo.favicon, { id: "cn-favicon" });

    // Google Analytics
    if (seo.ga_id && !document.getElementById("cn-ga")) {
      const s1 = document.createElement("script");
      s1.id = "cn-ga";
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${seo.ga_id}`;
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.id = "cn-ga-init";
      s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.ga_id}');`;
      document.head.appendChild(s2);
    }
  }, [content]);

  // typography overrides (optional; only applied when set)
  useEffect(() => {
    if (!content) return;
    const t = content.settings?.typography || {};
    const build = (selector, cfg) => {
      if (!cfg) return "";
      const rules = [];
      if (cfg.weight) rules.push(`font-weight:${cfg.weight} !important`);
      if (cfg.letter_spacing) rules.push(`letter-spacing:${cfg.letter_spacing} !important`);
      if (cfg.line_height) rules.push(`line-height:${cfg.line_height} !important`);
      if (cfg.transform && cfg.transform !== "none") rules.push(`text-transform:${cfg.transform} !important`);
      return rules.length ? `${selector}{${rules.join(";")}}` : "";
    };
    const sizeRule = (selector, val) => (val ? `${selector}{font-size:${val} !important}` : "");
    const css = [
      build(".font-head", t.heading),
      build("body", t.body),
      // global font sizes — scoped to public site (<main>), only applied when set
      sizeRule("main h1.font-head", t.hero_heading_size),
      sizeRule("main h2.font-head", t.section_heading_size),
      sizeRule("main p:not(.overline), main blockquote, main figcaption, main li", t.body_size),
    ].filter(Boolean).join("\n");
    let style = document.getElementById("cn-typography");
    if (!css) {
      if (style) style.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = "cn-typography";
      document.head.appendChild(style);
    }
    style.innerHTML = css;
  }, [content]);

  return null;
}
