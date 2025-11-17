import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                localStorage.setItem('accessToken', response.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ============================================
// DASHBOARD & STATISTICS
// ============================================

export const getSystemStats = async () => {
    const response = await api.get('/super-admin/stats');
    return response.data;
};

export const getDashboardData = async () => {
    const response = await api.get('/super-admin/dashboard');
    return response.data;
};

// ============================================
// DEPARTMENT MANAGEMENT
// ============================================

export const getDepartments = async (params = {}) => {
    const response = await api.get('/super-admin/departments', { params });
    return response.data;
};

export const getDepartmentById = async (id) => {
    const response = await api.get(`/super-admin/departments/${id}`);
    return response.data;
};

export const createDepartment = async (departmentData) => {
    const response = await api.post('/super-admin/departments', departmentData);
    return response.data;
};

export const updateDepartment = async (id, departmentData) => {
    const response = await api.put(`/super-admin/departments/${id}`, departmentData);
    return response.data;
};

export const deleteDepartment = async (id) => {
    const response = await api.delete(`/super-admin/departments/${id}`);
    return response.data;
};

// ============================================
// DEPARTMENT ADMIN MANAGEMENT
// ============================================

export const getDepartmentAdmins = async (params = {}) => {
    const response = await api.get('/super-admin/department-admins', { params });
    return response.data;
};

export const getDepartmentAdminById = async (id) => {
    const response = await api.get(`/super-admin/department-admins/${id}`);
    return response.data;
};

export const createDepartmentAdmin = async (adminData) => {
    const response = await api.post('/super-admin/department-admins', adminData);
    return response.data;
};

export const updateDepartmentAdmin = async (id, adminData) => {
    const response = await api.put(`/super-admin/department-admins/${id}`, adminData);
    return response.data;
};

export const deleteDepartmentAdmin = async (id) => {
    const response = await api.delete(`/super-admin/department-admins/${id}`);
    return response.data;
};

export const assignDepartments = async (adminId, departmentIds) => {
    const response = await api.post(`/super-admin/department-admins/${adminId}/assign-departments`, {
        departmentIds,
    });
    return response.data;
};

export const getDepartmentAdminStats = async () => {
    const response = await api.get('/super-admin/department-admins/stats');
    return response.data;
};

// ============================================
// USER MANAGEMENT (ALL ROLES)
// ============================================

export const getAllUsers = async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
};

export const getUserById = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const updateUser = async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
};

export const deactivateUser = async (id) => {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data;
};

export const activateUser = async (id) => {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data;
};

export const resetUserPassword = async (id) => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
};

// ============================================
// REPORTS & ANALYTICS
// ============================================

export const generateReport = async (reportType, params = {}) => {
    const response = await api.post('/super-admin/reports/generate', {
        reportType,
        ...params,
    });
    return response.data;
};

export const exportData = async (exportType, params = {}) => {
    const response = await api.post(
        '/super-admin/export',
        { exportType, ...params },
        { responseType: 'blob' }
    );
    return response.data;
};

export const getAnalytics = async (params = {}) => {
    const response = await api.get('/super-admin/analytics', { params });
    return response.data;
};

// ============================================
// ACTIVITY LOGS
// ============================================

export const getActivityLogs = async (params = {}) => {
    const response = await api.get('/super-admin/logs', { params });
    return response.data;
};

export const searchLogs = async (searchParams) => {
    const response = await api.post('/super-admin/logs/search', searchParams);
    return response.data;
};

// ============================================
// SYSTEM SETTINGS
// ============================================

export const getSystemSettings = async () => {
    const response = await api.get('/super-admin/settings');
    return response.data;
};

export const updateSystemSettings = async (settings) => {
    const response = await api.put('/super-admin/settings', settings);
    return response.data;
};

export const testEmailConfig = async () => {
    const response = await api.post('/super-admin/settings/test-email');
    return response.data;
};

export const triggerBackup = async () => {
    const response = await api.post('/super-admin/backup');
    return response.data;
};

export default api;
