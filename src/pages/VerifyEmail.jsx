import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";

export default function VerifyEmail() {
  const [sp] = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const e = sp.get("email") || "";
    if (!e) {
      nav("/register", { replace: true });
      return;
    }
    setEmail(e);
  }, [sp, nav]);

  const verify = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("verify_code.php", {
        body: { email, code, type: "verify_email" },
      });
      setMsg("Tasdiqlandi! Endi login qilishingiz mumkin.");
      setTimeout(() => nav("/login"), 1000);
    } catch (er) {
      setErr(er.message);
    }
  };

  const resend = async () => {
    setErr("");
    setMsg("");
    try {
      await api("resend_code.php", { body: { email, type: "verify_email" } });
      setMsg("Kod qayta yuborildi.");
    } catch (er) {
      setErr(er.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-2">Emailni tasdiqlash</h1>
        <p className="text-slate-400 mb-4">
          <span className="text-indigo-400">{email}</span> manziliga tasdiqlash
          kodi yuborildi.
        </p>
        {msg && <div className="mb-4 text-emerald-400">{msg}</div>}
        {err && <div className="mb-4 text-red-400">{err}</div>}
        <form
          onSubmit={verify}
          className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800"
        >
          {/* Email hidden */}
          <input type="hidden" value={email} readOnly />
          <FormInput
            label="Tasdiqlash kodi"
            value={code}
            onChange={setCode}
            placeholder="******"
          />
          <div className="flex gap-2">
            <Button type="submit">Tasdiqlash</Button>
            <button
              type="button"
              onClick={resend}
              className="rounded-xl border border-slate-700 px-4 py-0"
            >
              Qayta yuborish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
