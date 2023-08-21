import { useLocation } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Navigate } from "react-router-dom";

export function RequireAuth({ children }) {
  const location = useLocation();
  const { route } = useAuthenticator((context) => [context.route]);
  if (route !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
