import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const {
    loginWithGoogleIdToken,
    loginWithGithubCode,
    loginWithTelegramPayload,
  } = useAuth();
  const googleDivRef = useRef(null);
  const telegramDivRef = useRef(null);

  const redirectUri = useMemo(() => {
    const origin = window.location.origin;
    if (origin.includes("localhost")) return "http://localhost:5173/register";
    return "https://cyberex.uz/register";
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

  // Google
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!window.google || !clientId || !googleDivRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setErr("");
            await loginWithGoogleIdToken(response.credential);
            nav("/dashboard");
          } catch (e) {
            setErr(e.message || "Google login xatosi");
          }
        },
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(googleDivRef.current, {
        type: "standard",
        shape: "pill",
        theme: "filled_blue",
        size: "large",
        text: "signup_with",
        logo_alignment: "left",
        width: 320,
      });
    } catch (e) {
      console.error(e);
    }
  }, [nav, loginWithGoogleIdToken]);

  // GitHub start
  function startGithubSignup() {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
      scope: "read:user user:email",
      redirect_uri: redirectUri,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // GitHub code
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const onRegisterPage = window.location.pathname === "/register";
    if (onRegisterPage && code) {
      (async () => {
        try {
          setErr("");
          await loginWithGithubCode(code, redirectUri);
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          window.history.replaceState({}, "", url.pathname);
          nav("/dashboard");
        } catch (e) {
          setErr(e.message || "GitHub login xatosi");
        }
      })();
    }
  }, [loginWithGithubCode, nav, redirectUri]);

  // Telegram
  useEffect(() => {
    if (!telegramDivRef.current) return;

    window.__onTelegramAuth = async (tgUser) => {
      try {
        setErr("");
        await loginWithTelegramPayload(tgUser);
        nav("/dashboard");
      } catch (e) {
        setErr(e.message || "Telegram login xatosi");
      }
    };

    const existing = document.querySelector("script[data-telegram-login]");
    if (existing) return;

    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?7";
    s.async = true;
    s.setAttribute(
      "data-telegram-login",
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "cyberex_auth_bot"
    );
    s.setAttribute("data-size", "large");
    s.setAttribute("data-userpic", "false");
    s.setAttribute("data-onauth", "__onTelegramAuth(user)");
    telegramDivRef.current.innerHTML = "";
    telegramDivRef.current.appendChild(s);
  }, [loginWithTelegramPayload, nav]);

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

          {/* Social */}
          <div className="mt-4 space-y-3">
            <div
              ref={googleDivRef}
              className="w-full flex justify-center"
            ></div>

            <button
              type="button"
              onClick={startGithubSignup}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 font-semibold shadow-lg flex items-center justify-center gap-3 border border-slate-700"
            >
              <svg
                height="20"
                width="20"
                viewBox="0 0 16 16"
                className="opacity-90"
              >
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8a8.013...Z"
                />
              </svg>
              GitHub orqali ro‘yxatdan o‘tish
            </button>

            <div
              ref={telegramDivRef}
              className="w-full flex justify-center"
            ></div>
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
