// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  function saveSession(t, u) {
    if (!t || !u) return;
    setToken(t);
    setUser(u);
    localStorage.setItem("token", t);
  }

  async function adoptSessionFromGoogle(idToken) {
    const res = await api("oauth_google.php", { body: { id_token: idToken } });
    const data = res.data ?? res;
    saveSession(data.token, data.user);
    return data.user;
  }

  async function adoptSessionFromGithub(code) {
    const res = await api("oauth_github.php", { body: { code } });
    const data = res.data ?? res;
    saveSession(data.token, data.user);
    return data.user;
  }

  // Telegram: backend javobini moslab qabul qiladi
  async function adoptSessionFromTelegram(payload) {
    const res = await api("oauth_telegram.php", { body: payload });
    const data = res.data ?? res;
    if (!data || !data.token || !data.user) {
      throw new Error("Telegram login xatosi: noto‘g‘ri server javobi");
    }
    saveSession(data.token, data.user);
    return data.user;
  }

  useEffect(() => {
    if (!token) return;
    api("me.php", { method: "GET", token })
      .then((u) => setUser(u))
      .catch(() => {
        setToken("");
        localStorage.removeItem("token");
        setUser(null);
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
    const data = res.data ?? res;
    saveSession(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api("logout.php", { method: "POST", token });
    } catch {}
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
  };

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    setUser,
    adoptSessionFromGoogle,
    adoptSessionFromGithub,
    adoptSessionFromTelegram, // aniq nom
    // backwards compat / alias (agar boshqa fayllar eski nom bilan chaqirsa)
    loginWithTelegram: adoptSessionFromTelegram,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
