import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");
  const nav = useNavigate();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await login(username, password);
      nav("/dashboard");
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6">Kirish</h1>
        {err && <div className="mb-4 text-red-400">{err}</div>}
        <form onSubmit={submit} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <FormInput label="Username" value={username} onChange={setUsername} placeholder="username" />
          <FormInput label="Parol" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          <Button type="submit">Login</Button>
          <div className="text-sm mt-4 flex justify-between">
            <Link to="/register" className="text-indigo-400 hover:underline">Ro‘yxatdan o‘tish</Link>
            <Link to="/forgot-start" className="text-indigo-400 hover:underline">Parolni tiklash</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
