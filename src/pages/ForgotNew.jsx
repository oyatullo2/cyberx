import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";

export default function ForgotNew() {
  const loc = useLocation();
  const nav = useNavigate();
  const [email,setEmail]=useState("");
  const [code,setCode]=useState("");
  const [p1,setP1]=useState("");
  const [p2,setP2]=useState("");
  const [err,setErr]=useState("");
  const [msg,setMsg]=useState("");

  useEffect(()=>{
    if (!loc.state?.email || !loc.state?.code) { nav("/forgot-start", { replace:true }); return; }
    setEmail(loc.state.email);
    setCode(loc.state.code);
  },[loc,nav]);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    if (p1.length < 8) { setErr("Parol kamida 8 belgidan iborat bo‘lsin"); return; }
    if (p1 !== p2) { setErr("Parollar mos emas"); return; }
    try {
      await api("reset_password.php", { body: { email, code, new_password: p1 } });
      setMsg("Parol yangilandi! Login sahifasiga o‘tkazilmoqda…");
      setTimeout(()=> nav("/login", { replace:true }), 600);
    } catch (e) { setErr(e.message); }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6">Yangi parol</h1>
        {msg && <div className="mb-4 text-emerald-400">{msg}</div>}
        {err && <div className="mb-4 text-red-400">{err}</div>}
        <form onSubmit={submit} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <FormInput label="Yangi parol" value={p1} onChange={setP1} type="password" placeholder="Kamida 8 belgi" />
          <FormInput label="Parolni tasdiqlang" value={p2} onChange={setP2} type="password" placeholder="Yangi parolni tasdiqlang" />
          <Button type="submit">Parolni yangilash</Button>
        </form>
      </div>
    </div>
  );
}
