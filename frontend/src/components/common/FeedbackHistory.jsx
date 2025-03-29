import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Box, Paper, Typography, List, ListItem, ListItemText,
    Chip, Alert, Button, Divider, CircularProgress
} from '@mui/material';
import { getUserSystemFeedback, isUserAuthenticated } from '../../services/api';

// Helper to format dates nicely
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper to get severity text and color
const getSeverityProps = (level) => {
    const levels = {
        1: { label: 'Very Low', color: 'success' },
        2: { label: 'Low', color: 'success' },
        3: { label: 'Medium', color: 'warning' },
        4: { label: 'High', color: 'error' },
        5: { label: 'Critical', color: 'error' }
    };
    return levels[level] || { label: 'Unknown', color: 'default' };
};

// Helper to get status color
const getStatusColor = (status) => {
    const colors = {
        'New': 'info',
        'Under Review': 'warning',
        'In Progress': 'primary',
        'Resolved': 'success',
        'Closed': 'default'
    };
    return colors[status] || 'default';
};

const FeedbackHistory = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authRequired, setAuthRequired] = useState(false);

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!isUserAuthenticated()) {
                setAuthRequired(true);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getUserSystemFeedback();

                if (data && data.authRequired) {
                    setAuthRequired(true);
                } else {
                    setFeedback(Array.isArray(data) ? data : []);
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching feedback:', err);
                setError('Failed to load your feedback history. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    // Show loading state
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
            </Box>
        );
    }

    // Show message if auth required
    if (authRequired) {
        return (
            <Paper elevation={3} sx={{ p: 3, my: 2 }}>
                <Typography variant="h6" gutterBottom>Feedback History</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Please log in to view your feedback history.
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

    // Show error if any
    if (error) {
        return (
            <Paper elevation={3} sx={{ p: 3, my: 2 }}>
                <Typography variant="h6" gutterBottom>Feedback History</Typography>
                <Alert severity="error">{error}</Alert>
            </Paper>
        );
    }

    // Show empty state if no feedback
    if (feedback.length === 0) {
        return (
            <Paper elevation={3} sx={{ p: 3, my: 2 }}>
                <Typography variant="h6" gutterBottom>Feedback History</Typography>
                <Alert severity="info">
                    You haven&apos;t submitted any feedback yet.
                </Alert>
            </Paper>
        );
    }

    // Show feedback history
    return (
        <Paper elevation={3} sx={{ p: 3, my: 2 }}>
            <Typography variant="h6" gutterBottom>Your Feedback History</Typography>
            <List>
                {feedback.map((item, index) => {
                    const severityProps = getSeverityProps(item.severity);
                    const statusColor = getStatusColor(item.status);

                    return (
                        <React.Fragment key={item.id || index}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                                <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1" component="div" fontWeight="bold">
                                        {item.title}
                                    </Typography>
                                    <Box>
                                        <Chip
                                            label={item.status}
                                            size="small"
                                            color={statusColor}
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={`Severity: ${severityProps.label}`}
                                            size="small"
                                            color={severityProps.color}
                                        />
                                    </Box>
                                </Box>
                                <ListItemText
                                    primary={`Category: ${item.category}`}
                                    secondary={
                                        <React.Fragment>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {item.description}
                                            </Typography>
                                            <br />
                                            <Typography variant="caption" color="text.secondary">
                                                Submitted on: {formatDate(item.createdAt)}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    );
                })}
            </List>
        </Paper>
    );
};

export default FeedbackHistory;
