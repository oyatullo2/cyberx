import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Loader from "./components/Loader.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useState, useEffect } from "react";

export default function App() {
  const location = useLocation();
  const { loading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);

  // sahifa almashganda yuklanish animatsiyasi
  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), 250);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // 🔹 Header faqat login/register/verify sahifalarda ko‘rinmasin
  const noHeaderRoutes = [
    "/",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-start",
    "/forgot-verify",
    "/forgot-new",
  ];

  const hideHeader = noHeaderRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {!hideHeader && <Header />}
      <div className={!hideHeader ? "pt-16" : ""}>
        {loading || pageLoading ? <Loader /> : <Outlet />}
      </div>
    </div>
  );
}
