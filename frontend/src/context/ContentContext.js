import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const { data } = await api.get("/content");
      setContent(data);
    } catch (e) {
      console.error("Failed to load content", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // apply brand color / font variables globally
  useEffect(() => {
    if (!content?.settings) return;
    const root = document.documentElement;
    const c = content.settings.colors || {};
    if (c.gold) root.style.setProperty("--cn-gold", c.gold);
    if (c.beige) root.style.setProperty("--cn-beige", c.beige);
    if (c.background) root.style.setProperty("--cn-bg", c.background);
    if (c.text) root.style.setProperty("--cn-ink", c.text);
    const f = content.settings.fonts || {};
    if (f.heading) root.style.setProperty("--font-head", `"${f.heading}", serif`);
    if (f.body) root.style.setProperty("--font-body", `"${f.body}", sans-serif`);
  }, [content]);

  return (
    <ContentContext.Provider value={{ content, setContent, loading, refetch: fetchContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export const useContent = () => useContext(ContentContext);
