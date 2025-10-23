import { useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";

export default function ResetPassword() {
  const [sp]=useSearchParams();
  const [email,setEmail]=useState(sp.get("email")||"");
  const [code,setCode]=useState("");
  const [newPass,setNewPass]=useState("");
  const [msg,setMsg]=useState("");
  const [err,setErr]=useState("");

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api("reset_password.php", { body: { email, code, new_password: newPass } });
      setMsg("Parol yangilandi! Endi kirishingiz mumkin.");
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6">Yangi parol</h1>
        {msg && <div className="mb-4 text-emerald-400">{msg}</div>}
        {err && <div className="mb-4 text-red-400">{err}</div>}
        <form onSubmit={submit} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <FormInput label="Email" value={email} onChange={setEmail} type="email" />
          <FormInput label="Kod (6 xonali)" value={code} onChange={setCode} placeholder="123456" />
          <FormInput label="Yangi parol" value={newPass} onChange={setNewPass} type="password" placeholder="Kamida 8 belgi" />
          <Button type="submit">Parolni yangilash</Button>
          <div className="text-sm mt-4">
            <Link to="/login" className="text-indigo-400 hover:underline">Kirish</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
