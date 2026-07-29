import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export { BACKEND_URL };

export const api = axios.create({ baseURL: API });

export const TOKEN_KEY = "cn_token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/media", form, { headers: { "Content-Type": "multipart/form-data" } });
  return `${BACKEND_URL}${data.path}`;
}

export async function listMedia() {
  const { data } = await api.get("/media");
  return data.map((m) => ({ ...m, url: `${BACKEND_URL}${m.path}` }));
}

export async function deleteMedia(id) {
  await api.delete(`/media/${id}`);
}

export function telHref(raw) {
  const digits = (raw || "").replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function waHref(raw, text) {
  const digits = (raw || "").replace(/[^\d]/g, "");
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${msg}`;
}
