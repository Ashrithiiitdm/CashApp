import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * @param {children} - The page component to render
 * @param {allowedRoles} - Array of strings, e.g. ['user'] or ['vendor']
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore(); 
  const location = useLocation();

  // 1. Check if Logged In (Authentication)
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Permissions (Authorization)
  // Only run this check if the route actually requires specific roles
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    
    // If a VENDOR tries to access a USER page -> Send to Vendor Dashboard
    if (user.role === 'vendor') {
      return <Navigate to="/vendor-dashboard" replace />;
    }
    
    // If a USER tries to access a VENDOR page -> Send to User Home
    if (user.role === 'user') {
      return <Navigate to="/home" replace />;
    }
  }

  // 3. If all checks pass, render the page
  return children;
};

export default ProtectedRoute;