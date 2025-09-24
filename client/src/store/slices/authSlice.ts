import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../store';
import * as authService from '../services/authService';

// In your authSlice.ts, modify the initialState to read from localStorage
const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    role: localStorage.getItem('role') as any || null,
    onboardingCompleted: localStorage.getItem('onboardingCompleted') === 'true'
  };


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
  // And update your loginSuccess reducer to persist these values
loginSuccess(state, action: PayloadAction<{ token: string; role: string; onboardingCompleted: boolean }>) {
    state.loading = false;
    state.token = action.payload.token;
    state.role = action.payload.role;
    state.onboardingCompleted = action.payload.onboardingCompleted;
    
    localStorage.setItem('token', action.payload.token);
    localStorage.setItem('role', action.payload.role);
    localStorage.setItem('onboardingCompleted', String(action.payload.onboardingCompleted));
  },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
 // In your authSlice.ts logout reducer
logout(state) {
    state.user = null;
    state.token = null;
    state.role = null;
    state.onboardingCompleted = false;
    
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('onboardingCompleted');
  }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer;

// Thunk actions
export const login = (email: string, password: string): AppThunk => async dispatch => {
  try {
    dispatch(loginStart());
    const { token, role, onboardingCompleted } = await authService.login(email, password);
    localStorage.setItem('token', token);
    dispatch(loginSuccess({ token, role, onboardingCompleted }));
  } catch (err) {
    dispatch(loginFailure(err.message));
  }
};

export const registerJobSeeker = (name: string, email: string, password: string): AppThunk => async dispatch => {
  try {
    dispatch(loginStart());
    const { token, role } = await authService.registerJobSeeker(name, email, password);
    localStorage.setItem('token', token);
    dispatch(loginSuccess({ token, role, onboardingCompleted: false }));
  } catch (err) {
    dispatch(loginFailure(err.message));
  }
};

export const registerEmployer = (name: string, email: string, password: string, company: string): AppThunk => async dispatch => {
  try {
    dispatch(loginStart());
    const { token, role } = await authService.registerEmployer(name, email, password, company);
    localStorage.setItem('token', token);
    dispatch(loginSuccess({ token, role, onboardingCompleted: true }));
  } catch (err) {
    dispatch(loginFailure(err.message));
  }
};

export const logoutUser = (): AppThunk => async dispatch => {
  localStorage.removeItem('token');
  dispatch(logout());
};