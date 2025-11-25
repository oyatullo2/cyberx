// src/api/client.js
const BASE = (import.meta.env.VITE_API_BASE || "https://68d6acb30ea01.myxvest1.ru/backend/public/api").replace(/\/+$/,"");

export async function api(path, { method = "POST", body, token, formData = false } = {}) {
  const url = `${BASE}/${path.replace(/^\/+/, "")}`;
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!formData) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: formData ? body : (body ? JSON.stringify(body) : undefined),
    credentials: "include",
  });

  let data;
  try { data = await res.json(); } catch {
    throw new Error(`Server javobi noto‘g‘ri (HTTP ${res.status})`);
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }
  return data.data ?? data;
}
