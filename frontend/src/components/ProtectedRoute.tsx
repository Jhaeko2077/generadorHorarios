import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../api/client";
import Loading from "./Loading";
import { useAuth } from "../hooks/useAuth";

type Role = "admin" | "teacher";

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const token = getToken();
  const { data: user, isLoading, isError } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return <Loading />;
  if (isError || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}
