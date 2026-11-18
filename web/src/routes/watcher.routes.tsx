import type { RouteObject } from "react-router-dom";
import { lazyRoute } from "./lazyRoute";

export const watcherRoutes: RouteObject[] = [
  { path: "watcher", element: lazyRoute(() => import("../pages/WatcherPage"), "WatcherPage", "watcher") },
];
