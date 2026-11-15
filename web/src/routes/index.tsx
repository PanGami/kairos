import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { authRoutes } from "./auth.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { methodologyRoutes } from "./methodology.routes";
import { watcherRoutes } from "./watcher.routes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [...dashboardRoutes, ...watcherRoutes, ...methodologyRoutes, ...authRoutes],
  },
]);
