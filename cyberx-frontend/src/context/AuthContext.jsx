import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  // 🔹 Token mavjud bo‘lsa — foydalanuvchini olish
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api("me.php", { method: "GET", token })
      .then((data) => {
        // me.php to‘g‘ridan-to‘g‘ri foydalanuvchini qaytaradi
        setUser(data);
      })
      .catch((err) => {
        console.warn("Auth error:", err.message);
        // token yaroqsiz bo‘lsa — tizimdan chiqaramiz
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // 🔹 Har 30 s da foydalanuvchini “onlayn” qilib yangilash
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      api("ping.php", { method: "POST", token }).catch(() => {});
    }, 25000);
    return () => clearInterval(id);
  }, [token]);

  // 🔹 Login funksiyasi
  const login = async (username, password) => {
    const res = await api("login.php", { body: { username, password } });
    if (!res.token) throw new Error("Token olinmadi.");
    setToken(res.token);
    localStorage.setItem("token", res.token);
    setUser(res.user);
  };

  // 🔹 Logout funksiyasi
  const logout = async () => {
    try {
      if (token) await api("logout.php", { method: "POST", token });
    } catch (_) {}
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
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
