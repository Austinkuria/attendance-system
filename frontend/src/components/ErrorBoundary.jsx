// src/components/ErrorBoundary.jsx
import React, { Component } from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    // Clear session-specific localStorage items that might be causing issues
    try {
      // Keep the token and user info but clear problematic items
      localStorage.removeItem('currentSession');
      localStorage.removeItem('lastScanTime');
      localStorage.removeItem('qrData');

      // Reload the page for a fresh start
      window.location.reload();
    } catch (err) {
      console.error("Error in reset handler:", err);
      // Force a hard reload as a last resort
      window.location.href = '/student-dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const isDependencyError = errorMessage.includes('Cannot access') ||
        errorMessage.includes('undefined is not');

      // Show a friendly error message
      return (
        <Result
          status="error"
          title="Oops! Something went wrong."
          subTitle={`${isDependencyError ?
            "There was a problem loading this page. " :
            "We encountered an unexpected error. "}Please try again.`}
          extra={[
            <Button type="primary" key="reload" onClick={this.handleReset}>
              Reload Page
            </Button>,
            <Button key="dashboard" onClick={() => window.location.href = '/student-dashboard'}>
              Return to Dashboard
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;