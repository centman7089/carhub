/* eslint-disable no-unused-vars */
// @ts-nocheck
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ResendCode from "./pages/ResendCode";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";
import MobilePage from "./pages/mobilePage";
import ResumeUpload from "./pages/Resumeupload";
import RequestResetForm from "./pages/RequestResetForm";
import VerifyCodeForm from "./pages/VerifyCodeForm";
import ResetPasswordForm from "./pages/ResetPassword";
import OAuthLogin from "./pages/auth";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<ResumeUpload />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mobile" element={<MobilePage />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/resend-code" element={<ResendCode />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/request-reset" element={<RequestResetForm />} />
        <Route path="/verify-code" element={<VerifyCodeForm />} />
        <Route path="/auth" element={<OAuthLogin />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/change-password" element={
          <ProtectedRoute><ChangePassword /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;