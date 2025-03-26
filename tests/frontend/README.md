# Frontend Testing Documentation

This directory contains automated tests for the frontend components of the QR Code-based Smart Attendance System. The tests are designed to validate the functionality of key modules including authentication, QR code scanning, attendance tracking, and feedback collection.

## Test Structure

Tests are organized by functional module:
- Authentication Module Tests
- QR Code Module Tests
- Attendance Module Tests
- Feedback Module Tests
- Lecturer Session Management Tests

## Running Tests

To run the tests:

```bash
# Run all frontend tests
npm run test:frontend

# Run tests with coverage report
npm run test:coverage
```

## Key Testing Areas

### Authentication Testing
- Login form validation
- Successful and failed authentication flows
- JWT token handling
- Role-based access control
- Password visibility toggling

### QR Code Testing
- Camera permissions handling
- QR code scanning functionality
- Expired QR code detection
- Device fingerprinting validation
- Error state handling

### Attendance Testing
- Attendance rate calculation
- Status visualization (color coding)
- Active session detection
- Session countdown accuracy
- Attendance record synchronization

### Feedback Testing
- Form validation
- Rating system functionality
- Anonymous feedback option
- Form submission handling
- Error states and user guidance

### Session Management Testing
- Session creation workflow
- QR code generation
- 3-minute QR code rotation
- Real-time attendance monitoring
- Session termination handling

## Mock Strategy

The tests use mocks for:
- API calls (using axios mock)
- Camera access (using navigator.mediaDevices mock)
- QR code scanning (using jsQR mock)
- Authentication context
- Date/time functionality for predictable testing

## Test Coverage Goals

We aim for comprehensive test coverage of critical functionality:
- Core user workflows: 90%+ coverage
- UI components: 80%+ coverage
- Error handling paths: 75%+ coverage
- Edge cases: 70%+ coverage

## Best Practices

When adding or modifying tests:
1. Focus on testing behavior, not implementation details
2. Use descriptive test names that explain the expected behavior
3. Follow the Arrange-Act-Assert pattern
4. Mock external dependencies appropriately
5. Test both success and failure scenarios
6. Ensure tests are deterministic (no random failures)
7. Keep tests independent and isolated from each other
