import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";

export const authRoutes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
];
