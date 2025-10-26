import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
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
  return Date.now() - new Date(lastSeen).getTime() < 30 * 1000;
}

export default function UserProfile() {
  const { token: urlToken } = useParams(); // ✅ token nomi
  const nav = useNavigate();
  const { user: me, token, loading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [done, setDone] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const listRef = useRef(null);
  const [posts, setPosts] = useState([]);
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

      setPosts((prev) =>
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
  useEffect(() => {
  if (!urlToken || !token) return;

  const interval = setInterval(async () => {
    try {
      const res = await api(
        `user_posts.php?t=${encodeURIComponent(urlToken)}&page=1&per=10`,
        { method: "GET", token }
      );
      const data = res.data || res;
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e) {
      console.error("Postlar yangilanishida xato:", e);
    }
  }, 5000); // 5 soniyada yangilab turadi

  return () => clearInterval(interval);
}, [urlToken, token]);


  useEffect(() => {
    if (!token || !urlToken) return;
    (async () => {
      setPostsBusy(true);
      try {
        const res = await api(
          `user_posts.php?t=${encodeURIComponent(urlToken)}&page=1&per=10`,
          {
            method: "GET",
            token,
          }
        );
        const data = res.data || res;
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (e) {
        console.error("Profil postlari yuklanmadi:", e);
        // Ruxsat xatosi bo'lsa dashboardga qaytaramiz (avval kelishilganidek)
        nav("/dashboard", { replace: true });
      } finally {
        setPostsBusy(false);
      }
    })();
  }, [urlToken, token, nav]);

  const isMe = useMemo(() => {
    if (!me || !profile) return false;
    return String(me.id) === String(profile.id);
  }, [me, profile]);

  useEffect(() => {
    if (!loading && !me) nav("/login");
  }, [loading, me, nav]);

  // ✅ PROFIL ma’lumotini token bilan olamiz
  useEffect(() => {
    if (!urlToken || !token) return;
    setError("");
    setProfile(null);
    (async () => {
      try {
        const res = await api(
          `user_profile.php?t=${encodeURIComponent(urlToken)}`,
          {
            method: "GET",
            token, // Authorization: Bearer ...
          }
        );
        const p = res.user || res;

        setProfile({
          id: p.id,
          username: p.username,
          name: p.name,
          email: p.email,
          profile_image:
            p.profile_image_url ||
            p.profile_image ||
            "/public/assets/default.webp",
          last_seen: p.last_seen,
          followers: Number(res.followers ?? p.followers ?? 0),
          following: Number(res.following ?? p.following ?? 0),
          already_following: Boolean(
            res.is_following ?? p.is_following ?? false
          ),
          bio: p.bio || "",
        });
      } catch (e) {
        setError(e?.message || "Foydalanuvchi topilmadi");
      }
    })();
  }, [urlToken, token]);

  async function toggleFollow() {
    if (!profile || isMe || busy) return;
    setBusy(true);
    try {
      await api("follow_toggle.php", {
        method: "POST",
        token,
        body: { target_id: profile.id },
      });
      setProfile((p) =>
        !p
          ? p
          : {
              ...p,
              already_following: !p.already_following,
              followers: p.followers + (p.already_following ? -1 : 1),
            }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function loadList(pn = 1, reset = false) {
    if (!modal || listLoading || (done && !reset) || !profile) return;
    setListLoading(true);
    try {
      const endpoint =
        modal === "followers"
          ? `user_followers.php?id=${profile.id}&page=${pn}&per=24`
          : `user_following.php?id=${profile.id}&page=${pn}&per=24`;
      const res = await api(endpoint, { method: "GET", token });
      const arrKey = modal === "followers" ? "followers" : "following";
      const data = Array.isArray(res[arrKey]) ? res[arrKey] : [];
      if (reset) setList(data);
      else setList((prev) => [...prev, ...data]);
      setPage(pn);
      if (data.length === 0) setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  }

  function openFollowList(type) {
    setModal(type);
    setList([]);
    setPage(1);
    setDone(false);
    setListLoading(false);
  }
  useEffect(() => {
    if (modal) loadList(1, true);
  }, [modal]); // eslint-disable-line

  useEffect(() => {
    if (!modal || !listRef.current) return;
    const el = listRef.current;
    const handler = () => {
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight < 150 &&
        !listLoading &&
        !done
      ) {
        loadList(page + 1, false);
      }
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [modal, page, listLoading, done]);

  if (loading)
    return <div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>;
  if (error)
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="rounded-2xl border border-rose-700/40 bg-rose-900/20 p-6 text-rose-200">
          {error}
        </div>
      </div>
    );
  if (!profile) return null;

  const online = isOnline(profile.last_seen);

  return (
    <div className="flex flex-col p-6 sm:p-8 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* 🧑 Profil header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.profile_image}
                alt={profile.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-800 shadow-lg"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 ${
                  isOnline(profile.last_seen)
                    ? "bg-emerald-400"
                    : "bg-slate-600"
                }`}
                title={
                  isOnline(profile.last_seen)
                    ? "online"
                    : timeAgo(profile.last_seen)
                }
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">
                {profile.name || profile.username}
              </h1>
              <div className="text-sm text-slate-400">@{profile.username}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isOnline(profile.last_seen)
                  ? "🟢 online"
                  : `⚫ ${timeAgo(profile.last_seen)}`}
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => openFollowList("followers")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  Followers: {profile.followers}
                </button>
                <button
                  onClick={() => openFollowList("following")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  Following: {profile.following}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {isMe ? (
              <button
                onClick={() => nav("/settings")}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-indigo-600 hover:text-indigo-300 transition"
              >
                Edit profile
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                disabled={busy}
                className={`rounded-xl px-4 py-2 text-sm transition shadow-sm ${
                  profile.already_following
                    ? "border border-rose-700/60 hover:bg-rose-800/30 text-rose-200"
                    : "border border-indigo-700/60 hover:bg-indigo-800/30 text-indigo-200"
                }`}
              >
                {profile.already_following
                  ? busy
                    ? "Unfollowing..."
                    : "Unfollow"
                  : busy
                  ? "Following..."
                  : "Follow"}
              </button>
            )}
          </div>
        </header>

        {/* 🧾 Bio */}
        {profile.bio && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-md">
            <h2 className="font-bold text-lg mb-2 text-indigo-400">Bio</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </section>
        )}

        {/* 🖼️ Postlar (Aktivlik) */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-md">
          <h2 className="font-bold text-lg mb-3 text-indigo-400">Aktivlik</h2>

          {postsBusy && <div className="text-slate-400">Yuklanmoqda…</div>}
          {!postsBusy && posts.length === 0 && (
            <div className="text-slate-500 text-sm">Hozircha post yo‘q.</div>
          )}

          <div className="space-y-4">
            {posts.map((p) => (
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

                  {isMe && p.likes_count > 0 && (
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
                {modal === "followers" ? profile.followers : profile.following}
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
                const onlineU = isOnline(u.last_seen);
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
                      onClick={() => nav(`/users/${btoa(String(u.id))}.${"x"}`)}
                    >
                      <img
                        src={avatar}
                        alt={u.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          onlineU ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-slate-100">
                        {u.name || "—"}
                      </div>
                      <div className="text-xs text-slate-400">
                        @{u.username}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {onlineU ? "🟢 online" : `⚫ ${timeAgo(u.last_seen)}`}
                      </div>
                    </div>
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
