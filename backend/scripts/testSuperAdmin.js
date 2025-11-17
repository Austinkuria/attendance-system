/**
 * Quick test for super admin endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testSuperAdminEndpoint() {
    try {
        console.log('🔍 Testing Super Admin Endpoint...\n');

        // Step 1: Login as super admin
        console.log('1️⃣ Logging in as super admin...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'devhubmailer@gmail.com',
            password: 'SuperAdmin@2025'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed');
            return;
        }

        const accessToken = loginResponse.data.accessToken;
        console.log('✅ Login successful');
        console.log(`   Token: ${accessToken.substring(0, 50)}...\n`);

        // Step 2: Test super admin endpoint
        console.log('2️⃣ Testing GET /api/super-admin/departments...');
        const departmentsResponse = await axios.get(`${API_BASE}/super-admin/departments`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('✅ Super admin endpoint works!');
        console.log(`   Found ${departmentsResponse.data.departments?.length || 0} departments\n`);

        // Step 3: Test department admins endpoint
        console.log('3️⃣ Testing GET /api/super-admin/department-admins...');
        const adminsResponse = await axios.get(`${API_BASE}/super-admin/department-admins`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('✅ Department admins endpoint works!');
        console.log(`   Found ${adminsResponse.data.admins?.length || 0} department admins\n`);

        console.log('🎉 All super admin endpoints are working correctly!\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.response?.status || error.message);
        console.error('   URL:', error.config?.url);
        console.error('   Message:', error.response?.data?.message || error.message);

        if (error.response?.status === 404) {
            console.error('\n📍 DIAGNOSIS: Route not found (404)');
            console.error('   This means the endpoint /api/super-admin is not registered');
            console.error('   Check that superAdminRoutes is properly imported and mounted\n');
        }
    }
}

testSuperAdminEndpoint();
