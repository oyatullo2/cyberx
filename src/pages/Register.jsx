import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import TelegramButton from "../components/TelegramButton.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const { loginWithGoogleIdToken, loginWithGithubCode } = useAuth();

  const redirectUri = useMemo(() => {
    const origin = window.location.origin;
    if (origin.includes("localhost")) return "http://localhost:5173/register";
    return "https://www.cyberex.uz/register";
  }, []);

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

  // Google signup
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!window.google || !clientId) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setErr("");
            const idToken = response.credential;
            await loginWithGoogleIdToken(idToken);
            nav("/dashboard");
          } catch (e) {
            setErr(e.message || "Google orqali ro‘yxatdan o‘tishda xatolik");
          }
        },
        ux_mode: "popup",
      });
    } catch (e) {
      console.error(e);
    }
  }, [nav, loginWithGoogleIdToken]);

  function handleGoogleSignup() {
    if (!window.google || !window.google.accounts?.id) return;
    window.google.accounts.id.prompt();
  }

  // GitHub signup
  function startGithubSignup() {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
      scope: "read:user user:email",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const onRegisterPage = window.location.pathname === "/register";
    if (onRegisterPage && code) {
      (async () => {
        try {
          setErr("");
          await loginWithGithubCode(code);
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          window.history.replaceState({}, "", url.pathname);
          nav("/dashboard");
        } catch (e) {
          setErr(e.message || "GitHub orqali ro‘yxatdan o‘tishda xatolik");
        }
      })();
    }
  }, [loginWithGithubCode, nav, redirectUri]);

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

          {/* Social signup */}
          <div className="mt-4 space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full rounded-xl bg-white text-gray-900 hover:bg-gray-100 px-4 py-3 font-semibold shadow-lg flex items-center justify-center gap-3 border border-gray-300 transition"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="font-medium">
                Google orqali ro‘yxatdan o‘tish
              </span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={startGithubSignup}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 font-semibold shadow-lg flex items-center justify-center gap-3 border border-slate-700 text-slate-100 transition"
            >
              <svg
                height="20"
                width="20"
                viewBox="0 0 16 16"
                className="opacity-90"
              >
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8a8.013 8.013 0 0 0 5.47 7.59c.4.075.55-.175.55-.387 0-.19-.007-.693-.01-1.36-2.23.485-2.7-1.074-2.7-1.074-.364-.925-.89-1.17-.89-1.17-.727-.497.055-.487.055-.487.804.057 1.228.826 1.228.826.714 1.222 1.872.869 2.328.665.072-.517.28-.869.508-1.069-1.78-.2-3.644-.89-3.644-3.963 0-.875.312-1.59.824-2.15-.083-.203-.357-1.017.078-2.122 0 0 .672-.216 2.2.82a7.688 7.688 0 0 1 2.003-.27c.68.003 1.366.092 2.004.27 1.528-1.036 2.198-.82 2.198-.82.437 1.105.162 1.919.08 2.122.514.56.823 1.275.823 2.15 0 3.082-1.867 3.76-3.65 3.956.288.25.543.738.543 1.486 0 1.074-.01 1.942-.01 2.203 0 .215.147.467.553.387A8.014 8.014 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
              GitHub orqali ro‘yxatdan o‘tish
            </button>

            {/* Telegram – register wording */}
            <TelegramButton text="Telegram orqali ro‘yxatdan o‘tish" />
          </div>

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
