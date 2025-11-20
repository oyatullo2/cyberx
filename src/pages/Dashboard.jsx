import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api, makeUserToken } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function timeAgo(ts) {
  if (!ts) return "offline";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 30 * 1000;
}

export default function Dashboard() {
  const { user, loading, token, logout } = useAuth();
  const nav = useNavigate();

  const [usersCount, setUsersCount] = useState(0);
  const [speedMbps, setSpeedMbps] = useState(0);
  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
  });

  const [modal, setModal] = useState(null);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [done, setDone] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const listRef = useRef(null);
  const [myPosts, setMyPosts] = useState([]);
  const [postsBusy, setPostsBusy] = useState(false);
  const [likesModal, setLikesModal] = useState(null);
  const [likesList, setLikesList] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);

  async function openLikesList(postId) {
    try {
      setLikesModal(postId);
      setLikesLoading(true);
      const res = await api(`post_likes_list.php?post_id=${postId}`, {
        method: "GET",
        token,
      });
      setLikesList(res.users || []);
    } catch (e) {
      console.error("Like ro‘yxatini olishda xato:", e);
      setLikesList([]);
    } finally {
      setLikesLoading(false);
    }
  }

  async function toggleLike(postId) {
    try {
      const res = await api("post_react.php", {
        method: "POST",
        token,
        body: { post_id: postId },
      });
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked_by_me: res.action === "added",
                likes_count:
                  (p.likes_count || 0) + (res.action === "added" ? 1 : -1),
              }
            : p
        )
      );
    } catch (e) {
      console.error("Like xatosi:", e);
    }
  }

  async function loadMyPosts() {
    if (!user || !token) return;
    setPostsBusy(true);
    try {
      const t = makeUserToken(user.id);
      const res = await api(`user_posts.php?t=${t}&page=1&per=10`, {
        method: "GET",
        token,
      });
      const data = res.data || res;
      setMyPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e) {
      console.error("Postlar yuklanmadi:", e);
    } finally {
      setPostsBusy(false);
    }
  }

  useEffect(() => {
    loadMyPosts();
  }, [user, token]);

  // 🔐 Auth check
  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);

  // 📊 User count
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

  // 🌐 Internet tezligini o‘lchash
  useEffect(() => {
    if (!user) return;
    let stop = false;
    async function measure() {
      const size = 2 * 1024 * 1024;
      const t0 = performance.now();
      try {
        const res = await fetch(`${new URL("./", location.href)}robots.txt`, {
          cache: "no-store",
        });
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

  // 👥 Follow stats
  async function loadFollowStats() {
    if (!user || !token) return;
    try {
      const userToken = makeUserToken(user.id);
      api(`user_profile.php?t=${encodeURIComponent(userToken)}`, {
        method: "GET",
        token,
      });

      const u = res.user || res;
      setFollowStats({
        followers: Number(res.followers || u.followers || 0),
        following: Number(res.following || u.following || 0),
      });
    } catch (e) {
      console.error("Follow stats yuklanmadi:", e);
    }
  }

  useEffect(() => {
    loadFollowStats();
    const id = setInterval(loadFollowStats, 10000);
    return () => clearInterval(id);
  }, [user, token]);

  // 📋 Modal ro‘yxatini yuklash (followers yoki following)
  async function loadList(p = 1, reset = false) {
    if (!modal || listLoading || (done && !reset)) return;
    setListLoading(true);
    try {
      const endpoint =
        modal === "followers"
          ? `user_followers.php?id=${user.id}&page=${p}&per=24`
          : `user_following.php?id=${user.id}&page=${p}&per=24`;

      const res = await api(endpoint, { method: "GET", token });
      const arrKey = modal === "followers" ? "followers" : "following";
      const data = Array.isArray(res[arrKey]) ? res[arrKey] : [];

      if (reset) setList(data);
      else setList((prev) => [...prev, ...data]);

      setPage(p);
      if (data.length === 0) setDone(true);
    } catch (e) {
      console.error("Ro‘yxat yuklanmadi:", e);
    } finally {
      setListLoading(false);
    }
  }

  function openFollowList(type) {
    if (!user) return;
    setModal(type);
    setList([]);
    setPage(1);
    setDone(false);
    setListLoading(false);
  }

  useEffect(() => {
    if (modal) loadList(1, true);
  }, [modal]);

  // ♾ Infinite scroll
  useEffect(() => {
    if (!modal || !listRef.current) return;
    const el = listRef.current;
    function handleScroll() {
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight < 150 &&
        !listLoading &&
        !done
      ) {
        loadList(page + 1, false);
      }
    }
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [modal, page, listLoading, done]);

  // 🔄 Follow / Unfollow
  async function toggleFollow(targetId, type) {
    try {
      await api("follow_toggle.php", {
        method: "POST",
        body: { target_id: targetId },
        token,
      });

      if (type === "unfollow") {
        setList((prev) => prev.filter((u) => u.id !== targetId));
        setFollowStats((s) => ({ ...s, following: s.following - 1 }));
      } else if (type === "follow") {
        setList((prev) =>
          prev.map((u) =>
            u.id === targetId ? { ...u, already_following: true } : u
          )
        );
        setFollowStats((s) => ({ ...s, following: s.following + 1 }));
      }
    } catch (e) {
      console.error("Follow toggle xatosi:", e);
    }
  }

  // 🧭 Profilga o‘tish (shifrlangan token bilan)
  async function openUserProfile(uid) {
    try {
      const tokenStr = makeUserToken(uid);
      setModal(null);
      nav(`/users/${tokenStr}`); // ✅ tokenli URL
    } catch (e) {
      console.error("Token yaratishda xato:", e);
    }
  }

  if (loading)
    return <div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>;
  if (!user) return null;

  const avatar = user?.avatar_url || "/public/assets/default.webp";
  const displayName = user?.name || user?.username || "User";

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
        {/* 🧑 Profil Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={avatar}
              alt={displayName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-extrabold">{displayName}</h1>
              <div className="text-sm text-slate-400">@{user?.username}</div>
              <div className="flex gap-4 mt-1">
                <button
                  onClick={() => openFollowList("followers")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  Followers: {followStats.followers}
                </button>
                <button
                  onClick={() => openFollowList("following")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  Following: {followStats.following}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-rose-600 hover:text-rose-300 transition w-full sm:w-auto"
          >
            Chiqish
          </button>
        </header>

        {/* 📊 Statlar */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Stat
            title="Foydalanuvchilar"
            value={usersCount}
            note="Umumiy ro'yxat"
          />
          <Stat
            title="Internet tezligi"
            value={`${speedMbps} Mbps`}
            note="Real-time o'lchov"
          />
          <Stat
            title="Tezkor havolalar"
            value={`${quick.length} ta`}
            note="Quyida joylashgan"
          />
        </section>

        {/* 🚀 Tezkor havolalar */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-md">
          <h2 className="font-bold text-lg mb-3 text-indigo-400">
            Tezkor havolalar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {quick.map((q) => (
              <button
                key={q.label}
                onClick={q.on}
                className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm hover:border-indigo-600 hover:bg-slate-800 transition text-slate-200 shadow-sm"
              >
                {q.label}
              </button>
            ))}
          </div>
        </section>

        {/* 📝 Postlar bo‘limi */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-indigo-400">Postlarim</h2>
            <button
              onClick={() => nav("/post/new")}
              className="text-xs rounded-lg border border-indigo-700/60 px-3 py-1 hover:bg-indigo-800/30 text-indigo-200 transition"
            >
              + Yangi post
            </button>
          </div>

          {postsBusy && <div className="text-slate-400">Yuklanmoqda…</div>}
          {!postsBusy && myPosts.length === 0 && (
            <div className="text-slate-500 text-sm">Hozircha post yo‘q.</div>
          )}

          <div className="space-y-4">
            {myPosts.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
              >
                {p.title && (
                  <h3 className="font-semibold text-slate-100 mb-1">
                    {p.title}
                  </h3>
                )}

                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {p.body}
                </p>

                {/* 🖼 Rasmlar */}
                {p.images?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {p.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-full h-40 object-cover rounded-xl border border-slate-800"
                      />
                    ))}
                  </div>
                )}

                {/* ❤️ Like tizimi */}
                <div className="flex items-center justify-between mt-3 text-sm text-slate-400">
                  <button
                    onClick={() => toggleLike(p.id)}
                    className={`flex items-center gap-1 transition ${
                      p.liked_by_me ? "text-rose-400" : "hover:text-rose-300"
                    }`}
                  >
                    {p.liked_by_me ? "❤️" : "🤍"} {p.likes_count}
                  </button>

                  {(typeof isMe === "undefined" || isMe) &&
                    p.likes_count > 0 && (
                      <button
                        onClick={() => openLikesList(p.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Kimlar yoqtirdi?
                      </button>
                    )}

                  <div className="text-[11px] text-slate-500">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {likesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => setLikesModal(null)}
              className="absolute top-3 right-4 text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
            <div className="p-4 border-b border-slate-800 text-center">
              <h2 className="text-base font-semibold text-indigo-400">
                Yoqtirgan foydalanuvchilar
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hidden">
              {likesLoading && (
                <div className="text-center text-slate-400 animate-pulse">
                  Yuklanmoqda...
                </div>
              )}
              {!likesLoading && likesList.length === 0 && (
                <div className="text-center text-slate-500">
                  Hozircha hech kim yoqtirmagan.
                </div>
              )}
              {likesList.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-2 rounded-xl border border-slate-800 hover:border-indigo-600 hover:bg-slate-800/30 transition"
                >
                  <img
                    src={u.profile_image_url}
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-semibold text-slate-100">
                      {u.name || u.username}
                    </div>
                    <div className="text-xs text-slate-400">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 👥 Modal oynasi (followers/following) */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => setModal(null)}
              className="absolute top-3 right-4 text-slate-400 hover:text-white text-xl z-10"
            >
              ✕
            </button>

            <div className="p-5 border-b border-slate-800 text-center flex-shrink-0">
              <h2 className="text-base font-semibold text-indigo-400">
                {modal === "followers" ? "Followers" : "Following"}
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Jami:{" "}
                {modal === "followers"
                  ? followStats.followers
                  : followStats.following}
              </div>
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hidden"
            >
              {listLoading && list.length === 0 && (
                <div className="py-8 text-center text-slate-400 animate-pulse">
                  Yuklanmoqda...
                </div>
              )}
              {!listLoading && list.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  Hech kim yo‘q.
                </div>
              )}

              {list.map((u) => {
                const online = isOnline(u.last_seen);
                const avatar =
                  u.profile_image_url ||
                  u.profile_image ||
                  "/public/assets/default.webp";
                return (
                  <div
                    key={u.id}
                    className="w-full flex items-center gap-3 p-3 border border-slate-800 hover:border-indigo-600 hover:bg-slate-800/40 transition rounded-xl"
                  >
                    <div
                      className="relative cursor-pointer"
                      onClick={() => openUserProfile(u.id)}
                    >
                      <img
                        src={avatar}
                        alt={u.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          online ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      ></span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-slate-100">
                        {u.name || "—"}
                      </div>
                      <div className="text-xs text-slate-400">
                        @{u.username}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {online ? "🟢 online" : `⚫ ${timeAgo(u.last_seen)}`}
                      </div>
                    </div>
                    {modal === "following" ? (
                      <button
                        onClick={() => toggleFollow(u.id, "unfollow")}
                        className="px-3 py-1 text-xs font-medium bg-rose-600/80 hover:bg-rose-700 text-white rounded-lg transition"
                      >
                        Unfollow
                      </button>
                    ) : (
                      !u.already_following && (
                        <button
                          onClick={() => toggleFollow(u.id, "follow")}
                          className="px-3 py-1 text-xs font-medium bg-indigo-600/80 hover:bg-indigo-700 text-white rounded-lg transition"
                        >
                          Follow
                        </button>
                      )
                    )}
                  </div>
                );
              })}
              {listLoading && list.length > 0 && (
                <div className="py-4 text-center text-slate-400 animate-pulse">
                  Yana yuklanmoqda...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 Stat Component
function Stat({ title, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-center hover:border-indigo-600 hover:scale-[1.02] transition shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
        {title}
      </div>
      <div className="text-2xl font-extrabold text-indigo-400">{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{note}</div>
    </div>
  );
}
