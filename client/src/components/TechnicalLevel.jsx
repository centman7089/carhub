import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setTechnicalLevel } from '../../store/slices/onboardingSlice';
import { RootState } from '../../store/store';
import { Button, Container, Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';

const TechnicalLevel: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { technicalLevel } = useSelector((state: RootState) => state.onboarding);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setTechnicalLevel(event.target.value));
  };

  const handleContinue = () => {
    if (technicalLevel) {
      navigate('/onboarding/education-level');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your Technical Level
        </Typography>
        <Typography variant="body1" paragraph>
          Please select your current technical proficiency level.
        </Typography>
      </Box>

      <FormControl component="fieldset">
        <FormLabel component="legend">Technical Level</FormLabel>
        <RadioGroup
          aria-label="technical-level"
          name="technical-level"
          value={technicalLevel || ''}
          onChange={handleChange}
        >
          <FormControlLabel value="beginner" control={<Radio />} label="Beginner" />
          <FormControlLabel value="intermediate" control={<Radio />} label="Intermediate" />
          <FormControlLabel value="advanced" control={<Radio />} label="Advanced" />
          <FormControlLabel value="expert" control={<Radio />} label="Expert" />
        </RadioGroup>
      </FormControl>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => navigate('/onboarding/skills')}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!technicalLevel}
        >
          Continue to Education Level
        </Button>
      </Box>
    </Container>
  );
};

export default TechnicalLevel;