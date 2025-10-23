import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 60 * 1000; // 60 soniya
}

export default function Users(){
  const { token } = useAuth();
  const [items,setItems]=useState([]);
  const [page,setPage]=useState(1);
  const [done,setDone]=useState(false);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{ load(1,true); /* initial */ },[]);

  async function load(p,reset=false){
    if (busy || done) return;
    setBusy(true);
    try{
      const res = await fetch(`${new URL('./', location.href)}api`, {method:'HEAD'}).catch(()=>{});
      const data = await api(`users_list.php?page=${p}&per=24`, { method: "GET", token });
      if (reset) setItems(data.users);
      else setItems(prev=>[...prev, ...data.users]);
      setPage(p);
      if (!data.users.length) setDone(true);
    }finally{ setBusy(false); }
  }

  useEffect(()=>{
    function onScroll(){
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 200)) load(page+1);
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    return ()=> window.removeEventListener('scroll', onScroll);
  },[page,done,busy]);

    return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-extrabold mb-4">Foydalanuvchilar</h1>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map(u => {
          const online = isOnline(u.last_seen);
          return (
            <div key={u.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 hover:border-indigo-600 transition">
              <div className="relative">
                <img src={u.profile_image_url} alt={u.username} className="w-full aspect-square object-cover rounded-2xl" />
                <span 
                  className={`absolute top-2 right-2 inline-block w-3 h-3 rounded-full ${online ? 'bg-emerald-400' : 'bg-slate-500'}`} 
                  title={online ? 'Online' : `Last: ${u.last_seen || '—'}`}
                ></span>
              </div>
              <div className="mt-2">
                <div className="font-semibold truncate">{u.name || '—'}</div>
                <div className="text-xs text-slate-400 truncate">@{u.username}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {online ? 'online' : `last ${timeAgo(u.last_seen)}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {busy && <div className="py-6 text-center text-slate-400">Yuklanmoqda…</div>}
      {done && items.length === 0 && <div className="py-6 text-center text-slate-400">Hali foydalanuvchi yo‘q.</div>}
    </div>
  );
}
