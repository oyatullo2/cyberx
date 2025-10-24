import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, loading, token, logout } = useAuth();
  const nav = useNavigate();
  const [usersCount, setUsersCount] = useState(0);
  const [speedMbps, setSpeedMbps] = useState(0);

  // agar foydalanuvchi login bo‘lmagan bo‘lsa — login sahifasiga yuborish
  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);

  // backenddan userlar sonini olish
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const c = await api("users_count.php", { method: "GET", token });
        setUsersCount(Number(c.count || 0));
      } catch {
        setUsersCount(0);
      }
    })();
  }, [user, token]);

  // internet tezligini real-time o‘lchash
  useEffect(() => {
    if (!user) return;
    let stop = false;
    async function measure() {
      const size = 3 * 1024 * 1024; // 3 MB
      const t0 = performance.now();
      try {
        const res = await fetch(
          `${new URL("./", location.href)}api/speed_test.php?size=${size}`,
          { cache: "no-store" }
        );
        await res.arrayBuffer();
        const dt = (performance.now() - t0) / 1000;
        const mbps = (size * 8) / (1e6 * dt);
        if (!stop) setSpeedMbps(mbps.toFixed(1));
      } catch {
        if (!stop) setSpeedMbps(0);
      }
      if (!stop) setTimeout(measure, 7000);
    }
    measure();
    return () => {
      stop = true;
    };
  }, [user]);

  if (loading) return <div className="p-8 text-center">Yuklanmoqda...</div>;
  if (!user) return null;

  const avatar =
    user?.profile_image_url ||
    user?.profile_image ||
    "/public/assets/default.webp";
  const displayName = user?.name || user?.username || "User";

  // tezkor havolalar
  const quick = useMemo(
    () => [
      { label: "Foydalanuvchilar", on: () => nav("/users") },
      { label: "Xabarlar", on: () => nav("/messages") },
      { label: "Profil", on: () => nav("/settings") },
      { label: "Yordam", on: () => nav("/help") },
    ],
    [nav]
  );

  return (
    <div className="flex flex-col p-6 sm:p-8 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={avatar}
              alt={displayName}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-800"
            />
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">
                {displayName}
              </h1>
              <div className="text-sm text-slate-400">@{user?.username}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-indigo-600 transition w-full sm:w-auto"
          >
            Chiqish
          </button>
        </header>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Stat
            title="Foydalanuvchilar"
            value={usersCount}
            note="Umumiy ro‘yxat"
          />
          <Stat
            title="Internet tezligi"
            value={`${speedMbps} Mbps`}
            note="Real-time o‘lchov"
          />
          <Stat
            title="Tezkor havolalar"
            value={`${quick.length} ta`}
            note="Quyida joylashgan"
          />
        </section>

        {/* Tezkor havolalar */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-bold text-lg mb-3 text-indigo-400">
            Tezkor havolalar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {quick.map((q) => (
              <button
                key={q.label}
                onClick={q.on}
                className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm hover:border-indigo-600 hover:bg-slate-800 transition text-slate-200"
              >
                {q.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// Stat component
function Stat({ title, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-center hover:border-indigo-600 transition">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
        {title}
      </div>
      <div className="text-2xl font-extrabold text-indigo-400">{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{note}</div>
    </div>
  );
}
