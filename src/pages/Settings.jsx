import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function useDebounce(value, delay = 500) {
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

  // local states
  const [uname, setUname] = useState("");
  const [unameOk, setUnameOk] = useState(null);
  const debUname = useDebounce(uname, 450);

  const [curPass, setCurPass] = useState("");
  const [passStage, setPassStage] = useState(0); // 0: current, 1: new+confirm
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [passModal, setPassModal] = useState(false);
  const [passCode, setPassCode] = useState("");
  const [email, setEmail] = useState("");
  const [emailOk, setEmailOk] = useState(null);
  const debEmail = useDebounce(email, 450);
  const [emailModal, setEmailModal] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [name, setName] = useState("");
  const [nameHint, setNameHint] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!token) return;
    api("me.php", { method: "GET", token }).then((d) => {
      setMe(d);
      setUname(d.username || "");
      setEmail(d.email || "");
      setName(d.name || "");
      setUser((prev) => (prev ? { ...prev, username: d.username } : prev));
      setNameHint(
        d.can_change_name_at
          ? `Keyingi o‘zgartirish: ${new Date(
              d.can_change_name_at
            ).toLocaleString()}`
          : ""
      );
    });
  }, [token, setUser]);

  // username availability
  useEffect(() => {
    if (!debUname || debUname === me?.username) {
      setUnameOk(null);
      return;
    }
    api("username_check.php", { body: { username: debUname }, token })
      .then((r) => setUnameOk(r.available))
      .catch(() => setUnameOk(null));
  }, [debUname, me, token]);

  // email availability
  useEffect(() => {
    if (!debEmail || debEmail === me?.email) {
      setEmailOk(null);
      return;
    }
    api("email_check.php", { body: { email: debEmail }, token })
      .then((r) => setEmailOk(r.available))
      .catch(() => setEmailOk(null));
  }, [debEmail, me, token]);

  // actions
  async function saveUsername() {
    if (uname === me.username) return;
    if (!unameOk) return;
    const r = await api("update_username.php", {
      body: { username: uname },
      token,
    });
    setMe((m) => ({ ...m, username: r.username }));
    setUser((prev) => (prev ? { ...prev, username: r.username } : prev));
  }

  async function startPasswordChange(e) {
    e.preventDefault();
    const r = await api("password_change_request.php", {
      body: { current_password: curPass },
      token,
    });
    setPassStage(1);
    setPassModal(true); // kodni kiritish oynasi
  }
  async function confirmPasswordChange() {
    if (p1.length < 8 || p1 !== p2) return;
    await api("password_change_confirm.php", {
      body: { code: passCode, new_password: p1, new_password_confirm: p2 },
      token,
    });
    setPassModal(false);
    await logout(); // majburiy chiqish
  }

  async function requestEmailChangeModal() {
    if (email === me.email) return;
    if (!emailOk) return;
    const r = await api("email_change_request.php", { method: "POST", token });
    setEmailModal(true);
  }
  async function confirmEmailChange() {
    await api("email_change_confirm.php", {
      body: { new_email: email, code: emailCode },
      token,
    });
    setEmailModal(false);
    setMe((m) => ({ ...m, email }));
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

  async function uploadAvatar(e){
  const f = e.target.files?.[0]; 
  if(!f) return;
  if (!["image/jpeg","image/png","image/webp"].includes(f.type)) {
    return;
  }
  const fd = new FormData();
  fd.append("avatar", f);
  try {
    const resp = await api("upload_avatar.php", { method:"POST", body: fd, formData: true, token });
    setMe(m=>({...m, profile_image_url: resp.profile_image_url}));
    setMsg("Profil rasmi yangilandi ✅");
  } catch(err){
    setErr("Rasmni yuklab bo‘lmadi: " + err.message);
  }
}

  if (!me) return <div className="p-6">Yuklanmoqda…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8">
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
              className="rounded-xl border border-slate-700 px-4 py-2"
              onClick={() => fileRef.current?.click()}
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
              JPG/PNG/WebP. 256×256 ga siqiladi va dumaloq ko‘rinishda
              saqlanadi.
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
            {unameOk === true && (
              <span className="text-emerald-400">Bo‘sh</span>
            )}
            {unameOk === false && <span className="text-red-400">Band</span>}
            {unameOk === null && (
              <span className="text-slate-400">Faqat [a-zA-Z0-9_.], 3..32</span>
            )}
          </div>
          <button
            onClick={saveUsername}
            disabled={uname === me.username || unameOk === false}
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
          {passStage === 0 && (
            <>
              <input
                type="password"
                value={curPass}
                onChange={(e) => setCurPass(e.target.value)}
                placeholder="Joriy parol"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <button
                onClick={startPasswordChange}
                className="mt-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2"
              >
                Davom etish
              </button>
            </>
          )}
          {passStage === 1 && (
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
                onClick={() => setPassModal(true)}
                disabled={p1.length < 8 || p1 !== p2}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 disabled:opacity-50"
              >
                Kod yuborildi – Tasdiqlash
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
            {emailOk === true && (
              <span className="text-emerald-400">Bo‘sh</span>
            )}
            {emailOk === false && <span className="text-red-400">Band</span>}
            {emailOk === null && (
              <span className="text-slate-400">Yangi email bo‘lishi shart</span>
            )}
          </div>
          <button
            onClick={requestEmailChangeModal}
            disabled={email === me.email || emailOk === false}
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
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2"
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
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2"
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
