import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  function saveSession(t, u) {
    setToken(t);
    setUser(u);
    localStorage.setItem("token", t);
  }

  async function adoptSessionFromGoogle(idToken) {
    const res = await api("oauth_google.php", { body: { id_token: idToken } });
    saveSession(res.token, res.user);
    return res.user;
  }

  async function adoptSessionFromGithub(code) {
    const res = await api("oauth_github.php", { body: { code } });
    saveSession(res.token, res.user);
    return res.user;
  }

  // ⬇️ Telegram orqali sessiya ochish (user payload backendda tekshiriladi)
  async function adoptSessionFromTelegram(telegramUserPayload) {
    // { id, hash, auth_date, username?, first_name?, last_name?, photo_url? }
    const res = await api("oauth_telegram.php", { body: telegramUserPayload });
    saveSession(res.token, res.user);
    return res.user;
  }

  useEffect(() => {
    if (!token) return;
    api("me.php", { method: "GET", token })
      .then(setUser)
      .catch(() => {
        setToken("");
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      api("ping.php", { method: "POST", token }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [token]);

  const login = async (username, password) => {
    const res = await api("login.php", { body: { username, password } });
    saveSession(res.token, res.user);
  };

  const logout = async () => {
    try {
      await api("logout.php", { method: "POST", token });
    } catch {}
    setToken("");
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    setUser,
    loginWithGoogleIdToken: adoptSessionFromGoogle,
    loginWithGithubCode: adoptSessionFromGithub,
    // ⬇️ Export qilamiz:
    loginWithTelegram: adoptSessionFromTelegram,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
