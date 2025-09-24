import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSkillsForCourse, selectSkill, removeSkill } from '../../store/slices/onboardingSlice.js';
import { RootState } from '../../store/store.js';
import { Button, Checkbox, FormControlLabel, List, ListItem, Container, Box, Typography, CircularProgress } from '@mui/material';

const SkillSelection: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedCourses, skills, selectedSkills, loading, error } = useSelector(
    (state: RootState) => state.onboarding
  );

  useEffect(() => {
    // Fetch skills for all selected courses
    selectedCourses.forEach(course => {
      dispatch(fetchSkillsForCourse(course._id));
    });
  }, [dispatch, selectedCourses]);

  const handleToggleSkill = (skill: any) => {
    if (selectedSkills.some(s => s._id === skill._id)) {
      dispatch(removeSkill(skill._id));
    } else {
      dispatch(selectSkill(skill));
    }
  };

  const handleContinue = () => {
    if (selectedSkills.length > 0) {
      navigate('/onboarding/technical-level');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Select Your Skills
        </Typography>
        <Typography variant="body1" paragraph>
          Choose the skills you have experience with.
        </Typography>
      </Box>

      <List>
        {skills.map((skill) => (
          <ListItem key={skill._id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedSkills.some(s => s._id === skill._id)}
                  onChange={() => handleToggleSkill(skill)}
                />
              }
              label={`${skill.name} (${skill.category})`}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => navigate('/onboarding/courses')}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={selectedSkills.length === 0}
        >
          Continue to Technical Level
        </Button>
      </Box>
    </Container>
  );
};

export default SkillSelection;