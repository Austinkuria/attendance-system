/**
 * Authentication System Test Script
 * Tests login, token refresh, and logout functionality
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test credentials
const TEST_USERS = {
    superAdmin: {
        email: 'devhubmailer@gmail.com',
        password: 'SuperAdmin@2025',
        role: 'super_admin'
    },
    deptAdmin: {
        email: 'austinmaina.dev+admin@gmail.com',
        password: 'Admin@2025',
        role: 'department_admin'
    },
    lecturer: {
        email: 'austinmaina.dev+lecturer@gmail.com',
        password: 'Lecturer@2025',
        role: 'lecturer'
    },
    student: {
        email: 'austinmaina.dev+student1@gmail.com',
        password: 'Student@2025',
        role: 'student'
    }
};

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.magenta}▶${colors.reset} ${msg}`)
};

/**
 * Test login functionality
 */
async function testLogin(userType, credentials) {
    log.section(`Testing ${userType} login...`);

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password
        });

        if (response.data.success) {
            log.success(`Login successful for ${userType}`);
            log.info(`  User: ${response.data.user.firstName} ${response.data.user.lastName}`);
            log.info(`  Role: ${response.data.user.role}`);
            log.info(`  Email: ${response.data.user.email}`);
            log.info(`  Verified: ${response.data.user.isVerified}`);
            log.info(`  Access Token: ${response.data.accessToken.substring(0, 50)}...`);
            log.info(`  Refresh Token: ${response.data.refreshToken.substring(0, 50)}...`);

            return {
                success: true,
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                user: response.data.user
            };
        } else {
            log.error(`Login failed for ${userType}`);
            return { success: false };
        }
    } catch (error) {
        log.error(`Login error for ${userType}: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.attemptsRemaining !== undefined) {
            log.warning(`  Attempts remaining: ${error.response.data.attemptsRemaining}`);
        }
        return { success: false, error: error.response?.data };
    }
}

/**
 * Test authenticated request
 */
async function testAuthenticatedRequest(accessToken, endpoint, userType) {
    log.section(`Testing authenticated request for ${userType}...`);

    try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.data) {
            log.success(`Authenticated request successful for ${userType}`);
            return { success: true, data: response.data };
        }
    } catch (error) {
        log.error(`Authenticated request failed: ${error.response?.data?.message || error.message}`);
        return { success: false, error: error.response?.data };
    }
}

/**
 * Test token refresh
 */
async function testTokenRefresh(refreshToken, userType) {
    log.section(`Testing token refresh for ${userType}...`);

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
        });

        if (response.data.success) {
            log.success(`Token refresh successful for ${userType}`);
            log.info(`  New Access Token: ${response.data.accessToken.substring(0, 50)}...`);
            return {
                success: true,
                accessToken: response.data.accessToken
            };
        }
    } catch (error) {
        log.error(`Token refresh failed: ${error.response?.data?.message || error.message}`);
        return { success: false, error: error.response?.data };
    }
}

/**
 * Test logout
 */
async function testLogout(accessToken, refreshToken, userType) {
    log.section(`Testing logout for ${userType}...`);

    try {
        const response = await axios.post(
            `${API_BASE_URL}/auth/logout`,
            { refreshToken: refreshToken },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (response.data.success) {
            log.success(`Logout successful for ${userType}`);
            return { success: true };
        }
    } catch (error) {
        log.error(`Logout failed: ${error.response?.data?.message || error.message}`);
        return { success: false, error: error.response?.data };
    }
}

/**
 * Test failed login attempts (account lockout)
 */
async function testAccountLockout() {
    log.section('Testing account lockout after failed attempts...');

    const testEmail = 'austinmaina.dev+student2@gmail.com';
    const wrongPassword = 'WrongPassword123';

    log.info(`Attempting 5 failed logins for: ${testEmail}`);

    for (let i = 1; i <= 5; i++) {
        try {
            await axios.post(`${API_BASE_URL}/auth/login`, {
                email: testEmail,
                password: wrongPassword
            });
        } catch (error) {
            if (error.response?.status === 423) {
                log.warning(`  Account locked after ${i} attempts`);
                log.info(`  Lock message: ${error.response.data.message}`);
                return { success: true, lockedAt: i };
            } else {
                log.info(`  Attempt ${i}: Failed (${error.response?.data?.attemptsRemaining || 0} remaining)`);
            }
        }
    }

    // Try one more time to confirm it's locked
    try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testEmail,
            password: wrongPassword
        });
    } catch (error) {
        if (error.response?.status === 423) {
            log.success('Account lockout working correctly');
            return { success: true, lockedAt: 5 };
        }
    }

    log.error('Account lockout test failed - account should be locked');
    return { success: false };
}

/**
 * Test invalid token
 */
async function testInvalidToken() {
    log.section('Testing invalid token handling...');

    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';

    try {
        await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${invalidToken}`
            }
        });

        log.error('Invalid token was accepted (should have been rejected)');
        return { success: false };
    } catch (error) {
        if (error.response?.status === 401) {
            log.success('Invalid token correctly rejected');
            return { success: true };
        } else {
            log.warning(`Unexpected error: ${error.response?.data?.message || error.message}`);
            return { success: false };
        }
    }
}

/**
 * Test email verification check
 */
async function testEmailVerificationCheck() {
    log.section('Testing email verification requirement...');

    // All seeded users should be pre-verified
    const result = await testLogin('Pre-verified Student', TEST_USERS.student);

    if (result.success && result.user.isVerified) {
        log.success('Email verification check passed (user is pre-verified)');
        return { success: true };
    } else if (!result.success && result.error?.code === 'EMAIL_NOT_VERIFIED') {
        log.success('Email verification check working (unverified user rejected)');
        return { success: true };
    } else {
        log.warning('Email verification status unclear');
        return { success: false };
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    log.title('═══════════════════════════════════════════════════════');
    log.title('   AUTHENTICATION SYSTEM TEST SUITE');
    log.title('═══════════════════════════════════════════════════════');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    try {
        // Test 1: Login for each role
        log.title('\n1. LOGIN TESTS');

        const loginResults = {};
        for (const [userType, credentials] of Object.entries(TEST_USERS)) {
            const result = await testLogin(userType, credentials);
            loginResults[userType] = result;

            if (result.success) {
                results.passed++;
            } else {
                results.failed++;
            }
            results.tests.push({ name: `Login - ${userType}`, success: result.success });
        }

        // Test 2: Authenticated requests
        log.title('\n2. AUTHENTICATED REQUEST TESTS');

        const studentResult = loginResults.student;
        if (studentResult.success) {
            const authResult = await testAuthenticatedRequest(
                studentResult.accessToken,
                '/auth/me',
                'student'
            );

            if (authResult.success) {
                results.passed++;
            } else {
                results.failed++;
            }
            results.tests.push({ name: 'Authenticated Request', success: authResult.success });
        }

        // Test 3: Token refresh
        log.title('\n3. TOKEN REFRESH TESTS');

        if (studentResult.success) {
            const refreshResult = await testTokenRefresh(studentResult.refreshToken, 'student');

            if (refreshResult.success) {
                results.passed++;
            } else {
                results.failed++;
            }
            results.tests.push({ name: 'Token Refresh', success: refreshResult.success });
        }

        // Test 4: Invalid token
        log.title('\n4. SECURITY TESTS');

        const invalidTokenResult = await testInvalidToken();
        if (invalidTokenResult.success) {
            results.passed++;
        } else {
            results.failed++;
        }
        results.tests.push({ name: 'Invalid Token Rejection', success: invalidTokenResult.success });

        // Test 5: Email verification
        const emailVerifyResult = await testEmailVerificationCheck();
        if (emailVerifyResult.success) {
            results.passed++;
        } else {
            results.failed++;
        }
        results.tests.push({ name: 'Email Verification Check', success: emailVerifyResult.success });

        // Test 6: Account lockout (optional - may lock test account)
        // Uncomment if you want to test account lockout
        /*
        const lockoutResult = await testAccountLockout();
        if (lockoutResult.success) {
            results.passed++;
        } else {
            results.failed++;
        }
        results.tests.push({ name: 'Account Lockout', success: lockoutResult.success });
        */

        // Test 7: Logout
        log.title('\n5. LOGOUT TESTS');

        if (studentResult.success) {
            const logoutResult = await testLogout(
                studentResult.accessToken,
                studentResult.refreshToken,
                'student'
            );

            if (logoutResult.success) {
                results.passed++;
            } else {
                results.failed++;
            }
            results.tests.push({ name: 'Logout', success: logoutResult.success });
        }

    } catch (error) {
        log.error(`Fatal error during testing: ${error.message}`);
    }

    // Print summary
    log.title('\n═══════════════════════════════════════════════════════');
    log.title('   TEST SUMMARY');
    log.title('═══════════════════════════════════════════════════════\n');

    results.tests.forEach((test, index) => {
        if (test.success) {
            log.success(`${index + 1}. ${test.name}`);
        } else {
            log.error(`${index + 1}. ${test.name}`);
        }
    });

    console.log('\n' + '─'.repeat(55));
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset} | ${colors.red}Failed: ${results.failed}${colors.reset} | Total: ${results.passed + results.failed}`);
    console.log('─'.repeat(55) + '\n');

    if (results.failed === 0) {
        log.success('All tests passed! 🎉');
    } else {
        log.warning(`${results.failed} test(s) failed. Please review the output above.`);
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Check if server is running before starting tests
async function checkServer() {
    log.info('Checking if server is running...');

    try {
        await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
        log.success('Server is running\n');
        return true;
    } catch (error) {
        log.error('Server is not running or not reachable');
        log.info(`Please start the server first: npm start`);
        log.info(`Expected server URL: ${API_BASE_URL.replace('/api', '')}\n`);
        return false;
    }
}

// Main execution
(async () => {
    const serverRunning = await checkServer();

    if (serverRunning) {
        await runAllTests();
    } else {
        process.exit(1);
    }
})();
