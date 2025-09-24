import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setEducationLevel } from '../../store/slices/onboardingSlice';
import { RootState } from '../../store/store';
import {
  Button,
  Container,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';

const EducationLevel: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { educationLevel } = useSelector((state: RootState) => state.onboarding);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch(setEducationLevel(event.target.value as string));
  };

  const handleContinue = () => {
    if (educationLevel) {
      navigate('/onboarding/review');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your Education Background
        </Typography>
        <Typography variant="body1" paragraph>
          Please select your highest level of education.
        </Typography>
      </Box>

      <FormControl fullWidth>
        <InputLabel id="education-level-label">Education Level</InputLabel>
        <Select
          labelId="education-level-label"
          id="education-level"
          value={educationLevel || ''}
          label="Education Level"
          onChange={handleChange}
        >
          <MenuItem value="high_school">High School</MenuItem>
          <MenuItem value="associate">Associate Degree</MenuItem>
          <MenuItem value="bachelor">Bachelor's Degree</MenuItem>
          <MenuItem value="master">Master's Degree</MenuItem>
          <MenuItem value="phd">PhD</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => navigate('/onboarding/technical-level')}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!educationLevel}
        >
          Review Your Selections
        </Button>
      </Box>
    </Container>
  );
};

export default EducationLevel;