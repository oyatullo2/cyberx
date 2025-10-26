// 📁 src/pages/Users.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, makeUserToken } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

// 🕓 Oxirgi faol vaqtni formatlash
function timeAgo(ts) {
  if (!ts) return "not logged in";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// 🌐 Online status tekshirish
function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 30 * 1000;
}

export default function Users() {
  const { token } = useAuth();
  const nav = useNavigate();
  const listRef = useRef(null);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // ⏳ Debounce qidiruv
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(id);
  }, [query]);

  // 🔹 Dastlabki yuklash
  useEffect(() => {
    load(1, true);
  }, [debouncedQuery]);

  // ♾ Infinite scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (
        !busy &&
        !done &&
        el.scrollHeight - el.scrollTop - el.clientHeight < 200
      ) {
        load(page + 1);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [page, busy, done]);

  // 📥 Yuklash
  async function load(p, reset = false) {
    if (busy || (done && !reset)) return;
    setBusy(true);
    try {
      const url = `users_list.php?page=${p}&per=24${
        debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : ""
      }`;
      const data = await api(url, { method: "GET", token });
      if (reset) setItems(data.users);
      else setItems((prev) => [...prev, ...data.users]);
      setPage(p);
      if (!data.users.length) setDone(true);
    } catch (e) {
      console.error("Yuklash xatosi:", e);
    } finally {
      setBusy(false);
    }
  }

  // 🔘 Follow/Unfollow
  async function toggleFollow(id) {
    try {
      await api("follow_toggle.php", {
        method: "POST",
        body: { target_id: id },
        token,
      });
      setItems((prev) =>
        prev.map((u) => (u.id === id ? { ...u, following: !u.following } : u))
      );
    } catch (e) {
      console.error("Follow toggle xatosi:", e);
    }
  }

  // 🧭 Profilga xavfsiz o‘tish
  function openProfile(id) {
    try {
      const t = makeUserToken(id);
      nav(`/users/${t}`);
    } catch (e) {
      console.error("Profilga o'tishda xato:", e);
    }
  }

  return (
    <div
      ref={listRef}
      className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 min-h-screen overflow-y-auto py-6 bg-slate-950 text-slate-100"
    >
      {/* 🔍 Qidiruv paneli */}
      <div className="sticky top-0 z-10 bg-slate-950 pb-4 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
            Foydalanuvchilar
          </h1>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Username yoki ism kiriting..."
            className="w-full sm:w-96 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-600 focus:ring focus:ring-indigo-600/20 outline-none text-sm transition"
          />
        </div>
      </div>

      {/* 👥 User grid */}
      <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((u) => {
          const online = isOnline(u.last_seen);
          return (
            <div
              key={u.id}
              onClick={() => openProfile(u.id)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/70 hover:border-indigo-600 p-3 transition shadow-sm"
            >
              <div className="relative">
                <img
                  src={
                    u.profile_image_url ||
                    u.profile_image ||
                    "/public/assets/default.webp"
                  }
                  alt={u.username}
                  className="w-full aspect-square object-cover rounded-2xl"
                />
                <span
                  className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    online ? "bg-emerald-400" : "bg-slate-500"
                  }`}
                ></span>
              </div>

              <div className="mt-3 text-center">
                <div className="font-semibold truncate text-slate-100 group-hover:text-indigo-400 transition">
                  {u.name || "—"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  @{u.username}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {online ? "🟢 online" : `⚫ ${timeAgo(u.last_seen)}`}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow(u.id);
                  }}
                  className={`mt-2 w-full rounded-xl py-1 text-sm font-semibold transition ${
                    u.following
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {u.following ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔁 Yuklanish / Tugash holatlari */}
      {busy && (
        <div className="py-6 text-center text-slate-400 animate-pulse">
          Yuklanmoqda…
        </div>
      )}
      {done && items.length === 0 && (
        <div className="py-6 text-center text-slate-500">
          Hech qanday foydalanuvchi topilmadi.
        </div>
      )}
    </div>
  );
}
