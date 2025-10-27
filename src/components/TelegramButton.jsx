import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Telegram custom button – dizayn Google/GitHub tugmalari bilan bir xil.
 * window.Telegram.Login.auth() ni popup orqali chaqiramiz.
 *
 * Env:
 *  - import.meta.env.VITE_TG_BOT_ID        (raqamli bot ID)
 */
export default function TelegramButton({ text = "Telegram orqali kirish" }) {
  const { loginWithTelegram } = useAuth();
  const loadedRef = useRef(false);

  // Telegram widget skriptini yuklaymiz (agar yuklanmagan bo‘lsa)
  useEffect(() => {
    if (loadedRef.current) return;
    if (window.Telegram?.Login) { loadedRef.current = true; return; }

    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.defer = true;
    s.onload = () => { loadedRef.current = true; };
    document.head.appendChild(s);
  }, []);

  async function handleClick() {
    const botId = Number(import.meta.env.VITE_TG_BOT_ID || 0);
    if (!botId) {
      alert("VITE_TG_BOT_ID sozlanmagan.");
      return;
    }
    if (!window.Telegram || !window.Telegram.Login) {
      alert("Telegram Login skripti yuklanmadi. Internet yoki CSP ni tekshiring.");
      return;
    }

    // Popup orqali auth (Telegram o‘z serveridan imzolangan payload qaytaradi)
    window.Telegram.Login.auth(
      { bot_id: botId, request_access: "write" },
      async (response) => {
        // response: { id, first_name?, last_name?, username?, photo_url?, auth_date, hash }
        if (!response || !response.hash) {
          alert("Telegram javobi noto‘g‘ri.");
          return;
        }
        try {
          await loginWithTelegram(response);
          // Route’ni chaqiruvchi sahifa hal qiladi (Login.jsx/Register.jsx ichida nav ishlatiladi)
        } catch (e) {
          alert(e.message || "Telegram login xatosi");
        }
      }
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-3 font-semibold shadow-lg flex items-center justify-center gap-3 border border-sky-600 text-white transition"
    >
      <svg width="20" height="20" viewBox="0 0 240 240" className="opacity-90">
        <path fill="currentColor" d="M120,0C53.7,0,0,53.7,0,120s53.7,120,120,120s120-53.7,120-120S186.3,0,120,0z M174.2,81.6l-22.2,104c-1.7,7.7-6.3,9.6-12.7,6l-35.1-25.9l-16.9,16.3c-1.9,1.9-3.6,3.6-7.4,3.6l2.6-37.3l67.9-61.3c3-2.6-0.7-4.1-4.6-1.5l-84,52.9l-36.1-11.3c-7.8-2.4-7.9-7.7,1.6-11.4l141.2-54.5C173.6,60.8,176.4,66.3,174.2,81.6z"/>
      </svg>
      <span className="font-medium">{text}</span>
    </button>
  );
}
