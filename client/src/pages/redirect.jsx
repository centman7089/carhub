import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard");
    }
  }, [location]);

  return <p>Redirecting...</p>;
};

export default OAuthSuccess;
