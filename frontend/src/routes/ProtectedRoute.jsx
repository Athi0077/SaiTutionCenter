import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, currentUser } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // (Removed mandatory password change redirect for students)

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Exact main_principal check
    if (allowedRoles.includes('main_principal')) {
      if (currentUser.role === 'principal' && !currentUser.tempPrincipalAccess) {
        return children;
      }
      return <Navigate to="/principal/dashboard" replace />;
    }

    // Allow if teacher has temp principal access and requires principal role
    if (allowedRoles.includes('principal') && currentUser.role === 'teacher' && currentUser.tempPrincipalAccess) {
      return children;
    }
    
    // Redirect based on actual role if trying to access unauthorized route
    if (currentUser.role === 'superadmin') return <Navigate to="/super-admin/dashboard" replace />;
    if (currentUser.role === 'principal') return <Navigate to="/principal/dashboard" replace />;
    if (currentUser.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (currentUser.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (currentUser.role === 'parent') return <Navigate to="/parent/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
