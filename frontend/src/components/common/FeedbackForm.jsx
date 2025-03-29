import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, Button, TextField, Typography, MenuItem, 
  Grid, Paper, Alert, Rating 
} from '@mui/material';
import { submitSystemFeedback, isUserAuthenticated } from '../../services/api';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    severity: 3,
    screenshot: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const categories = [
    'Bug',
    'Feature Request',
    'UI Improvement',
    'Performance Issue',
    'Other'
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const handleSeverityChange = (_, newValue) => {
    setFormData({
      ...formData,
      severity: newValue
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.severity) newErrors.severity = 'Severity rating is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication
    if (!isUserAuthenticated()) {
      setApiError('You need to be logged in to submit feedback.');
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      const response = await submitSystemFeedback(formData);
      
      if (response.authRequired) {
        setApiError('Please log in to submit feedback.');
        return;
      }
      
      if (response.success) {
        setSubmitted(true);
        setApiError(null);
        // Reset form
        setFormData({
          title: '',
          category: '',
          description: '',
          severity: 3,
          screenshot: ''
        });
      } else {
        setApiError(response.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setApiError(error.message || 'An unexpected error occurred');
    }
  };
  
  // If user is not authenticated, show login message
  if (!isUserAuthenticated()) {
    return (
      <Paper elevation={3} sx={{ p: 3, my: 2 }}>
        <Typography variant="h6" gutterBottom>System Feedback</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Please log in to submit feedback or view your feedback history.
        </Alert>
        <Button 
          component={Link} 
          to="/auth/login" 
          variant="contained" 
          color="primary"
          sx={{ mr: 1 }}
        >
          Login
        </Button>
        <Button 
          component={Link} 
          to="/auth/signup" 
          variant="outlined" 
          color="primary"
        >
          Sign Up
        </Button>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={3} sx={{ p: 3, my: 2 }}>
      <Typography variant="h6" gutterBottom>Submit System Feedback</Typography>
      
      {submitted && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Feedback submitted successfully!
        </Alert>
      )}
      
      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={!!errors.category}
              helperText={errors.category}
              required
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography component="legend">Severity</Typography>
            <Rating
              name="severity"
              value={formData.severity}
              onChange={handleSeverityChange}
              max={5}
            />
            {errors.severity && (
              <Typography color="error" variant="caption">
                {errors.severity}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={4}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Screenshot URL (optional)"
              name="screenshot"
              value={formData.screenshot}
              onChange={handleChange}
              placeholder="https://example.com/screenshot.jpg"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth
            >
              Submit Feedback
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default FeedbackForm;
