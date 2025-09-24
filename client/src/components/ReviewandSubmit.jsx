import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingData } from '../../store/slices/onboardingSlice';
import { RootState } from '../../store/store';
import {
  Button,
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ReviewSelection: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    selectedCourses,
    selectedSkills,
    technicalLevel,
    educationLevel,
    loading
  } = useSelector((state: RootState) => state.onboarding);

  const handleSubmit = async () => {
    try {
      await dispatch(saveOnboardingData()).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    }
  };

  const technicalLevelLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert'
  };

  const educationLevelLabels: Record<string, string> = {
    high_school: 'High School',
    associate: 'Associate Degree',
    bachelor: "Bachelor's Degree",
    master: "Master's Degree",
    phd: 'PhD'
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Review Your Selections
        </Typography>
        <Typography variant="body1" paragraph>
          Please review your information before submitting.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Selected Courses</Typography>
        <List>
          {selectedCourses.map((course) => (
            <ListItem key={course._id}>
              <ListItemText primary={course.name} secondary={course.description} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Selected Skills</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedSkills.map((skill) => (
            <Chip
              key={skill._id}
              label={`${skill.name} (${skill.category})`}
              color="primary"
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Technical Level</Typography>
        <Typography>{technicalLevelLabels[technicalLevel || '']}</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Education Level</Typography>
        <Typography>{educationLevelLabels[educationLevel || '']}</Typography>
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => navigate('/onboarding/education-level')}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Submitting...' : 'Complete Onboarding'}
        </Button>
      </Box>
    </Container>
  );
};

export default ReviewSelection;