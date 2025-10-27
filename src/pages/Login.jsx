import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const {
    login,
    loginWithGoogleIdToken,
    loginWithGithubCode,
    loginWithTelegramPayload,
  } = useAuth();
  const googleDivRef = useRef(null);
  const telegramDivRef = useRef(null);

  const redirectUri = useMemo(() => {
    const origin = window.location.origin;
    if (origin.includes("localhost")) return "http://localhost:5173/login";
    return "https://cyberex.uz/login";
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(username, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message);
    }
  };

  // Google button
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
        text: "signin_with",
        logo_alignment: "left",
        width: 320,
      });
    } catch (e) {
      console.error(e);
    }
  }, [nav, loginWithGoogleIdToken]);

  // GitHub start
  function startGithubLogin() {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
      scope: "read:user user:email",
      redirect_uri: redirectUri,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // GitHub code qabul qilish
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const onLoginPage = window.location.pathname === "/login";
    if (onLoginPage && code) {
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

  // ⬇️ Telegram button (Widget JS)
  useEffect(() => {
    if (!telegramDivRef.current) return;

    // onAuth callback ni globalga bog‘laymiz
    window.__onTelegramAuth = async (tgUser) => {
      try {
        setErr("");
        await loginWithTelegramPayload(tgUser);
        nav("/dashboard");
      } catch (e) {
        setErr(e.message || "Telegram login xatosi");
      }
    };

    // Agar skript hali yuklanmagan bo‘lsa, yuklaymiz
    const existing = document.querySelector("script[data-telegram-login]");
    if (existing) return; // bir marta yetarli

    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?7";
    s.async = true;
    s.setAttribute(
      "data-telegram-login",
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "cyberex_auth_bot"
    );
    s.setAttribute("data-size", "large");
    s.setAttribute("data-userpic", "false");
    // onAuth -> bizning global handler
    s.setAttribute("data-onauth", "__onTelegramAuth(user)");
    // data-auth-url ishlatmaymiz, chunki JS callback orqali o‘zimiz yuboramiz
    telegramDivRef.current.innerHTML = "";
    telegramDivRef.current.appendChild(s);
  }, [loginWithTelegramPayload, nav]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6">Kirish</h1>
        {err && <div className="mb-4 text-red-400">{err}</div>}

        <form
          onSubmit={submit}
          className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800"
        >
          <FormInput
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="username"
          />
          <FormInput
            label="Parol"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
          />
          <Button type="submit">Login</Button>

          {/* Social buttons */}
          <div className="mt-4 space-y-3">
            <div
              ref={googleDivRef}
              className="w-full flex justify-center"
            ></div>

            <button
              type="button"
              onClick={startGithubLogin}
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
              GitHub orqali kirish
            </button>

            <div
              ref={telegramDivRef}
              className="w-full flex justify-center"
            ></div>
          </div>

          <div className="text-sm mt-4 flex justify-between">
            <Link to="/register" className="text-indigo-400 hover:underline">
              Ro‘yxatdan o‘tish
            </Link>
            <Link
              to="/forgot-start"
              className="text-indigo-400 hover:underline"
            >
              Parolni tiklash
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
