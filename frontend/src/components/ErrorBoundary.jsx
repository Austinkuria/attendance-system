// src/components/ErrorBoundary.jsx
import { Component } from 'react';
import PropTypes from 'prop-types';
import { Result, Button } from 'antd';

/**
 * ErrorBoundary component to catch JavaScript errors in child components
 * and display a fallback UI rather than crashing the entire app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reloadAttempted: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    this.setState({ reloadAttempted: true });
    // Clear any cached issues that might be causing the error
    try {
      sessionStorage.removeItem('lastRoute');
      localStorage.removeItem('lastError');
      // Store current URL to restore after reload
      localStorage.setItem('recoveryUrl', window.location.pathname + window.location.search);
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    // Reload the page
    window.location.reload();
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  handleLogout = () => {
    // Clear auth data
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to login
    window.location.href = '/auth/login';
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="The application encountered an error. You can try reloading the page."
          extra={[
            <Button key="reload" type="primary" onClick={this.handleReload} disabled={this.state.reloadAttempted}>
              {this.state.reloadAttempted ? 'Reloading...' : 'Reload Page'}
            </Button>,
            <Button key="home" onClick={this.handleGoHome}>
              Go Home
            </Button>,
            <Button key="logout" danger onClick={this.handleLogout}>
              Logout
            </Button>
          ]}
        >
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
              <p><strong>Error:</strong> {this.state.error.toString()}</p>
              <p><strong>Stack:</strong></p>
              <pre style={{
                whiteSpace: 'pre-wrap',
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                overflowX: 'auto'
              }}>
                {this.state.error.stack || 'No stack trace available'}
              </pre>
            </div>
          )}
        </Result>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;