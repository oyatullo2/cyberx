import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";

export default function ForgotStart() {
  const [identifier, setIdentifier] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    try {
      const res = await api("forgot_password.php", { body: { identifier } });
      if (res.email_sent) {
        setInfo(`${res.masked_email} manziliga kod yuborildi.`);
        // Keyingi sahifaga real emailni state orqali uzatamiz (ko‘rsatmaymiz)
        setTimeout(
          () =>
            nav("/forgot-verify", {
              state: { email: res.email, masked: res.masked_email },
            }),
          600
        );
      } else {
        setInfo("Agar hisob mavjud bo‘lsa, kod yuborildi.");
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6">Parolni tiklash</h1>
        {info && <div className="mb-4 text-emerald-400">{info}</div>}
        {err && <div className="mb-4 text-red-400">{err}</div>}
        <form
          onSubmit={submit}
          className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800"
        >
          <FormInput
            label="Email yoki Username"
            value={identifier}
            onChange={setIdentifier}
            placeholder="you@example.com or username"
          />
          <Button type="submit">Kod yuborish</Button>
          <div className="text-sm mt-4 flex justify-between">
            <Link to="/register" className="text-indigo-400 hover:underline">Ro‘yxatdan o‘tish</Link>
            <Link to="/login" className="text-indigo-400 hover:underline">Kirish</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
