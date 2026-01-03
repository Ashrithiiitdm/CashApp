import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore(); // Check if token exists
  const location = useLocation();

  if (!token) {
    // Redirect to login, but save the location they tried to access
    // so we can send them back there after they login (optional but good UX)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the child component (the page)
  return children;
};

export default ProtectedRoute;