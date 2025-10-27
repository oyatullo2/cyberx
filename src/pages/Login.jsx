import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FormInput from "../components/FormInput.jsx";
import Button from "../components/Button.jsx";

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

  // Google Sign-In
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!window.google || !clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const idToken = response.credential;
          await loginWithGoogleIdToken(idToken);
          nav("/dashboard");
        } catch (e) {
          setErr(e.message);
        }
      },
      ux_mode: "popup",
    });
  }, [loginWithGoogleIdToken, nav]);

  // GitHub login
  const startGithubLogin = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
      scope: "read:user user:email",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  // GitHub callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (window.location.pathname === "/login" && code) {
      (async () => {
        try {
          await loginWithGithubCode(code);
          nav("/dashboard");
        } catch (e) {
          setErr(e.message);
        } finally {
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.pathname);
        }
      })();
    }
  }, [loginWithGithubCode, nav]);

  // Telegram login
  useEffect(() => {
    if (!window.Telegram?.Login) return;
    window.Telegram.Login.auth(
      { bot_id: import.meta.env.VITE_TG_BOT_ID, request_access: true },
      async (payload) => {
        try {
          await loginWithTelegramPayload(payload);
          nav("/dashboard");
        } catch (e) {
          setErr(e.message);
        }
      }
    );
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

          {/* --- Social --- */}
          <div className="mt-4 space-y-3">
            <button
              onClick={() => window.google.accounts.id.prompt()}
              className="w-full rounded-xl bg-white text-gray-900 px-4 py-3 flex items-center justify-center gap-3 border border-gray-300"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
              />
              Google orqali kirish
            </button>

            <button
              onClick={startGithubLogin}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 flex items-center justify-center gap-3 border border-slate-700"
            >
              <svg
                height="20"
                width="20"
                viewBox="0 0 16 16"
                className="opacity-90"
              >
                <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8a8.013..." />
              </svg>
              GitHub orqali kirish
            </button>

            <div
              id="telegram-login-container"
              className="flex justify-center mt-2"
            >
              <script
                async
                src="https://telegram.org/js/telegram-widget.js?7"
                data-telegram-login={import.meta.env.VITE_TG_BOT_USERNAME}
                data-size="large"
                data-onauth="onTelegramAuth(user)"
              ></script>
            </div>
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
