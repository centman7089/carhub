import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth/users",
});

export const register = (data) => API.post("/register", data);
export const verifyEmail = (data) => API.post("/verify", data);
export const resendCode = (data) => API.post("/resend-code", data);
export const login = (data) => API.post("/login", data);
export const forgotPassword = (data) => API.post("/forgot-password", data);
export const resetPassword = (data) => API.post("/reset-password", data);
export const changePassword = (data, token) => 
  API.post("/change-password", data, {
    headers: { Authorization: token },
  });