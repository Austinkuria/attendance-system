import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/pages/AuthenticationPages/Login';
import { ThemeContext } from '../src/context/ThemeContext';

const mockThemeContext = {
  themeColors: {
    primary: '#1890ff',
    background: '#ffffff',
    cardBg: '#ffffff',
    text: '#000000',
    border: '#d9d9d9',
    inputBg: '#ffffff',
    inputBorder: '#d9d9d9'
  },
  isDarkMode: false
};

describe('Login Component Tests', () => {
  it('renders login form and demo reviewer access buttons', () => {
    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockThemeContext}>
          <Login />
        </ThemeContext.Provider>
      </BrowserRouter>
    );

    // Assert header
    expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument();

    // Assert Quick Demo access section is rendered
    expect(screen.getByText(/Quick Demo Access:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Student Demo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lecturer Demo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admin Demo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Super Admin/i })).toBeInTheDocument();

    // Assert form input fields exist
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });
});
