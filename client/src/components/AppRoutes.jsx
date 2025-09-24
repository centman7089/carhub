import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../components/auth/Login';
import RegisterJobSeeker from '../components/auth/RegisterJobSeeker';
import RegisterEmployer from '../components/auth/RegisterEmployer';
import CourseSelection from '../components/onboarding/CourseSelection';
import SkillSelection from '../components/onboarding/SkillSelection';
import TechnicalLevel from '../components/onboarding/TechnicalLevel';
import EducationLevel from '../components/onboarding/EducationLevel';
import ReviewSelection from '../components/onboarding/ReviewSelection';
import Dashboard from '../components/dashboard/Dashboard';
import ProtectedRoute from '../components/shared/ProtectedRoute';

const AppRoutes: React.FC = () => {
    return (
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/job-seeker" element={<RegisterJobSeeker />} />
        <Route path="/register/employer" element={<RegisterEmployer />} />
  
        {/* Onboarding routes - only for job seekers who haven't completed onboarding */}
        <Route element={<ProtectedRoute roles={['job_seeker']} onboardingRequired={false} />}>
          <Route path="/onboarding/courses" element={<CourseSelection />} />
          <Route path="/onboarding/skills" element={<SkillSelection />} />
          <Route path="/onboarding/technical-level" element={<TechnicalLevel />} />
          <Route path="/onboarding/education-level" element={<EducationLevel />} />
          <Route path="/onboarding/review" element={<ReviewSelection />} />
        </Route>
  
        {/* Protected routes - onboarding required for job seekers */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add other protected routes here */}
        </Route>
      </Routes>
    );
  };

export default AppRoutes;