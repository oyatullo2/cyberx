import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";
import { api } from "../api/client.js";

export default function ForgotVerify() {
  const loc = useLocation();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [masked, setMasked] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // email majburiy bo‘lishi kerak
    const e = loc.state?.email;
    const m = loc.state?.masked;
    if (!e) {
      nav("/forgot-start", { replace: true });
      return;
    }
    setEmail(e);
    setMasked(m || maskEmail(e));
  }, [loc, nav]);

  // fallback mask funksiyasi (agar backenddan mask kelmagan bo‘lsa)
  function maskEmail(email) {
    const [u, d] = email.split("@");
    if (!d) return email;
    return u.slice(0, 2) + "*".repeat(Math.max(u.length - 3, 1)) + "@" + d;
  }

  const verify = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await api("verify_code.php", {
        body: { email, code, type: "reset_password" },
      });
      setMsg("Kod tasdiqlandi. Yangi parolni kiriting.");
      setTimeout(() => nav("/forgot-new", { state: { email, code } }), 700);
    } catch (er) {
      setErr(er.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await api("resend_code.php", {
        body: { email, type: "reset_password" },
      });
      setMsg("Kod qayta yuborildi.");
    } catch (er) {
      setErr(er.message || "Kod yuborishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-2">Kod tasdiqlash</h1>
        <p className="text-slate-400 mb-4">
          {masked} manziliga yuborilgan 6 xonali kodni kiriting.
        </p>

        {msg && <div className="mb-4 text-emerald-400">{msg}</div>}
        {err && <div className="mb-4 text-red-400">{err}</div>}

        <form
          onSubmit={verify}
          className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4"
        >
          <FormInput
            label="Kod 6 xonalik !"
            value={code}
            onChange={setCode}
            placeholder="******"
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
            </Button>
            <button
              type="button"
              onClick={resend}
              disabled={loading}
              className="rounded-xl border border-slate-700 px-4 py-0 hover:bg-slate-800"
            >
              {loading ? "..." : "Qayta yuborish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
