import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    api("me.php", { method: "GET", token })
      .then(setUser)
      .catch(() => { setToken(""); localStorage.removeItem("token"); })
      .finally(() => setLoading(false));
  }, [token]);

  // real-time ping
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => { api("ping.php", { method: "POST", token }).catch(()=>{}); }, 30000);
    return () => clearInterval(id);
  }, [token]);

  const login = async (username, password) => {
    const res = await api("login.php", { body: { username, password } });
    setToken(res.token);
    localStorage.setItem("token", res.token);
    setUser(res.user);
  };
  const logout = async () => {
    try { await api("logout.php", { method: "POST", token }); } catch {}
    setToken(""); localStorage.removeItem("token"); setUser(null);
  };
  const value = { token, user, loading, login, logout, setUser };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
