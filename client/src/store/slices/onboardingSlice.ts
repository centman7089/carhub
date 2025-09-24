import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../store';
import * as onboardingService from '../services/onboardingService';
import { Course, Skill } from '../types/onboardingTypes';

interface OnboardingState {
  courses: Course[];
  selectedCourses: Course[];
  skills: Skill[];
  selectedSkills: Skill[];
  technicalLevel: string | null;
  educationLevel: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  courses: [],
  selectedCourses: [],
  skills: [],
  selectedSkills: [],
  technicalLevel: null,
  educationLevel: null,
  loading: false,
  error: null
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    fetchCoursesStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCoursesSuccess(state, action: PayloadAction<Course[]>) {
      state.loading = false;
      state.courses = action.payload;
    },
    fetchCoursesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    selectCourse(state, action: PayloadAction<Course>) {
      if (!state.selectedCourses.some(c => c._id === action.payload._id)) {
        state.selectedCourses.push(action.payload);
      }
    },
    removeCourse(state, action: PayloadAction<string>) {
      state.selectedCourses = state.selectedCourses.filter(c => c._id !== action.payload);
    },
    fetchSkillsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSkillsSuccess(state, action: PayloadAction<Skill[]>) {
      state.loading = false;
      state.skills = action.payload;
    },
    fetchSkillsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    selectSkill(state, action: PayloadAction<Skill>) {
      if (!state.selectedSkills.some(s => s._id === action.payload._id)) {
        state.selectedSkills.push(action.payload);
      }
    },
    removeSkill(state, action: PayloadAction<string>) {
      state.selectedSkills = state.selectedSkills.filter(s => s._id !== action.payload);
    },
    setTechnicalLevel(state, action: PayloadAction<string>) {
      state.technicalLevel = action.payload;
    },
    setEducationLevel(state, action: PayloadAction<string>) {
      state.educationLevel = action.payload;
    },
    resetOnboarding(state) {
      state.selectedCourses = [];
      state.selectedSkills = [];
      state.technicalLevel = null;
      state.educationLevel = null;
    }
  }
});

export const {
  fetchCoursesStart,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  selectCourse,
  removeCourse,
  fetchSkillsStart,
  fetchSkillsSuccess,
  fetchSkillsFailure,
  selectSkill,
  removeSkill,
  setTechnicalLevel,
  setEducationLevel,
  resetOnboarding
} = onboardingSlice.actions;

export default onboardingSlice.reducer;

// Thunk actions
export const fetchCourses = (): AppThunk => async dispatch => {
  try {
    dispatch(fetchCoursesStart());
    const courses = await onboardingService.fetchCourses();
    dispatch(fetchCoursesSuccess(courses));
  } catch (err) {
    dispatch(fetchCoursesFailure(err.message));
  }
};

export const fetchSkillsForCourse = (courseId: string): AppThunk => async dispatch => {
  try {
    dispatch(fetchSkillsStart());
    const skills = await onboardingService.fetchSkillsForCourse(courseId);
    dispatch(fetchSkillsSuccess(skills));
  } catch (err) {
    dispatch(fetchSkillsFailure(err.message));
  }
};

export const saveOnboardingData = (): AppThunk => async (dispatch, getState) => {
  try {
    const { selectedCourses, selectedSkills, technicalLevel, educationLevel } = getState().onboarding;
    await onboardingService.saveOnboardingData({
      selectedCourses: selectedCourses.map(c => c._id),
      selectedSkills: selectedSkills.map(s => s._id),
      technicalLevel,
      educationLevel
    });
  } catch (err) {
    console.error('Failed to save onboarding data:', err);
    throw err;
  }
};