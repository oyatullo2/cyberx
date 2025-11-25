import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api("forgot_password.php", { body: { email } });
      setMsg("Agar email mavjud bo‘lsa, kod yuborildi.");
      setTimeout(
        () => nav(`/reset-password?email=${encodeURIComponent(email)}`),
        800
      );
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6">Parolni tiklash</h1>
        {msg && <div className="mb-4 text-emerald-400">{msg}</div>}
        {err && <div className="mb-4 text-red-400">{err}</div>}
        <form
          onSubmit={submit}
          className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800"
        >
          <FormInput
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
          />
          <Button type="submit">Kod yuborish</Button>
          <div className="text-sm mt-4">
            <Link to="/login" className="text-indigo-400 hover:underline">
              Kirish
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
