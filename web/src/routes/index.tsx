import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { authRoutes } from "./auth.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { methodologyRoutes } from "./methodology.routes";

export const router = createBrowserRouter([
  ...authRoutes,
  {
    path: "/",
    element: <Layout />,
    children: [...dashboardRoutes, ...methodologyRoutes],
  },
]);
