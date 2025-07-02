// /* eslint-disable react/prop-types */
// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children }) {
//   const token = localStorage.getItem("token");
//   return token ? children : <Navigate to="/login" />;


import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface ProtectedRouteProps {
  roles?: ('job_seeker' | 'employer' | 'admin')[];
  onboardingRequired?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  roles, 
  onboardingRequired 
}) => {
  const { token, role, onboardingCompleted } = useSelector(
    (state: RootState) => state.auth
  );

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role as any)) {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding if job seeker hasn't completed it
  if (role === 'job_seeker' && !onboardingCompleted && onboardingRequired !== false) {
    return <Navigate to="/onboarding/courses" replace />;
  }

  return <Outlet />;
};
export default ProtectedRoute;