import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { dashboardRoutes } from "./dashboard.routes";
import { methodologyRoutes } from "./methodology.routes";

export const router = createBrowserRouter([
  { path: "/", element: <Layout />, children: [...dashboardRoutes, ...methodologyRoutes] },
]);
