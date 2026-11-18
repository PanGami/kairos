import type { RouteObject } from "react-router-dom";
import { lazyRoute } from "./lazyRoute";

export const dashboardRoutes: RouteObject[] = [
  { index: true, element: lazyRoute(() => import("../pages/DashboardPage"), "DashboardPage", "dashboard") },
];
