import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F6]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0B3A2C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6B7A72] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
