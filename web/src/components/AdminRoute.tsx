import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { PageSkeleton } from "./LoadingSkeleton";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLocale();

  if (loading) {
    return <PageSkeleton variant="table" label={t.protectedRoute.checkingSession} />;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
