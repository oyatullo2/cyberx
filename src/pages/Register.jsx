import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api("register.php", { body: { name, username, email, password } });
      nav("/verify-email?email=" + encodeURIComponent(email));
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6">Ro‘yxatdan o‘tish</h1>
        {err && <div className="mb-4 text-red-400">{err}</div>}
        <form
          onSubmit={submit}
          className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800"
        >
          <FormInput
            label="Ism"
            value={name}
            onChange={setName}
            placeholder="Full Name"
          />
          <FormInput
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="username"
          />
          <FormInput
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
          />
          <FormInput
            label="Parol"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="password"
          />
          <Button type="submit">Ro‘yxatdan o‘tish</Button>
          <div className="text-sm mt-4">
            <Link to="/login" className="text-indigo-400 hover:underline">
              Allaqachon akkauntim bor
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
