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
import Messages from "./pages/Messages.jsx";
import Help from "./pages/Help.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import PostCreate from "./pages/PostCreate.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Login /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/verify-email", element: <VerifyEmail /> },
      { path: "/forgot-start", element: <ForgotStart /> },
      { path: "/forgot-verify", element: <ForgotVerify /> },
      { path: "/forgot-new", element: <ForgotNew /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/users", element: <Users /> },
          { path: "/messages", element: <Messages /> },
          { path: "/help", element: <Help /> },
          { path: "/settings", element: <Settings /> },
          { path: "/users/:token", element: <UserProfile /> },
          { path: "/post/new", element: <PostCreate /> },
        ],
      },
    ],
  },
]);
