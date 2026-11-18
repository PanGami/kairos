import type { RouteObject } from "react-router-dom";
import { AdminRoute } from "../components/AdminRoute";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { lazyRoute } from "./lazyRoute";

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: lazyRoute(() => import("../pages/LoginPage"), "LoginPage", "auth"),
  },
  {
    path: "/register",
    element: lazyRoute(() => import("../pages/RegisterPage"), "RegisterPage", "auth"),
  },
  {
    path: "/forgot-password",
    element: lazyRoute(() => import("../pages/ForgotPasswordPage"), "ForgotPasswordPage", "auth"),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        {lazyRoute(() => import("../pages/ProfilePage"), "ProfilePage", "profile")}
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <AdminRoute>
        {lazyRoute(() => import("../pages/AdminUsersPage"), "AdminUsersPage", "table")}
      </AdminRoute>
    ),
  },
];
