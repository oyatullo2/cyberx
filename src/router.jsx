import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotStart from "./pages/ForgotStart.jsx";
import ForgotVerify from "./pages/ForgotVerify.jsx";
import ForgotNew from "./pages/ForgotNew.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Settings from "./pages/Settings.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // 🔹 Tashqi sahifalar (login qilinmaganlar uchun)
      { path: "/", element: <Login /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/verify-email", element: <VerifyEmail /> },
      { path: "/forgot-start", element: <ForgotStart /> },
      { path: "/forgot-verify", element: <ForgotVerify /> },
      { path: "/forgot-new", element: <ForgotNew /> },

      // 🔒 Ichki sahifalar (faqat login bo‘lgandan keyin)
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/users", element: <Users /> },
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },
]);
