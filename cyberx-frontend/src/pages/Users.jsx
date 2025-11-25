import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Users() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);

  const load = async () => {
    try {
      const res = await api("userlist.php", { method: "GET", token });
      setUsers(res.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((u) => (
        <div
          key={u.id}
          className="p-4 bg-slate-900/70 rounded-2xl border border-slate-700 flex items-center gap-3"
        >
          <img
            src={u.profile_image_url}
            className="w-14 h-14 rounded-full object-cover border border-slate-600"
          />
          <div className="flex-1">
            <div className="font-semibold text-lg">{u.name}</div>
            <div className="text-slate-400 text-sm">@{u.username}</div>
            {u.online ? (
              <div className="text-emerald-400 text-sm">🟢 Online</div>
            ) : (
              <div className="text-slate-500 text-sm">{u.last_active_text}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
