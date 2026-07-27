import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const TOKEN_KEY = "cn_token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function telHref(raw) {
  const digits = (raw || "").replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function waHref(raw, text) {
  const digits = (raw || "").replace(/[^\d]/g, "");
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${msg}`;
}
