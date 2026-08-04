import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page and preserve the intended destination URL
    return <Navigate to="/login" state={{ from: location, message: "Please sign in to upload MRI scans or access clinical records." }} replace />;
  }

  return children;
}
