import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LocaleProvider } from "./hooks/useLocale";
import { router } from "./routes";
import "./styles/global.css";
import "./styles/chart.css";
import "./styles/ticker-search.css";
import "./styles/dashboard-motion.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LocaleProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LocaleProvider>
  </React.StrictMode>,
);
