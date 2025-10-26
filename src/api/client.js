// src/api/client.js
import CryptoJS from "crypto-js";

const BASE_URL = "https://68d6acb30ea01.myxvest1.ru/backend/public/api";

// 🔐 API so‘rov funksiyasi (mavjud kodingiz – o‘zgarmagan)
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

// 🧩 Foydalanuvchi uchun shifrlangan maxfiy token yaratish
// token = base64(id) + '.' + imzo(HMAC-SHA256)
export function makeUserToken(id) {
  if (!id) throw new Error("User ID is required to make token");

  const payload = btoa(String(id)); // foydalanuvchi ID shifrlanadi
  const secret = "supersecret"; // ⚠️ bu backenddagi config.php dagi 'app_secret' bilan bir xil bo‘lishi kerak
  const sign = CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);
  return `${payload}.${sign}`;
}
