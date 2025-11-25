import { useAuth } from "../context/AuthContext.jsx";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);
  if (loading) return <div className="p-8">Yuklanmoqda…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-xl border border-slate-700 px-4 py-2"
          >
            Chiqish
          </button>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p>
            <b>Username:</b> {user.username}
          </p>
          <p>
            <b>Email:</b> {user.email}
          </p>
          <p>
            <b>Ism:</b> {user.name || "-"}
          </p>
          <p>
            <b>Tasdiq:</b>{" "}
            {user.email_verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
          </p>
        </div>
      </div>
    </div>
  );
}
