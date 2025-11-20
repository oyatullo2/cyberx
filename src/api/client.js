// src/api/client.js
import CryptoJS from "crypto-js";

const BASE_URL = "https://68d6acb30ea01.myxvest1.ru/backend/api";

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
})
.then(async (r) => {
  if (!r.ok) {
    const text = await r.text().catch(()=>null);
    console.error('API ERROR RESPONSE TEXT', text);
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.ok === false) {
    const msg = data.error || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return data.data ?? data;
})
.catch(err => {
  console.error('API FETCH FAILED', { url: `${BASE_URL}/${path}`, err });
  throw err;
});
}


// 🧩 Foydalanuvchi uchun shifrlangan maxfiy token yaratish
// token = base64(id) + '.' + imzo(HMAC-SHA256)
const SECRET = "supersecret_key_123"; // backend bilan bir xil bo‘lishi kerak

export function makeUserToken(id) {
  const payload = btoa(String(id)); // ID → base64
  const sign = CryptoJS.HmacSHA256(payload, SECRET).toString(CryptoJS.enc.Hex);
  return `${payload}.${sign}`;
}
