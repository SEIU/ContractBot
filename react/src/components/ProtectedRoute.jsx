import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children, path }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user.isAuthenticated) {
    // Redirect to login page if not authorized
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children; // Render the children if authorized
}

export default ProtectedRoute;
