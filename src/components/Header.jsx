import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header() {
  const { user } = useAuth();
  const last = useRef(0);
  const [hidden, setHidden] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY || 0;
      if (y > last.current && y > 40) setHidden(true);
      else setHidden(false);
      last.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="backdrop-blur bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="font-extrabold tracking-wide text-indigo-300"
          >
            CYBERX
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-slate-300 hover:text-white"
              }
            >
              Users
            </NavLink>
            <NavLink
              to="/messages"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-slate-300 hover:text-white"
              }
            >
              Messages
            </NavLink>

            {/* ✚ Post qo‘shish ikonchasi */}
            <button onClick={() => nav("/post/new")} title="Yangi post">
              {/* Plus Square SVG (zamonaviy) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-slate-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v8m4-4H8"
                />
                <rect x="3" y="3" width="18" height="18" rx="2.5" ry="2.5" />
              </svg>
            </button>

            <NavLink
              to="/help"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-slate-300 hover:text-white"
              }
            >
              Help
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-slate-300 hover:text-white"
              }
            >
              Profile
            </NavLink>
            {user && <span className="text-slate-400">| {user.username}</span>}
          </nav>
        </div>
      </div>
    </header>
  );
}
