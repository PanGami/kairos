import type { RouteObject } from "react-router-dom";
import { WatcherPage } from "../pages/WatcherPage";

export const watcherRoutes: RouteObject[] = [{ path: "watcher", element: <WatcherPage /> }];
