import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

interface AuthResponse {
  token: string;
  role: string;
  onboardingCompleted?: boolean;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};

export const registerJobSeeker = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register/job-seeker`, { name, email, password });
  return response.data;
};

export const registerEmployer = async (name: string, email: string, password: string, company: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register/employer`, { name, email, password, company });
  return response.data;
};import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

interface AuthResponse {
  token: string;
  role: string;
  onboardingCompleted?: boolean;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};

export const registerJobSeeker = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register/job-seeker`, { name, email, password });
  return response.data;
};

export const registerEmployer = async (name: string, email: string, password: string, company: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register/employer`, { name, email, password, company });
  return response.data;
};