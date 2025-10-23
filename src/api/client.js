// src/api/client.js
const BASE_URL = "https://68d6acb30ea01.myxvest1.ru/backend/public/api";

export function api(
  path,
  { method = "POST", body, token, formData = false } = {}
) {
  const headers = {};
  if (!formData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${BASE_URL}/${path}`, {
    method,
    headers,
    body: formData ? body : body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.ok === false) {
      const msg = data.error || `HTTP ${r.status}`;
      throw new Error(msg);
    }
    return data.data ?? data;
  });
}
