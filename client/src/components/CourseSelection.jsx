import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCourses, selectCourse, removeCourse } from '../../store/slices/onboardingSlice';
import { RootState } from '../../store/store';
import { Button, Card, CardContent, Typography, Grid, Container, Box, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const CourseSelection: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses, selectedCourses, loading, error } = useSelector((state: RootState) => state.onboarding);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const handleSelectCourse = (course: any) => {
    if (selectedCourses.some(c => c._id === course._id)) {
      dispatch(removeCourse(course._id));
    } else {
      dispatch(selectCourse(course));
    }
  };

  const handleContinue = () => {
    if (selectedCourses.length > 0) {
      navigate('/onboarding/skills');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Select Your Courses
        </Typography>
        <Typography variant="body1" paragraph>
          Choose the courses that match your background and interests.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card
              onClick={() => handleSelectCourse(course)}
              sx={{
                cursor: 'pointer',
                border: selectedCourses.some(c => c._id === course._id) ? '2px solid #1976d2' : '1px solid rgba(0, 0, 0, 0.12)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">{course.name}</Typography>
                  {selectedCourses.some(c => c._id === course._id) && (
                    <CheckCircleIcon color="primary" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {course.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={selectedCourses.length === 0}
        >
          Continue to Skills
        </Button>
      </Box>
    </Container>
  );
};

export default CourseSelection;