import type { RouteObject } from "react-router-dom";
import { lazyRoute } from "./lazyRoute";

export const methodologyRoutes: RouteObject[] = [
  {
    path: "methodology",
    element: lazyRoute(() => import("../pages/MethodologyPage"), "MethodologyPage", "dashboard"),
  },
];
