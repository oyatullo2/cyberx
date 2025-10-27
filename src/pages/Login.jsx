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
  const { login, loginWithGoogleIdToken, loginWithGithubCode } = useAuth();
  const googleDivRef = useRef(null);

  // 🌐 Dinamik redirect aniqlash
  const redirectUri = useMemo(() => {
  const origin = window.location.origin;
  if (origin.includes("localhost")) return "http://localhost:5173/login";
  return "https://www.cyberex.uz/login";
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

  // 🟢 Google Sign-In
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!window.google || !clientId || !googleDivRef.current) return;

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

  // 🐙 GitHub Login: dynamic redirect bilan
  function startGithubLogin() {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
      scope: "read:user user:email",
      redirect_uri: redirectUri,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // GitHub code qaytganda loginni bajarish
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
          window.history.replaceState({}, "", url.pathname);
          nav("/dashboard");
        } catch (e) {
          setErr(e.message || "GitHub login xatosi");
        }
      })();
    }
  }, [loginWithGithubCode, nav, redirectUri]);

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

          {/* Social login buttons */}
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
                  d="M8 0C3.58 0 0 3.58 0 8a8.013 8.013 0 0 0 5.47 7.59c.4.075.55-.175.55-.387 0-.19-.007-.693-.01-1.36-2.23.485-2.7-1.074-2.7-1.074-.364-.925-.89-1.17-.89-1.17-.727-.497.055-.487.055-.487.804.057 1.228.826 1.228.826.714 1.222 1.872.869 2.328.665.072-.517.28-.869.508-1.069-1.78-.2-3.644-.89-3.644-3.963 0-.875.312-1.59.824-2.15-.083-.203-.357-1.017.078-2.122 0 0 .672-.216 2.2.82a7.688 7.688 0 0 1 2.003-.27c.68.003 1.366.092 2.004.27 1.528-1.036 2.198-.82 2.198-.82.437 1.105.162 1.919.08 2.122.514.56.823 1.275.823 2.15 0 3.082-1.867 3.76-3.65 3.956.288.25.543.738.543 1.486 0 1.074-.01 1.942-.01 2.203 0 .215.147.467.553.387A8.014 8.014 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
              GitHub orqali kirish
            </button>
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
