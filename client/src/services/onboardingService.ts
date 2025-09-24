import axios from 'axios';

const API_URL = 'http://localhost:5000/api/onboarding';

export interface Course {
  _id: string;
  name: string;
  description: string;
}

export interface Skill {
  _id: string;
  name: string;
  category: string;
}

export const fetchCourses = async (): Promise<Course[]> => {
  const response = await axios.get(`${API_URL}/courses`);
  return response.data;
};

export const fetchSkillsForCourse = async (courseId: string): Promise<Skill[]> => {
  const response = await axios.get(`${API_URL}/skills/${courseId}`);
  return response.data;
};

export const saveOnboardingData = async (data: {
  selectedCourses: string[];
  selectedSkills: string[];
  technicalLevel: string;
  educationLevel: string;
}) => {
  const response = await axios.post(`${API_URL}/save`, data);
  return response.data;
};