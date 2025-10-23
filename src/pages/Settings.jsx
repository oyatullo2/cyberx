// src/pages/Settings.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function useDebounce(value, delay = 450) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function Settings() {
  const { token, user, logout, setUser } = useAuth();
  const [me, setMe] = useState(null);

  // Username
  const [uname, setUname] = useState("");
  const debU = useDebounce(uname);
  const [uOk, setUOk] = useState(null);

  // Name
  const [name, setName] = useState("");
  const [nameHint, setNameHint] = useState("");

  // Email
  const [email, setEmail] = useState("");
  const debE = useDebounce(email);
  const [eOk, setEOk] = useState(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailCode, setEmailCode] = useState("");

  // Password staged flow
  const [stage, setStage] = useState(0); // 0=current, 1=new+confirm, 2=await code
  const [cur, setCur] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [passModal, setPassModal] = useState(false);
  const [passCode, setPassCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Avatar
  const fileRef = useRef();

  useEffect(() => {
    if (!token) return;
    api("me.php", { method: "GET", token }).then((d) => {
      setMe(d);
      setUname(d.username || "");
      setName(d.name || "");
      setEmail(d.email || "");
      setNameHint(
        d.can_change_name_at
          ? `Keyingi o‘zgartirish: ${new Date(
              d.can_change_name_at
            ).toLocaleString()}`
          : ""
      );
      setUser((prev) => (prev ? { ...prev, username: d.username } : prev));
    });
  }, [token, setUser]);

  // Username availability
  useEffect(() => {
    if (!debU || !token || debU === me?.username) {
      setUOk(null);
      return;
    }
    api("username_check.php", { body: { username: debU }, token })
      .then((r) => setUOk(r.available))
      .catch(() => setUOk(null));
  }, [debU, token, me]);

  // Email availability
  useEffect(() => {
    if (!debE || !token || debE === me?.email) {
      setEOk(null);
      return;
    }
    api("email_check.php", { body: { email: debE }, token })
      .then((r) => setEOk(r.available))
      .catch(() => setEOk(null));
  }, [debE, token, me]);

  async function saveUsername() {
    if (uname === me.username || uOk === false) return;
    const r = await api("update_username.php", {
      body: { username: uname },
      token,
    });
    setMe((m) => ({ ...m, username: r.username }));
    setUser((prev) => (prev ? { ...prev, username: r.username } : prev));
  }

  async function saveName() {
    const r = await api("update_name.php", { body: { name }, token });
    setMe((m) => ({ ...m, name }));
    setNameHint(
      r.can_change_name_at
        ? `Keyingi o‘zgartirish: ${new Date(
            r.can_change_name_at
          ).toLocaleString()}`
        : ""
    );
  }

  // Password flow:
  // 1) tekshirish
  async function checkCurrentPassword() {
    setBusy(true);
    try {
      await api("password_change_check.php", {
        body: { current_password: cur },
        token,
      });
      setStage(1); // endi yangi parollar ochiladi
    } finally {
      setBusy(false);
    }
  }
  // 2) kod yuborish
  async function sendPasswordCode() {
    if (p1.length < 8 || p1 !== p2) return;
    setBusy(true);
    try {
      await api("password_change_send_code.php", { method: "POST", token });
      setPassModal(true);
      setStage(2);
    } finally {
      setBusy(false);
    }
  }
  // 3) tasdiqlab yangilash
  async function confirmPasswordChange() {
    if (!passCode) return;
    setBusy(true);
    try {
      await api("password_change_confirm.php", {
        body: { code: passCode, new_password: p1 },
        token,
      });
      setPassModal(false);
      await logout();
    } finally {
      setBusy(false);
    }
  }

  // Email flow
  async function requestEmailCode() {
    if (email === me.email || eOk === false) return;
    setBusy(true);
    try {
      await api("email_change_request.php", { method: "POST", token });
      setEmailModal(true);
    } finally {
      setBusy(false);
    }
  }
  async function confirmEmailChange() {
    setBusy(true);
    try {
      await api("email_change_confirm.php", {
        body: { new_email: email, code: emailCode },
        token,
      });
      setEmailModal(false);
      setMe((m) => ({ ...m, email }));
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      alert("Faqat JPG, PNG yoki WEBP formatiga ruxsat beriladi!");
      return;
    }
    const fd = new FormData();
    fd.append("avatar", f);
    try {
      const resp = await api("upload_avatar.php", {
        method: "POST",
        body: fd,
        formData: true,
        token,
      });
      setMe((m) => ({ ...m, profile_image_url: resp.profile_image_url }));
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  }

  if (!me) return <div className="p-8">Yuklanmoqda…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8">
      {/* Avatar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-xl font-bold mb-4">Profil</h2>
        <div className="flex items-center gap-4">
          <img
            src={me.profile_image_url}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-slate-700 px-4 py-2"
            >
              Rasm yuklash
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={uploadAvatar}
            />
            <div className="text-xs text-slate-500 mt-2">
              JPG/PNG/WebP qabul qilinadi. 256×256 webp sifatida saqlanadi.
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Username */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="font-semibold mb-3">Username</h3>
          <input
            value={uname}
            onChange={(e) => setUname(e.target.value)}
            placeholder="oyat_uz"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
          />
          <div className="text-sm mt-2">
            {uOk === true && <span className="text-emerald-400">Bo‘sh</span>}
            {uOk === false && <span className="text-red-400">Band</span>}
            {uOk === null && (
              <span className="text-slate-400">[a-zA-Z0-9_.], 3..32</span>
            )}
          </div>
          <button
            onClick={saveUsername}
            disabled={uname === me.username || uOk === false}
            className="mt-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 disabled:opacity-50"
          >
            Saqlash
          </button>
        </div>

        {/* Name */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="font-semibold mb-3">Ism</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ismingiz"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
          />
          <div className="text-sm text-slate-400 mt-2">{nameHint}</div>
          <button
            onClick={saveName}
            className="mt-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2"
          >
            Saqlash
          </button>
        </div>

        {/* Password */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="font-semibold mb-3">Parol</h3>

          {stage === 0 && (
            <div className="space-y-3">
              <input
                type="password"
                value={cur}
                onChange={(e) => setCur(e.target.value)}
                placeholder="Joriy parol"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <button
                onClick={checkCurrentPassword}
                disabled={busy}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 disabled:opacity-50"
              >
                Davom etish
              </button>
            </div>
          )}

          {stage === 1 && (
            <div className="space-y-3">
              <input
                type="password"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                placeholder="Yangi parol"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <input
                type="password"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                placeholder="Parolni tasdiqlash"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <button
                onClick={sendPasswordCode}
                disabled={busy || p1.length < 8 || p1 !== p2}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 disabled:opacity-50"
              >
                Kod yuborish
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="font-semibold mb-3">Email</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
          />
          <div className="text-sm mt-2">
            {eOk === true && <span className="text-emerald-400">Bo‘sh</span>}
            {eOk === false && <span className="text-red-400">Band</span>}
            {eOk === null && (
              <span className="text-slate-400">Yangi email bo‘lishi shart</span>
            )}
          </div>
          <button
            onClick={requestEmailCode}
            disabled={busy || email === me.email || eOk === false}
            className="mt-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 disabled:opacity-50"
          >
            Kod yuborish
          </button>
        </div>
      </div>

      {/* Password modal */}
      {passModal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur p-6">
            <h4 className="font-semibold mb-2">Emailga yuborilgan kod</h4>
            <input
              value={passCode}
              onChange={(e) => setPassCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setPassModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmPasswordChange}
                disabled={busy}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 disabled:opacity-50"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur p-6">
            <h4 className="font-semibold mb-2">
              Joriy emailingizga yuborilgan kod
            </h4>
            <input
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEmailModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmEmailChange}
                disabled={busy}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 disabled:opacity-50"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
