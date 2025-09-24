import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../store/slices/authSlice';
import { RootState } from '../../store/store';
import { Button, TextField, Container, Typography, Box, Link } from '@mui/material';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(login(email, password)).unwrap();
      
      // Get the current state after login
      const state = store.getState();
      const { role, onboardingCompleted } = state.auth;
      
      // Redirect logic
      if (role === 'job_seeker' && !onboardingCompleted) {
        navigate('/onboarding/courses');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link href="/register/job-seeker" variant="body2">
              Register as Job Seeker
            </Link>
            <Link href="/register/employer" variant="body2">
              Register as Employer
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;