import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import { AuthProvider } from '../../src/contexts/AuthContext';
import LoginForm from '../../src/components/auth/LoginForm';
import QRScanner from '../../src/components/attendance/QRScanner';
import AttendanceCard from '../../src/components/dashboard/AttendanceCard';
import FeedbackForm from '../../src/components/feedback/FeedbackForm';
import SessionCreator from '../../src/components/lecturer/SessionCreator';
import axios from 'axios';

// Mock modules
vi.mock('axios');
vi.mock('jsqr', () => ({
    default: vi.fn().mockImplementation(() => ({
        data: JSON.stringify({
            sessionId: 'test-session-123',
            token: 'valid-qr-token',
            timestamp: new Date().getTime(),
            expiry: new Date().getTime() + 180000 // 3 minutes
        })
    }))
}));

// Authentication Module Tests
describe('Authentication Module', () => {
    const mockAuthContextValue = {
        currentUser: null,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('Login form submits credentials and handles successful login', async () => {
        // Arrange
        const mockLogin = vi.fn().mockResolvedValue({ success: true });

        render(
            <BrowserRouter>
                <AuthProvider value={{ ...mockAuthContextValue, login: mockLogin }}>
                    <ThemeProvider>
                        <LoginForm />
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        );

        // Act
        fireEvent.change(screen.getByLabelText(/Registration Number/i), {
            target: { value: 'SCT221-0001/2020' }
        });

        fireEvent.change(screen.getByLabelText(/Password/i), {
            target: { value: 'securePassword123' }
        });

        // Select student role
        fireEvent.mouseDown(screen.getByLabelText(/Role/i));
        const studentOption = await screen.findByText(/Student/i);
        fireEvent.click(studentOption);

        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        // Assert
        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                regNo: 'SCT221-0001/2020',
                password: 'securePassword123',
                role: 'student'
            });
        });
    });

    test('Login form shows error on failed authentication', async () => {
        // Arrange
        const mockLogin = vi.fn().mockRejectedValue({
            response: {
                data: { message: 'Invalid credentials' }
            }
        });

        render(
            <BrowserRouter>
                <AuthProvider value={{ ...mockAuthContextValue, login: mockLogin }}>
                    <ThemeProvider>
                        <LoginForm />
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        );

        // Act
        fireEvent.change(screen.getByLabelText(/Registration Number/i), {
            target: { value: 'wrong-id' }
        });

        fireEvent.change(screen.getByLabelText(/Password/i), {
            target: { value: 'wrongPassword' }
        });

        fireEvent.mouseDown(screen.getByLabelText(/Role/i));
        const lecturerOption = await screen.findByText(/Lecturer/i);
        fireEvent.click(lecturerOption);

        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        // Assert
        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
        });
    });

    test('Password visibility toggle works correctly', () => {
        // Arrange
        render(
            <BrowserRouter>
                <AuthProvider value={mockAuthContextValue}>
                    <ThemeProvider>
                        <LoginForm />
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        );

        // Act & Assert - Password starts as hidden
        const passwordInput = screen.getByLabelText(/Password/i);
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Click visibility toggle
        const visibilityToggle = screen.getByRole('button', { name: /toggle password visibility/i });
        fireEvent.click(visibilityToggle);

        // Password should now be visible
        expect(passwordInput).toHaveAttribute('type', 'text');
    });
});

// QR Code Module Tests
describe('QR Code Module', () => {
    const mockQRConfig = {
        onScan: vi.fn(),
        onError: vi.fn(),
        onPermissionDenied: vi.fn()
    };

    beforeEach(() => {
        vi.resetAllMocks();
        // Mock navigator.mediaDevices
        Object.defineProperty(global.navigator, 'mediaDevices', {
            value: {
                getUserMedia: vi.fn().mockResolvedValue({
                    getTracks: () => [{
                        stop: vi.fn()
                    }]
                })
            },
            writable: true
        });
    });

    test('QR Scanner requests camera permission on mount', async () => {
        // Arrange & Act
        render(
            <ThemeProvider>
                <QRScanner {...mockQRConfig} />
            </ThemeProvider>
        );

        // Assert
        await waitFor(() => {
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: expect.any(Object) });
        });
    });

    test('QR Scanner calls onScan with valid QR data when detected', async () => {
        // Arrange
        // Mock for successful QR scan
        const mockOnScan = vi.fn();

        render(
            <ThemeProvider>
                <QRScanner onScan={mockOnScan} onError={vi.fn()} />
            </ThemeProvider>
        );

        // Act - Simulate successful QR detection
        // This would typically involve drawing to a canvas and then processing
        // For this test, we'll call the internal scan function directly
        await act(async () => {
            // Access the component's scan function (implementation detail)
            // In a real test, you might trigger this through user interactions
            const canvasElement = screen.getByTestId('qr-canvas');
            const scanEvent = new Event('scan-successful');
            canvasElement.dispatchEvent(scanEvent);

            // Since jsQR is mocked to return valid data, this should trigger onScan
        });

        // Assert
        await waitFor(() => {
            expect(mockOnScan).toHaveBeenCalledWith(expect.objectContaining({
                sessionId: 'test-session-123',
                token: 'valid-qr-token',
            }));
        });
    });

    test('QR Scanner shows error state for expired QR codes', async () => {
        // Arrange
        vi.resetAllMocks();
        // Mock jsQR to return expired QR code data
        const expiredQRData = {
            sessionId: 'expired-session',
            token: 'expired-token',
            timestamp: new Date().getTime() - 400000, // 4 minutes ago
            expiry: new Date().getTime() - 100000     // Expired 100 seconds ago
        };

        const jsQRMock = vi.requireMock('jsqr');
        jsQRMock.default.mockImplementationOnce(() => ({
            data: JSON.stringify(expiredQRData)
        }));

        // Mock the API validation response
        axios.post.mockRejectedValueOnce({
            response: {
                status: 400,
                data: { message: 'QR code has expired' }
            }
        });

        render(
            <ThemeProvider>
                <QRScanner onScan={vi.fn()} onError={vi.fn()} />
            </ThemeProvider>
        );

        // Act - Simulate QR scan with expired code
        await act(async () => {
            const canvasElement = screen.getByTestId('qr-canvas');
            const scanEvent = new Event('scan-detected');
            canvasElement.dispatchEvent(scanEvent);
        });

        // Assert - Should show expiration error
        await waitFor(() => {
            expect(screen.getByText(/QR code has expired/i)).toBeInTheDocument();
        });
    });
});

// Attendance Module Tests
describe('Attendance Module', () => {
    test('Attendance Card shows correct attendance percentage and status color', () => {
        // Arrange
        const goodAttendanceProps = {
            unitName: 'Mobile Application Development',
            unitCode: 'SE401',
            attendanceRate: 85,
            isActive: false
        };

        const warningAttendanceProps = {
            unitName: 'Database Systems',
            unitCode: 'SE402',
            attendanceRate: 65,
            isActive: false
        };

        const criticalAttendanceProps = {
            unitName: 'Software Engineering',
            unitCode: 'SE403',
            attendanceRate: 45,
            isActive: false
        };

        // Act
        const { rerender } = render(
            <ThemeProvider>
                <AttendanceCard {...goodAttendanceProps} />
            </ThemeProvider>
        );

        // Assert - Good attendance (green)
        expect(screen.getByText('85%')).toBeInTheDocument();
        const goodProgressBar = screen.getByRole('progressbar');
        expect(goodProgressBar).toHaveStyle('background-color: #52c41a'); // Green

        // Act - Warning attendance (yellow)
        rerender(
            <ThemeProvider>
                <AttendanceCard {...warningAttendanceProps} />
            </ThemeProvider>
        );

        // Assert
        expect(screen.getByText('65%')).toBeInTheDocument();
        const warningProgressBar = screen.getByRole('progressbar');
        expect(warningProgressBar).toHaveStyle('background-color: #faad14'); // Yellow

        // Act - Critical attendance (red)
        rerender(
            <ThemeProvider>
                <AttendanceCard {...criticalAttendanceProps} />
            </ThemeProvider>
        );

        // Assert
        expect(screen.getByText('45%')).toBeInTheDocument();
        const criticalProgressBar = screen.getByRole('progressbar');
        expect(criticalProgressBar).toHaveStyle('background-color: #f5222d'); // Red
    });

    test('Active session indicator appears when session is active', () => {
        // Arrange
        const activeSessionProps = {
            unitName: 'Mobile Application Development',
            unitCode: 'SE401',
            attendanceRate: 85,
            isActive: true,
            sessionEndsAt: new Date(Date.now() + 30 * 60000) // 30 minutes from now
        };

        // Act
        render(
            <ThemeProvider>
                <AttendanceCard {...activeSessionProps} />
            </ThemeProvider>
        );

        // Assert
        expect(screen.getByText(/Active Session/i)).toBeInTheDocument();
        expect(screen.getByText(/Ends in/i)).toBeInTheDocument();
    });
});

// Feedback Module Tests
describe('Feedback Module', () => {
    test('Feedback form submits correct data', async () => {
        // Arrange
        const mockSubmit = vi.fn().mockResolvedValue({ success: true });
        const sessionData = {
            _id: 'session-123',
            unit: {
                _id: 'unit-456',
                name: 'Mobile Application Development',
                code: 'SE401'
            },
            course: {
                _id: 'course-789',
                name: 'Software Engineering'
            }
        };

        render(
            <ThemeProvider>
                <FeedbackForm session={sessionData} onSubmit={mockSubmit} />
            </ThemeProvider>
        );

        // Act
        // Set rating
        fireEvent.click(screen.getAllByRole('radio')[4]); // 5-star rating

        // Set pace
        fireEvent.change(screen.getByLabelText(/Pace/i), {
            target: { value: 75 }
        });

        // Set clarity
        fireEvent.click(screen.getByLabelText(/Yes, content was clear/i));

        // Add comment
        fireEvent.change(screen.getByLabelText(/Comments/i), {
            target: { value: 'Great session, very informative!' }
        });

        // Set anonymous
        fireEvent.click(screen.getByLabelText(/Submit anonymously/i));

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

        // Assert
        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith({
                sessionId: 'session-123',
                unit: 'unit-456',
                course: 'course-789',
                rating: 5,
                pace: 75,
                clarity: true,
                feedbackText: 'Great session, very informative!',
                anonymous: true
            });
        });
    });

    test('Feedback form validates required fields', async () => {
        // Arrange
        const mockSubmit = vi.fn();
        const sessionData = {
            _id: 'session-123',
            unit: {
                _id: 'unit-456',
                name: 'Mobile Application Development',
                code: 'SE401'
            },
            course: {
                _id: 'course-789',
                name: 'Software Engineering'
            }
        };

        render(
            <ThemeProvider>
                <FeedbackForm session={sessionData} onSubmit={mockSubmit} />
            </ThemeProvider>
        );

        // Act - Submit without setting rating (required field)
        fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

        // Assert
        await waitFor(() => {
            expect(screen.getByText(/Please rate this session/i)).toBeInTheDocument();
        });
        expect(mockSubmit).not.toHaveBeenCalled();
    });
});

// Lecturer Session Management Tests
describe('Lecturer Session Management', () => {
    test('Session Creator form creates new session', async () => {
        // Arrange
        const mockUnits = [
            { _id: 'unit-1', name: 'Mobile Application Development', code: 'SE401' },
            { _id: 'unit-2', name: 'Database Systems', code: 'SE402' }
        ];

        const mockCreateSession = vi.fn().mockResolvedValue({
            success: true,
            session: {
                _id: 'new-session-123',
                unit: 'unit-1',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 60 * 60000).toISOString() // 1 hour session
            }
        });

        render(
            <ThemeProvider>
                <SessionCreator
                    units={mockUnits}
                    onCreateSession={mockCreateSession}
                />
            </ThemeProvider>
        );

        // Act
        // Select unit
        fireEvent.mouseDown(screen.getByLabelText(/Select Unit/i));
        const unitOption = await screen.findByText(/Mobile Application Development/i);
        fireEvent.click(unitOption);

        // Select duration
        fireEvent.mouseDown(screen.getByLabelText(/Duration/i));
        const durationOption = await screen.findByText(/60 minutes/i);
        fireEvent.click(durationOption);

        // Select type
        fireEvent.mouseDown(screen.getByLabelText(/Session Type/i));
        const typeOption = await screen.findByText(/Lecture/i);
        fireEvent.click(typeOption);

        // Enter location
        fireEvent.change(screen.getByLabelText(/Location/i), {
            target: { value: 'Room 301' }
        });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Create Session/i }));

        // Assert
        await waitFor(() => {
            expect(mockCreateSession).toHaveBeenCalledWith({
                unitId: 'unit-1',
                duration: 60,
                sessionType: 'Lecture',
                location: 'Room 301'
            });
        });
    });

    test('QR code refreshes automatically after 3 minutes', async () => {
        // Arrange
        vi.useFakeTimers();
        const mockRegenerateQR = vi.fn().mockResolvedValue({
            success: true,
            newQrCode: 'data:image/png;base64,newQrCodeData',
            qrExpiresAt: new Date(Date.now() + 180000).toISOString() // 3 minutes from now
        });

        const sessionProps = {
            session: {
                _id: 'session-123',
                unit: { name: 'Mobile Application Development', code: 'SE401' },
                qrCode: 'data:image/png;base64,initialQrCodeData',
                qrExpiresAt: new Date(Date.now() + 180000).toISOString(), // 3 minutes from now
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 60 * 60000).toISOString() // 1 hour session
            },
            regenerateQR: mockRegenerateQR
        };

        render(
            <ThemeProvider>
                <QRDisplay {...sessionProps} />
            </ThemeProvider>
        );

        // Initial QR code should be displayed
        expect(screen.getByAltText(/QR Code/i).src).toContain('initialQrCodeData');

        // Act - Fast forward time by 3 minutes
        act(() => {
            vi.advanceTimersByTime(180000); // 3 minutes
        });

        // Assert - Should have called to regenerate QR
        await waitFor(() => {
            expect(mockRegenerateQR).toHaveBeenCalledWith('session-123');
        });

        // After QR regeneration, the new QR should be displayed
        await waitFor(() => {
            expect(screen.getByAltText(/QR Code/i).src).toContain('newQrCodeData');
        });

        // Cleanup
        vi.useRealTimers();
    });
});
