import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import TypingDots from "../components/TypingDots.jsx";

const DEF_AVA = "/public/assets/default.webp";

function fmtTime(ts) {
  if (!ts) return "";
  try {
    return new Date(String(ts).replace(" ", "T")).toLocaleString();
  } catch {
    return ts;
  }
}

export default function Messages() {
  const { token, user: me } = useAuth();
  const myId = Number(me?.id ?? 0);

  // left & users
  const [convos, setConvos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // drawer (mini panel)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // active chat
  const [activePeer, setActivePeer] = useState(null);
  const [activePeerMeta, setActivePeerMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [sinceId, setSinceId] = useState(0);
  const [loadingChat, setLoadingChat] = useState(false);

  // composer
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // typing (only peer typing visible)
  const [typing, setTyping] = useState(false);
  const typingThrottle = useRef(0);

  // search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // poll refs
  const chatBoxRef = useRef(null);
  const pollConvosRef = useRef(null);
  const pollMsgRef = useRef(null);

  // layout: to‘liq balandlik (header ~56px, 64px ga moslashtirildi, lekin responsive holda)
  const WRAP_H =
    "h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] max-h-[calc(100vh-64px)]";

  function scrollToBottom(smooth = true) {
    const el = chatBoxRef.current;
    if (!el) return;
    requestAnimationFrame(() =>
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      })
    );
  }

  function peerFromConvoRow(c) {
    const a = Number(c.a_id),
      b = Number(c.b_id);
    const peerId = a === myId ? b : a;
    const title =
      a === myId
        ? c.b_name || c.b_username || `ID ${peerId}`
        : c.a_name || c.a_username || `ID ${peerId}`;
    const img = a === myId ? c.b_img || DEF_AVA : c.a_img || DEF_AVA;
    return {
      id: peerId,
      title,
      img,
      unread: c.unread || 0,
      seen_my_last: !!c.seen_my_last,
      time: c.last_time,
      last: c.last_body || "",
    };
  }

  function removeConvoFromList(peerIdNum) {
    setConvos((prev) =>
      prev.filter(
        (c) =>
          (Number(c.a_id) === myId ? Number(c.b_id) : Number(c.a_id)) !==
          peerIdNum
      )
    );
  }

  // init + polling
  useEffect(() => {
    if (!token || !myId) return;
    let stop = false;

    (async () => {
      try {
        setLoadingConvos(true);
        const r = await api("conversations_list.php", { method: "GET", token });
        setConvos(Array.isArray(r.items) ? r.items : []);
      } finally {
        setLoadingConvos(false);
      }
      try {
        const u = await api("users_list.php?page=1&per=60", {
          method: "GET",
          token,
        });
        setUsers(Array.isArray(u.users) ? u.users : []);
      } catch {}
    })();

    const tick = async () => {
      if (stop) return;
      try {
        const r = await api("conversations_list.php", { method: "GET", token });
        setConvos(Array.isArray(r.items) ? r.items : []);
      } finally {
        pollConvosRef.current = setTimeout(tick, 2000);
      }
    };
    tick();

    return () => {
      stop = true;
      clearTimeout(pollConvosRef.current);
    };
  }, [token, myId]);

  async function openChat(peerId, meta) {
    const pid = Number(peerId);
    if (!pid || pid === activePeer) return;

    setActivePeer(pid);
    setActivePeerMeta(meta || null);
    setItems([]);
    setSinceId(0);
    setLoadingChat(true);

    try {
      const h = await api(
        `messages_history.php?peer_id=${encodeURIComponent(pid)}&limit=200`,
        { method: "GET", token }
      );
      const arr = Array.isArray(h.items) ? h.items : [];
      setItems(arr);
      if (arr.length) {
        const last = Number(arr[arr.length - 1].id);
        setSinceId(last);
        // o‘qilgan belgi
        const fd = new URLSearchParams();
        fd.set("peer_id", String(pid));
        fd.set("last_id", String(last));
        api("messages_mark_read.php", {
          method: "POST",
          token,
          body: fd,
          formData: true,
        }).catch(() => {});
      }
      setTimeout(() => scrollToBottom(false), 100); // Kirilganda eng pastga tushirish (tezroq bo'lishi uchun delay)
    } catch {
    } finally {
      setLoadingChat(false);
    }
  }

  function closeChat() {
    setActivePeer(null);
    setActivePeerMeta(null);
    setItems([]);
    setSinceId(0);
    setSearch("");
    setSearchResults([]);
  }

  // active poll
  useEffect(() => {
    if (!token || !activePeer) return;
    let stop = false;

    const tick = async () => {
      if (stop) return;
      try {
        const h = await api(
          `messages_history.php?peer_id=${encodeURIComponent(
            activePeer
          )}&since_id=${sinceId || 0}`,
          { method: "GET", token }
        );
        const arr = Array.isArray(h.items) ? h.items : [];
        if (arr.length) {
          setItems((prev) => [...prev, ...arr]);
          const last = Number(arr[arr.length - 1].id);
          setSinceId(last);
          scrollToBottom(); // Yangi xabar kelganda eng pastga tushirish

          // yangi kelganlarni o‘qilgan deb belgilaymiz (peer yozgan bo‘lsa)
          const lastFromPeer = [...arr]
            .reverse()
            .find((m) => Number(m.sender_id) !== myId);
          if (lastFromPeer) {
            const fd = new URLSearchParams();
            fd.set("peer_id", String(activePeer));
            fd.set("last_id", String(lastFromPeer.id));
            api("messages_mark_read.php", {
              method: "POST",
              token,
              body: fd,
              formData: true,
            }).catch(() => {});
          }
        }
      } catch {}
      try {
        const t = await api(
          `typing_status.php?peer_id=${encodeURIComponent(activePeer)}`,
          { method: "GET", token }
        );
        setTyping(!!t.typing);
      } catch {
        setTyping(false);
      } finally {
        pollMsgRef.current = setTimeout(tick, 1000);
      }
    };
    tick();

    return () => {
      stop = true;
      clearTimeout(pollMsgRef.current);
    };
  }, [token, activePeer, sinceId, myId]);

  // send text
  async function send() {
    const body = text.trim();
    if (!body || !activePeer || sending) return;
    setSending(true);
    setText("");

    try {
      const r = await api("messages_send.php", {
        method: "POST",
        token,
        body: { peer_id: activePeer, body },
      });
      const mid = Number(r.message_id);
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      setItems((prev) => [
        ...prev,
        {
          id: mid,
          sender_id: myId,
          receiver_id: activePeer,
          body,
          files: [],
          created_at: now,
        },
      ]);
      setSinceId(mid);
      scrollToBottom(); // Yuborilganda eng pastga tushirish

      // ro‘yxatni serverdan olib, seen/unread bilan yangilaymiz
      try {
        const rr = await api("conversations_list.php", {
          method: "GET",
          token,
        });
        setConvos(Array.isArray(rr.items) ? rr.items : []);
      } catch {}
    } catch (e) {
      alert(e.message || "Yuborishda xatolik");
    } finally {
      setSending(false);
    }
  }

  // typing (sizda ko‘rinmaydi, faqat peerda)
  useEffect(() => {
    if (!token || !activePeer) return;
    if (!text) return;
    const now = Date.now();
    if (now - (typingThrottle.current || 0) < 600) return;
    typingThrottle.current = now;
    api("typing_set.php", {
      method: "POST",
      token,
      body: { peer_id: activePeer },
    }).catch(() => {});
  }, [text, activePeer, token]);

  // delete chat
  async function deleteChat() {
    if (!activePeer || deleting) return;
    if (!confirm("Chatni to‘liq o‘chirishni tasdiqlaysizmi?")) return;
    setDeleting(true);
    try {
      const form = new URLSearchParams();
      form.set("peer_id", String(activePeer));
      await api("messages_delete_conversation.php", {
        method: "POST",
        token,
        body: form,
        formData: true,
      });
      removeConvoFromList(Number(activePeer));
      closeChat();
      try {
        const rr = await api("conversations_list.php", {
          method: "GET",
          token,
        });
        setConvos(Array.isArray(rr.items) ? rr.items : []);
      } catch {}
    } catch (e) {
      alert(e.message || "O‘chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  }

  // search
  async function runSearch() {
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const path = activePeer
      ? `messages_search.php?q=${encodeURIComponent(q)}&peer_id=${activePeer}`
      : `messages_search.php?q=${encodeURIComponent(q)}`;
    try {
      const r = await api(path, { method: "GET", token });
      setSearchResults(Array.isArray(r.items) ? r.items : []);
    } catch {
      setSearchResults([]);
    }
  }

  // derived left list
  const leftList = useMemo(() => {
    if (!convos?.length) return [];
    return convos.map((c) => {
      const p = peerFromConvoRow(c);
      return {
        key: c.id,
        peerId: p.id,
        title: p.title,
        img: p.img,
        last: p.last,
        time: p.time,
        unread: p.unread,
        seenMyLast: p.seen_my_last,
        active: p.id === activePeer,
      };
    });
  }, [convos, activePeer, myId]);

  const noConvos = leftList.length === 0;

  // UI
  return (
    <div
      className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${WRAP_H} flex flex-col mt-[-4px] md:grid md:grid-cols-3 md:gap-4 overflow-hidden`}
    >
      {/* LEFT (mobileda activePeer bo'lmasa ko'rinadi, md+ da doim) */}
      <div
        className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          activePeer ? "hidden md:block" : "block"
        } md:col-span-1 flex flex-col`}
      >
        <div className="text-sm text-slate-400 mb-3">
          {noConvos ? "Foydalanuvchilar" : "Chats"}
        </div>

        {/* search bar (global, faqat md+ da ko'rinadi, phoneda kerak emas deb hisoblangan) */}
        <div className="mb-3 gap-2 hidden md:flex">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-indigo-600"
            placeholder={
              activePeer ? "Bu chatda qidirish…" : "Barcha chatlarda qidirish…"
            }
          />
          <button
            onClick={runSearch}
            className="rounded-xl border border-slate-800 px-3 sm:px-4 py-2 text-sm hover:border-indigo-600 flex items-center justify-center"
          >
            🔍
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-3 text-xs text-slate-400 hidden md:block">
            Natijalar: {searchResults.length}
          </div>
        )}

        {loadingConvos && noConvos && searchResults.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse"
              />
            ))}
          </div>
        ) : noConvos ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="relative group rounded-2xl border border-slate-800 bg-slate-900/40 p-2 overflow-hidden transition-all hover:shadow-md"
              >
                <img
                  src={u.profile_image_url || DEF_AVA}
                  alt={u.username}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                <div className="mt-2 text-sm truncate">{u.name || "—"}</div>
                <div className="text-xs text-slate-500 truncate">
                  @{u.username}
                </div>
                <button
                  onClick={() =>
                    openChat(Number(u.id), {
                      id: Number(u.id),
                      title: u.name || u.username,
                      img: u.profile_image_url || DEF_AVA,
                    })
                  }
                  className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition rounded-xl border border-indigo-600 bg-slate-900/70 text-xs px-3 py-1 hover:bg-indigo-600/20"
                >
                  💬
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 flex-1">
            {leftList.map((it) => (
              <button
                key={it.key}
                onClick={() =>
                  openChat(Number(it.peerId), {
                    id: Number(it.peerId),
                    title: it.title,
                    img: it.img,
                  })
                }
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  it.active
                    ? "border-indigo-600 bg-slate-900/60 shadow-md"
                    : "border-slate-800 bg-slate-900/40 hover:border-indigo-600 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={it.img}
                    alt={it.title}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{it.title}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {it.last || "—"}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-right">
                    {Number(it.unread) > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-600 text-[10px] px-1">
                        {it.unread}
                      </span>
                    )}
                    {it.active ? null : it.seenMyLast ? (
                      <span className="text-[12px]">✔✔</span>
                    ) : (
                      <span className="text-[12px] opacity-40">✔</span>
                    )}
                    <div className="text-[10px] text-slate-500 whitespace-nowrap">
                      {fmtTime(it.time)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT (mobileda activePeer bo'lsa ko'rinadi, md+ da doim) */}
      <div
        className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 flex flex-col overflow-hidden ${
          activePeer ? "block" : "hidden md:block"
        } md:col-span-2`}
      >
        {!activePeer ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center px-4">
            Chap paneldan chatni tanlang yoki <b>o‘ng pastdagi</b> “New message”
            tugmasini bosing.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-3 flex-1">
                {/* Back button (faqat mobileda) */}
                <button
                  onClick={closeChat}
                  className="md:hidden text-slate-400 hover:text-white mr-2"
                >
                  ←
                </button>
                <img
                  src={activePeerMeta?.img || DEF_AVA}
                  alt={activePeerMeta?.title || `ID ${activePeer}`}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-800"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {activePeerMeta?.title || `ID ${activePeer}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ID: {activePeer}
                  </div>
                </div>
              </div>
              <button
                onClick={deleteChat}
                disabled={deleting}
                className="rounded-xl border border-slate-800 px-3 py-1.5 text-xs hover:border-indigo-600 transition disabled:opacity-60 flex items-center gap-1"
              >
                {deleting ? "O‘chirilmoqda…" : "🗑️ Chatni o‘chirish"}
              </button>
            </div>

            {/* search bar (chat ichida, faqat md+ da ko'rinadi) */}
            {activePeer && (
              <div className="mb-3 gap-2 hidden md:flex">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  placeholder="Bu chatda qidirish…"
                />
                <button
                  onClick={runSearch}
                  className="rounded-xl border border-slate-800 px-3 sm:px-4 py-2 text-sm hover:border-indigo-600 flex items-center justify-center"
                >
                  🔍
                </button>
              </div>
            )}

            {/* chat body (flex-1 bilan cheklangan, scroll yashirin) */}
            <div
              ref={chatBoxRef}
              className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {loadingChat && items.length === 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] ${i % 2 ? "ml-auto" : ""}`}
                    >
                      <div className="h-14 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center">
                  Hozircha xabar yo‘q. Suhbatni boshlang.
                </div>
              ) : searchResults.length > 0 ? (
                // Search natijalari (faqat md+ da, chunki search hidden mobileda)
                searchResults.map((m) => {
                  const mine = Number(m.sender_id) === myId;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[80%] sm:max-w-[70%] ${
                        mine ? "ml-auto text-right" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl border p-2 sm:p-3 text-sm ${
                          mine
                            ? "border-indigo-600 bg-slate-900/70"
                            : "border-slate-800 bg-slate-900/60"
                        }`}
                      >
                        {m.body && (
                          <div className="whitespace-pre-wrap break-words mb-1">
                            {m.body}
                          </div>
                        )}
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <div className="text-[10px] text-slate-500">
                            {fmtTime(m.created_at)}
                          </div>
                          {mine && (
                            <span className="text-[12px]">
                              {/* check mark (local) */}✔
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                items.map((m) => {
                  const mine = Number(m.sender_id) === myId;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[80%] sm:max-w-[70%] ${
                        mine ? "ml-auto text-right" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl border p-2 sm:p-3 text-sm ${
                          mine
                            ? "border-indigo-600 bg-slate-900/70"
                            : "border-slate-800 bg-slate-900/60"
                        }`}
                      >
                        {m.body && (
                          <div className="whitespace-pre-wrap break-words mb-1">
                            {m.body}
                          </div>
                        )}
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <div className="text-[10px] text-slate-500">
                            {fmtTime(m.created_at)}
                          </div>
                          {mine && (
                            <span className="text-[12px]">
                              {/* check mark (local) */}✔
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {typing && <TypingDots />}
            </div>

            {/* composer (responsive, iconli send) */}
            <div className="mt-3 flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm outline-none focus:border-indigo-600"
                placeholder="Xabar yozing…"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="rounded-xl border border-indigo-600 px-4 py-2 text-sm hover:bg-indigo-600/10 transition disabled:opacity-60 flex items-center justify-center"
              >
                {sending ? "..." : "➤"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating mini panel (o‘ng-pastda, responsive, mobileda doim ko'rinadi agar activePeer bo'lmasa) */}
      <button
        onClick={() => setDrawerOpen((v) => !v)}
        className={`fixed bottom-5 right-5 z-40 rounded-full border border-indigo-600 bg-slate-900/80 px-4 py-2 text-sm shadow-xl hover:bg-slate-900 flex items-center gap-1 ${
          activePeer ? "md:block hidden" : ""
        }`}
      >
        💬 New message
      </button>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute right-0 top-[50px] bottom-0 w-full sm:w-[360px] bg-slate-950 border-l border-slate-800 p-3 sm:p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Foydalanuvchilar</div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full mb-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              placeholder="Qidirish…"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {users
                .filter((u) =>
                  (u.name || u.username || "")
                    .toLowerCase()
                    .includes(userSearch.toLowerCase())
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="relative group rounded-2xl border border-slate-800 bg-slate-900/40 p-2 overflow-hidden transition-all hover:shadow-md"
                  >
                    <img
                      src={u.profile_image_url || DEF_AVA}
                      alt={u.username}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <div className="mt-2 text-sm truncate">{u.name || "—"}</div>
                    <div className="text-xs text-slate-500 truncate">
                      @{u.username}
                    </div>
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        openChat(Number(u.id), {
                          id: Number(u.id),
                          title: u.name || u.username,
                          img: u.profile_image_url || DEF_AVA,
                        });
                      }}
                      className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition rounded-xl border border-indigo-600 bg-slate-900/70 text-xs px-3 py-1 hover:bg-indigo-600/20"
                    >
                      💬
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
