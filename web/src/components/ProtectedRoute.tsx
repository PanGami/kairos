import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { PageSkeleton } from "./LoadingSkeleton";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLocale();

  if (loading) {
    return <PageSkeleton variant="profile" label={t.protectedRoute.checkingSession} />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
